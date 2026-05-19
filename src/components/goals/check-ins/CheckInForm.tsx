import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface CheckInFormProps {
  goalId: string;
  initialProgress: number;
  onSuccess: (updatedGoal: any) => void;
  onCancel: () => void;
  triggerToast: (message: string, type?: "success" | "error" | "info") => void;
}

export function CheckInForm({ goalId, initialProgress, onSuccess, onCancel, triggerToast }: CheckInFormProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [achievements, setAchievements] = useState("");
  const [blockers, setBlockers] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [notes, setNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const res = await fetch(`/api/goals/${goalId}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress, achievements, blockers, nextSteps, notes })
      });
      if (res.ok) {
        const data = await res.json();
        triggerToast(`Checked in successfully! Progress: ${progress}%`, "success");
        onSuccess(data);
      } else {
        const errData = await res.json();
        triggerToast(errData.message || "Failed to submit check-in", "error");
      }
    } catch (err) {
      triggerToast("Error performing check-in", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-4 space-y-4 border border-zinc-100 bg-zinc-50 rounded-xl p-4"
      onSubmit={handleSubmit}
    >
      <h4 className="text-sm font-bold text-zinc-800">New Check-in</h4>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600">Update Progress (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-2 focus:ring-[var(--color-dijon)]/20 outline-none text-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600">Achievements</label>
        <textarea
          value={achievements}
          onChange={(e) => setAchievements(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-2 focus:ring-[var(--color-dijon)]/20 outline-none text-sm resize-none"
          rows={2}
          placeholder="What went well?"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600">Blockers</label>
        <textarea
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-2 focus:ring-[var(--color-dijon)]/20 outline-none text-sm resize-none"
          rows={2}
          placeholder="Any challenges?"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600">Next Steps</label>
        <textarea
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-2 focus:ring-[var(--color-dijon)]/20 outline-none text-sm resize-none"
          rows={2}
          placeholder="What's next?"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600">Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:border-[var(--color-dijon)] focus:ring-2 focus:ring-[var(--color-dijon)]/20 outline-none text-sm resize-none"
          rows={2}
          placeholder="Any other observations?"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submittingAction}
          className="px-4 py-2 text-xs font-semibold bg-[var(--color-dijon)] text-white rounded-lg hover:opacity-90 flex items-center gap-1 transition-opacity disabled:opacity-50"
        >
          {submittingAction && <Loader2 className="w-3 h-3 animate-spin" />}
          Submit Check-in
        </button>
      </div>
    </motion.form>
  );
}
