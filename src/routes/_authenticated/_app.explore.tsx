import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/explore")({
  head: () => ({ meta: [{ title: "Explore — Omnicraft" }] }),
  component: ExplorePage,
});

type Creator = { id: string; username: string; full_name: string | null; avatar_url: string | null; bio: string | null; role: string | null };

function ExplorePage() {
  const [q, setQ] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);

  useEffect(() => {
    (async () => {
      let query = supabase.from("profiles").select("id, username, full_name, avatar_url, bio, role").limit(48);
      if (q.trim()) query = query.ilike("username", `%${q.trim()}%`);
      const { data } = await query;
      setCreators((data ?? []) as Creator[]);
    })();
  }, [q]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creators by username..."
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {creators.map((c) => (
          <Link
            key={c.id}
            to="/user/$username"
            params={{ username: c.username }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
              {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full rounded-full object-cover" /> : c.username.slice(0, 1).toUpperCase()}
            </div>
            <p className="text-center font-semibold text-sm truncate">{c.full_name || c.username}</p>
            <p className="text-center text-xs text-gray-500 truncate">@{c.username}</p>
            <p className="text-center text-xs text-indigo-600 mt-1 capitalize">{c.role ?? "—"}</p>
          </Link>
        ))}
        {creators.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">No creators found</div>
        )}
      </div>
    </div>
  );
}
