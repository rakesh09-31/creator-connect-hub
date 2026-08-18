import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Modal } from "./SharedUI";
import { SkillSwapListing } from "./SkillSwapCard";

export default function RequestSkillSwapModal({
  listing,
  onClose,
}: {
  listing: SkillSwapListing;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    
    // Check if the current user has an active listing to swap with
    const { data: myListing, error: myListingError } = await (supabase as any)
      .from("skill_swap_listings")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (myListingError) {
      toast.error(myListingError.message);
      setBusy(false);
      return;
    }

    if (!myListing) {
      toast.error("You need an active Skill Swap listing to send a request.");
      setBusy(false);
      return;
    }

    const { error } = await (supabase as any).from("skill_swap_requests").insert({
      sender_id: user.id,
      receiver_id: listing.user_id,
      sender_listing_id: myListing.id,
      receiver_listing_id: listing.id,
      message: message.trim() || null,
      match_score: listing.match_score || null,
    });

    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Skill Swap request sent to @${listing.profile?.username}`);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`Request Skill Swap with @${listing.profile?.username}`}>
      <form onSubmit={submit} className="space-y-4">
        <div className="text-sm text-foreground/80">
          Send a request to exchange your skills with <strong>{listing.profile?.full_name || listing.profile?.username}</strong>. 
          Make sure your profile and own Skill Swap listing are up to date!
        </div>
        
        <textarea
          placeholder="Write a friendly message... (Optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        
        <button
          disabled={busy}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send Request"}
        </button>
      </form>
    </Modal>
  );
}
