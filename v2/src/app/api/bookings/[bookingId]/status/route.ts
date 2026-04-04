import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { json, errorResponse, withErrorHandler, parseBody } from "@/lib/api-utils";
import { createNotification } from "@/lib/notifications";
import { sendBookingStatusEmail } from "@/lib/email";

// PUT /api/bookings/:bookingId/status - Update booking status
export const PUT = withErrorHandler(async (req: NextRequest, ctx) => {
  const { bookingId } = await ctx.params;
  const user = await requireAuth(req);
  const body = await parseBody<{ action: string; reason?: string; new_date?: string; new_time?: string }>(req);

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return errorResponse("Booking not found", 404);

  const provider = await prisma.provider.findUnique({ where: { userId: user.id }, select: { id: true, userId: true } });
  const isProvider = provider?.id === booking.providerId;
  const isUser = booking.userId === user.id;
  const isAdmin = user.role === "admin";
  const now = new Date();

  if (!isProvider && !isUser && !isAdmin) return errorResponse("Not authorized", 403);

  switch (body.action) {
    case "confirm": {
      if (!isProvider && !isAdmin) return errorResponse("Only provider can confirm", 403);
      if (booking.status !== "pending") return errorResponse("Can only confirm pending bookings", 400);
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "confirmed", confirmedAt: now } });
      await createNotification(booking.userId, "booking_confirmed", "ההזמנה אושרה!", `ההזמנה #${booking.bookingNumber} אושרה`, { booking_id: bookingId });
      break;
    }
    case "reject": {
      if (!isProvider && !isAdmin) return errorResponse("Only provider can reject", 403);
      if (booking.status !== "pending") return errorResponse("Can only reject pending bookings", 400);
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "rejected" } });
      await createNotification(booking.userId, "booking_cancelled", "ההזמנה נדחתה", `ההזמנה #${booking.bookingNumber} נדחתה`, { booking_id: bookingId });
      break;
    }
    case "cancel": {
      if (isProvider) {
        // Provider can cancel directly
        await prisma.booking.update({ where: { id: bookingId }, data: { status: "cancelled", cancelledAt: now, cancelledBy: user.id, statusBeforeCancellation: booking.status } });
        await createNotification(booking.userId, "booking_cancelled", "ההזמנה בוטלה", `ההזמנה #${booking.bookingNumber} בוטלה ע\"י הספק`, { booking_id: bookingId });
      } else if (isUser) {
        // Client requests cancellation
        await prisma.booking.update({ where: { id: bookingId }, data: { status: "cancellation_requested", cancellationRequestedAt: now, cancellationRequestedBy: user.id } });
        if (provider) {
          await createNotification(provider.userId, "booking_cancellation_requested", "בקשת ביטול", `לקוח ביקש לבטל הזמנה #${booking.bookingNumber}`, { booking_id: bookingId });
        }
      }
      break;
    }
    case "approve_cancellation": {
      if (!isProvider && !isAdmin) return errorResponse("Only provider can approve cancellation", 403);
      if (booking.status !== "cancellation_requested") return errorResponse("No pending cancellation request", 400);
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "cancelled", cancelledAt: now, cancelledBy: user.id } });
      await createNotification(booking.userId, "booking_cancellation_approved", "בקשת הביטול אושרה", `בקשת הביטול להזמנה #${booking.bookingNumber} אושרה`, { booking_id: bookingId });
      break;
    }
    case "reject_cancellation": {
      if (!isProvider && !isAdmin) return errorResponse("Only provider can reject cancellation", 403);
      if (booking.status !== "cancellation_requested") return errorResponse("No pending cancellation request", 400);
      const prevStatus = booking.statusBeforeCancellation || "confirmed";
      await prisma.booking.update({ where: { id: bookingId }, data: { status: prevStatus as any, cancellationRequestedAt: null, cancellationRequestedBy: null } });
      await createNotification(booking.userId, "booking_cancellation_rejected", "בקשת הביטול נדחתה", `בקשת הביטול להזמנה #${booking.bookingNumber} נדחתה`, { booking_id: bookingId });
      break;
    }
    case "hold": {
      if (!isProvider && !isAdmin) return errorResponse("Only provider can hold", 403);
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "on_hold" } });
      break;
    }
    case "provider_complete": {
      if (!isProvider && !isAdmin) return errorResponse("Only provider can mark complete", 403);
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "provider_completed", providerCompletedAt: now } });
      await createNotification(booking.userId, "booking_provider_completed", "הספק סיים את השירות", `הספק סימן שההזמנה #${booking.bookingNumber} הושלמה. אנא אשר.`, { booking_id: bookingId });
      break;
    }
    case "client_confirm":
    case "complete": {
      if (!isUser && !isAdmin) return errorResponse("Only client can confirm completion", 403);
      await prisma.booking.update({ where: { id: bookingId }, data: { status: "completed", completedAt: now } });
      if (provider) {
        await createNotification(provider.userId, "booking_completed", "ההזמנה הושלמה!", `הלקוח אישר שההזמנה #${booking.bookingNumber} הושלמה`, { booking_id: bookingId });
      }
      break;
    }
    case "request_change": {
      if (!isProvider && !isAdmin) return errorResponse("Only provider can request change", 403);
      const changeRequest = {
        requested_by: user.id,
        new_date: body.new_date,
        new_time: body.new_time,
        reason: body.reason,
        status: "pending",
        created_at: now.toISOString(),
      };
      const existing = (booking.changeRequests as any[]) || [];
      await prisma.booking.update({ where: { id: bookingId }, data: { changeRequests: [...existing, changeRequest] } });
      await createNotification(booking.userId, "booking_change_requested", "בקשת שינוי תאריך", `הספק ביקש לשנות את מועד ההזמנה #${booking.bookingNumber}`, { booking_id: bookingId });
      break;
    }
    default:
      return errorResponse(`Unknown action: ${body.action}`, 400);
  }

  // Send status email to client
  const statusLabels: Record<string, string> = {
    confirm: "אושרה", reject: "נדחתה", cancel: "בוטלה",
    complete: "הושלמה", provider_complete: "הספק סיים",
  };
  const statusLabel = statusLabels[body.action] || body.action;
  const clientUser = await prisma.user.findUnique({ where: { id: booking.userId } });
  if (clientUser?.email) {
    sendBookingStatusEmail(clientUser.email, booking.bookingNumber, booking.serviceName || "", body.action, statusLabel).catch(() => {});
  }

  return json({ message: "Booking status updated", action: body.action });
});
