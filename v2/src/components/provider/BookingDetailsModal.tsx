"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, User, Phone, FileText } from "lucide-react";

const statusLabels: Record<string, string> = { pending: "ממתין", confirmed: "מאושר", completed: "הושלם", cancelled: "בוטל", in_progress: "בתהליך" };
const statusVariants: Record<string, "warning" | "teal" | "success" | "destructive" | "outline"> = { pending: "warning", confirmed: "teal", completed: "success", cancelled: "destructive" };

interface BookingDetailsModalProps { booking: any; open: boolean; onClose: () => void; }

export default function BookingDetailsModal({ booking: b, open, onClose }: BookingDetailsModalProps) {
  if (!b) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{b.serviceName || "הזמנה"}</span>
            <Badge variant={statusVariants[b.status] || "outline"}>{statusLabels[b.status] || b.status}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-carefd-gray"><CalendarDays className="w-4 h-4" /><span>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("he-IL") : "יתואם"}</span></div>
            {b.bookingTime && <div className="flex items-center gap-2 text-carefd-gray"><Clock className="w-4 h-4" /><span>{b.bookingTime}</span></div>}
            {b.clientName && <div className="flex items-center gap-2 text-carefd-gray"><User className="w-4 h-4" /><span>{b.clientName}</span></div>}
            {b.clientPhone && <div className="flex items-center gap-2 text-carefd-gray"><Phone className="w-4 h-4" /><span dir="ltr">{b.clientPhone}</span></div>}
            {b.serviceAddress && <div className="flex items-center gap-2 text-carefd-gray col-span-2"><MapPin className="w-4 h-4" /><span>{b.serviceAddress}</span></div>}
          </div>
          {b.notes && (
            <div className="bg-carefd-stone rounded-xl p-4">
              <p className="text-xs text-carefd-gray flex items-center gap-1 mb-1"><FileText className="w-3 h-3" />הערות</p>
              <p className="text-sm text-carefd-navy">{b.notes}</p>
            </div>
          )}
          {b.finalPrice && (
            <div className="text-end pt-3 border-t border-slate-100">
              <span className="text-sm text-carefd-gray">מחיר: </span>
              <span className="text-xl font-heading font-bold text-carefd-navy">{"\u20AA"}{b.finalPrice}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
