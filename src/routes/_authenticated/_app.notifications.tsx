import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Omnicraft" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
        <Bell className="w-12 h-12 mx-auto text-indigo-500 mb-3" />
        <h3 className="text-xl font-bold mb-1">You're all caught up</h3>
        <p className="text-gray-600">Likes, follows, and project updates will show up here.</p>
      </div>
    </div>
  );
}
