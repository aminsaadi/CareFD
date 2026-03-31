"use client";

import { useNotifications } from "@/context/NotificationContext";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">התראות</h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="text-teal-600 hover:underline text-sm">סמן הכל כנקרא</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500">אין התראות</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)}
              className={`bg-white rounded-xl p-4 cursor-pointer transition-colors ${n.isRead ? "opacity-70" : "border-r-4 border-teal-600"}`}>
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-900">{n.title}</h3>
                <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString("he-IL")}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
