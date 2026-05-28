import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/messages")({
  head: () => ({ meta: [{ title: "Messages — Omnicraft" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
        <MessageCircle className="w-12 h-12 mx-auto text-indigo-500 mb-3" />
        <h3 className="text-xl font-bold mb-1">No messages yet</h3>
        <p className="text-gray-600">Conversations with clients and creators will appear here.</p>
      </div>
    </div>
  );
}
