import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Target, MessageSquare } from "lucide-react";
import { getActiveQuarterWindow } from "@/lib/quarterlyUtils";

interface QuarterlyCheckInProps {
  goalId: string;
  isManager: boolean;
  onSuccess: () => void;
}

export function QuarterlyCheckIn({ goalId, isManager, onSuccess }: QuarterlyCheckInProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q1");
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");
  const [status, setStatus] = useState("On Track");
  const [managerFeedback, setManagerFeedback] = useState("");

  const activeWindow = getActiveQuarterWindow();

  useEffect(() => {
    fetchReviews();
    if (activeWindow) {
      setQuarter(activeWindow);
    }
  }, [goalId, activeWindow]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/goals/${goalId}/quarterly`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        quarter,
        planned,
        actual,
        status,
        ...(isManager && { managerFeedback })
      };

      const res = await fetch(`/api/goals/${goalId}/quarterly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit check-in");
      }

      setPlanned("");
      setActual("");
      setManagerFeedback("");
      fetchReviews();
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

  return (
    <div className="space-y-8">
      {/* Active Form */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[var(--color-dijon)]" />
          Submit Quarterly Review
        </h3>
        
        {!activeWindow && !isManager && (
          <div className="mb-6 p-4 rounded-xl bg-orange-50 text-orange-800 text-sm border border-orange-100">
            <strong>Check-in Window Closed:</strong> No quarterly window is currently active. Next window opens as per the corporate schedule.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Quarter</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none text-sm bg-zinc-50"
              >
                <option value="Q1">Q1 (July)</option>
                <option value="Q2">Q2 (October)</option>
                <option value="Q3">Q3 (January)</option>
                <option value="Q4">Q4 / Annual (March - April)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none text-sm bg-white"
              >
                <option value="Not Started">Not Started</option>
                <option value="On Track">On Track</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Planned Achievement</label>
              <input
                type="text"
                required
                value={planned}
                onChange={(e) => setPlanned(e.target.value)}
                placeholder="e.g. 50k"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-[var(--color-dijon)] text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Actual Achievement</label>
              <input
                type="text"
                required
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="e.g. 52k"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-[var(--color-dijon)] text-sm"
              />
            </div>
          </div>

          {isManager && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Manager Feedback</label>
              <textarea
                value={managerFeedback}
                onChange={(e) => setManagerFeedback(e.target.value)}
                placeholder="Provide performance feedback..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 outline-none focus:border-[var(--color-dijon)] text-sm min-h-[80px]"
              />
            </div>
          )}

          {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit {quarter} Review
          </button>
        </form>
      </div>

      {/* History */}
      <div>
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Past Quarterly Reviews</h4>
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No quarterly reviews submitted yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-5 rounded-xl bg-zinc-50 border border-zinc-100 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-900 px-3 py-1 bg-white border border-zinc-200 rounded-lg text-sm">{rev.quarter}</span>
                    <span className="text-sm font-medium text-zinc-600">{rev.status}</span>
                  </div>
                  <span className="text-xs text-zinc-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-white p-3 rounded-lg border border-zinc-100">
                    <div className="text-[10px] uppercase text-zinc-400 font-bold mb-1">Planned</div>
                    <div className="text-sm font-medium text-zinc-800">{rev.planned}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-zinc-100">
                    <div className="text-[10px] uppercase text-zinc-400 font-bold mb-1">Actual</div>
                    <div className="text-sm font-medium text-zinc-800">{rev.actual}</div>
                  </div>
                </div>

                {rev.managerFeedback && (
                  <div className="mt-2 flex gap-3 items-start bg-blue-50/50 p-3 rounded-lg">
                    <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-blue-900 mb-0.5">Manager Feedback</div>
                      <div className="text-sm text-blue-800">{rev.managerFeedback}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
