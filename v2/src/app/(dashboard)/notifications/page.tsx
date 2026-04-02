"use client";

import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>התראות</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} data-testid="mark-all-read">
            <CheckCheck className="w-4 h-4 me-1.5" />
            סמן הכל כנקרא
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">אין התראות</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => !n.isRead && markAsRead(n.id)}
              className={`p-4 cursor-pointer transition-all ${
                n.isRead ? "opacity-60" : "border-e-4 border-carefd-teal"
              }`}
            >
              <div className="flex justify-between">
                <h3 className="font-medium text-carefd-navy text-sm">{n.title}</h3>
                <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleDateString("he-IL")}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{n.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
