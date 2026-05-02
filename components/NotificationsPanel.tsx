"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Notification = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

export default function NotificationsPanel({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/user/notifications/read-all", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  if (notifications.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-600">Geen meldingen.</p>
    );
  }

  return (
    <div className="mt-4">
      {unreadCount > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {unreadCount} ongelezen{" "}
            {unreadCount === 1 ? "melding" : "meldingen"}
          </span>
          <button
            onClick={markAllRead}
            disabled={loading}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            Alles als gelezen markeren
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-xl border p-4 text-sm ${
              n.read
                ? "border-slate-200 bg-white text-slate-600"
                : "border-blue-200 bg-blue-50 text-slate-800"
            }`}
          >
            <p>{n.message}</p>
            <p className="mt-1 text-xs text-slate-400">
              {new Date(n.createdAt).toLocaleString("nl-NL")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
