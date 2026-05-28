import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Image as ImageIcon, Video, Briefcase, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/create")({
  head: () => ({ meta: [{ title: "Create — Omnicraft" }] }),
  component: CreatePage,
});

function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<"photo" | "video" | "project">("photo");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!caption.trim() && !mediaUrl.trim()) {
      toast.error("Add a caption or media URL");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      post_type: type,
      caption: caption.trim() || null,
      media_url: mediaUrl.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted!");
    navigate({ to: "/home" });
  };

  const types = [
    { id: "photo" as const, label: "Photo", icon: ImageIcon },
    { id: "video" as const, label: "Video", icon: Video },
    { id: "project" as const, label: "Project", icon: Briefcase },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Create a Post</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {types.map((t) => {
          const Icon = t.icon;
          const active = type === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${
                active ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="font-semibold text-sm">{t.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Media URL (image or video)</label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
          {mediaUrl && (
            <div className="mt-3 aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            placeholder="Tell the story behind this..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Send className="w-5 h-5" />
          {submitting ? "Publishing..." : "Publish"}
        </button>
      </form>
    </div>
  );
}
