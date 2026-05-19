import React from "react";
import { Clock } from "lucide-react";

interface CheckIn {
  id: string;
  progress: number;
  achievements: string | null;
  blockers: string | null;
  nextSteps: string | null;
  notes: string | null;
  createdAt: string;
}

interface CheckInTimelineProps {
  checkIns: CheckIn[];
}

export function CheckInTimeline({ checkIns }: CheckInTimelineProps) {
  if (!checkIns || checkIns.length === 0) return null;

  return (
    <div>
      <h3 className="font-bold text-zinc-800 flex items-center gap-2 mb-4 border-b border-zinc-100 pb-2">
        <Clock className="w-4 h-4 text-zinc-400" />
        Check-in History
      </h3>
      <div className="space-y-4 pl-2 border-l-2 border-zinc-100 ml-2">
        {checkIns.map((ci) => (
          <div key={ci.id} className="relative pl-6">
            <div className="absolute w-3 h-3 bg-[var(--color-dijon)] rounded-full -left-[7px] top-1.5 border-2 border-white" />
            <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  {new Date(ci.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  <span className="ml-1 opacity-70">
                    {new Date(ci.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-[var(--color-dijon)] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100/50">
                  Progress: {ci.progress}%
                </span>
              </div>

              {ci.achievements && (
                <div className="mt-3 bg-emerald-50/50 border border-emerald-100/50 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Achievements</span>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">{ci.achievements}</p>
                </div>
              )}
              
              {ci.blockers && (
                <div className="mt-2 bg-rose-50/50 border border-rose-100/50 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Blockers</span>
                  <p className="text-xs text-rose-900/80 leading-relaxed">{ci.blockers}</p>
                </div>
              )}
              
              {ci.nextSteps && (
                <div className="mt-2 bg-blue-50/50 border border-blue-100/50 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Next Steps</span>
                  <p className="text-xs text-blue-900/80 leading-relaxed">{ci.nextSteps}</p>
                </div>
              )}
              
              {ci.notes && (
                <div className="mt-2 bg-zinc-50/80 border border-zinc-100 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Notes</span>
                  <p className="text-xs text-zinc-700 leading-relaxed">{ci.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
