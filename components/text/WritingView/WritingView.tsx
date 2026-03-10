"use client";

import { DraftEditor } from "@/components/text/WritingView/DraftEditor";
import { EvolveButton } from "@/components/text/WritingView/EvolveButton";

interface WritingViewProps {
  draft: string;
  onDraftChange: (value: string) => void;
  hasWorldStarted?: boolean;
  hasUnpublishedText?: boolean;
  replayMode?: boolean;
  currentReplaySceneName?: string;
}

export function WritingView({
  draft,
  onDraftChange,
  hasWorldStarted = false,
  hasUnpublishedText = false,
  replayMode = false,
  currentReplaySceneName = "Scene 1",
}: WritingViewProps) {
  const isBelowThreshold = !hasWorldStarted && draft.trim().length < 100;
  const disabled = replayMode || (hasWorldStarted ? !hasUnpublishedText : isBelowThreshold);
  const label = hasWorldStarted ? "Evolve" : "Conjure World";
  const newSceneDisabled = replayMode || !hasWorldStarted;

  return (
    <section className="flex min-w-[360px] flex-[2] flex-col bg-[color:var(--bg-surface)]">
      <div className="px-8 pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
          Draft
        </p>
        {replayMode ? (
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            Replaying {currentReplaySceneName}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          Publish changes with {label}.
        </p>
      </div>
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="mb-6 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
          <span>Autosaved</span>
          <span>{draft.length} characters</span>
        </div>
        <DraftEditor value={draft} onChange={onDraftChange} readOnly={replayMode} />
      </div>
      <div className="border-t px-8 py-5" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-3">
          <button
            className="rounded-xl border px-4 py-3 text-sm font-semibold"
            disabled={newSceneDisabled}
            style={{
              borderColor: "var(--border)",
              background: newSceneDisabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
              color: newSceneDisabled ? "#796f61" : "var(--text-primary)",
            }}
            type="button"
          >
            Start New Scene
          </button>
          <div className="flex-1">
            <EvolveButton label={label} disabled={disabled} />
          </div>
        </div>
      </div>
    </section>
  );
}
