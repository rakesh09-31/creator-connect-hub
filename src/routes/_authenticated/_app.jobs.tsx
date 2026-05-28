import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_app/jobs")({
  head: () => ({ meta: [{ title: "Jobs — Omnicraft" }] }),
  component: JobsPage,
});

const SAMPLE_JOBS = [
  { id: 1, title: "Wedding Videographer", company: "Sunset Studios", location: "Remote", budget: "$2,000", type: "Video", postedAt: "2d ago" },
  { id: 2, title: "Brand Identity Designer", company: "Lumen Co", location: "New York, NY", budget: "$5,000", type: "Design", postedAt: "4d ago" },
  { id: 3, title: "Music Video Editor", company: "Indie Records", location: "Remote", budget: "$1,500", type: "Edit", postedAt: "1w ago" },
];

function JobsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Open Projects</h1>
        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm">+ Post Project</button>
      </div>

      <div className="space-y-4">
        {SAMPLE_JOBS.map((j) => (
          <div key={j.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{j.title}</h3>
                  <p className="text-sm text-gray-600">{j.company}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {j.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {j.postedAt}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">{j.type}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-600">{j.budget}</div>
                <button className="mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Apply</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
