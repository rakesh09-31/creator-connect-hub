import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Image as ImageIcon, Video, Briefcase, Send, Upload, Camera, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadFile, featureForMedia, optimizeImage, generateVideoThumbnail } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/_app/create")({
  head: () => ({ meta: [{ title: "Create — Omnicraft" }] }),
  component: CreatePage,
});

function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<"photo" | "video" | "project">("photo");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const acceptForType = type === "video" ? "video/*" : type === "photo" ? "image/*" : "image/*,video/*";

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file && !caption.trim()) {
      toast.error("Add a file or caption");
      return;
    }
    // Content safety guard — block harmful, adult, or child-unsafe content.
    const banned = /\b(nude|nudity|nsfw|porn|sex|sexual|xxx|erotic|onlyfans|escort|drug|cocaine|heroin|meth|weapon|gun|kill|suicide|self[- ]harm|terror|hate|racist|slur|abuse|child|minor|underage|loli|cp)\b/i;
    if (caption && banned.test(caption)) {
      toast.error("This post looks unsafe and can't be published. Share work related to your craft.");
      return;
    }

    setSubmitting(true);
    try {
      let mediaUrl: string | null = null;
      if (file) {
        const feature = featureForMedia(file, "post");
        const prepared = file.type.startsWith("image/") ? await optimizeImage(file) : file;
        const uploaded = await uploadFile({
          feature,
          file: prepared,
          userId: user.id,
          entityType: "post",
          onProgress: setProgress,
        });
        mediaUrl = uploaded.url;

        // Auto-generate a poster frame for videos.
        if (file.type.startsWith("video/")) {
          const poster = await generateVideoThumbnail(file);
          if (poster) {
            await uploadFile({ feature: "thumbnail", file: poster, userId: user.id, entityType: "post" }).catch(() => null);
          }
        }
      }
      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        post_type: type,
        caption: caption.trim() || null,
        media_url: mediaUrl,
      });
      if (error) throw error;
      toast.success("Posted!");
      navigate({ to: "/home" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to publish");
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  const types = [
    { id: "photo" as const, label: "Photo", icon: ImageIcon },
    { id: "video" as const, label: "Video", icon: Video },
    { id: "project" as const, label: "Project", icon: Briefcase },
  ];

  const isVideoPreview = file?.type.startsWith("video/");

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
              onClick={() => { setType(t.id); clearFile(); }}
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Media</label>

          {!file ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 flex flex-col items-center gap-2 transition"
              >
                <Upload className="w-7 h-7 text-indigo-600" />
                <span className="font-semibold text-sm">From files</span>
                <span className="text-xs text-gray-500">Pick {type === "video" ? "a video" : type === "photo" ? "an image" : "any file"}</span>
              </button>
              <button
                type="button"
                onClick={() => cameraInput.current?.click()}
                className="p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-pink-500 hover:bg-pink-50 flex flex-col items-center gap-2 transition"
              >
                <Camera className="w-7 h-7 text-pink-600" />
                <span className="font-semibold text-sm">Live capture</span>
                <span className="text-xs text-gray-500">Use your camera now</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <button type="button" onClick={clearFile} className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80">
                <X className="w-4 h-4" />
              </button>
              <div className="aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {isVideoPreview
                  ? <video src={previewUrl} className="w-full h-full object-contain" controls playsInline />
                  : <img src={previewUrl} alt="" className="w-full h-full object-cover" />}
              </div>
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept={acceptForType}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={cameraInput}
            type="file"
            accept={type === "video" ? "video/*" : "image/*"}
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
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
          {submitting ? (progress > 0 && progress < 100 ? `Uploading ${progress}%` : "Publishing...") : "Publish"}
        </button>
      </form>
    </div>
  );
}
