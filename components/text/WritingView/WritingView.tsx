"use client";

import { DraftEditor } from "@/components/text/WritingView/DraftEditor";
import { EvolveButton } from "@/components/text/WritingView/EvolveButton";

interface WritingViewProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onPublish?: () => void;
  onStartNewScene?: () => void;
  onGoToPreviousScene?: () => void;
  onGoToNextScene?: () => void;
  onSceneTitleChange?: (value: string) => void;
  onSceneTitleSave?: () => void;
  sceneTitle?: string;
  sceneTitlePlaceholder?: string;
  canGoToPreviousScene?: boolean;
  canGoToNextScene?: boolean;
  hasWorldStarted?: boolean;
  hasUnpublishedText?: boolean;
  replayMode?: boolean;
  currentReplaySceneName?: string;
  isSubmitting?: boolean;
}

export function WritingView({
  draft,
  onDraftChange,
  onPublish,
  onStartNewScene,
  onGoToPreviousScene,
  onGoToNextScene,
  onSceneTitleChange,
  onSceneTitleSave,
  sceneTitle = "",
  sceneTitlePlaceholder = "Scene 1",
  canGoToPreviousScene = false,
  canGoToNextScene = false,
  hasWorldStarted = false,
  hasUnpublishedText = false,
  replayMode = false,
  currentReplaySceneName = "Scene 1",
  isSubmitting = false,
}: WritingViewProps) {
  const isBelowThreshold = !hasWorldStarted && draft.trim().length < 100;
  const disabled = replayMode || isSubmitting || (hasWorldStarted ? !hasUnpublishedText : isBelowThreshold);
  const label = hasWorldStarted ? "Evolve" : "Conjure World";
  const newSceneDisabled = replayMode || isSubmitting || !hasWorldStarted;

  return (
    <section className="flex min-w-[360px] flex-[2] flex-col bg-[color:var(--bg-surface)]">
      <div className="px-8 pt-6">
        <div className="flex items-start gap-3">
          <button
            className="mt-7 inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm"
            disabled={!canGoToPreviousScene || replayMode}
            onClick={onGoToPreviousScene}
            style={{
              borderColor: "var(--border)",
              color: !canGoToPreviousScene || replayMode ? "#796f61" : "var(--text-primary)",
              background: "rgba(255,255,255,0.03)",
            }}
            type="button"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
              Draft
            </p>
            <input
              className="mt-4 w-full border-0 bg-transparent px-0 text-3xl font-semibold outline-none"
              onBlur={onSceneTitleSave}
              onChange={(event) => onSceneTitleChange?.(event.target.value)}
              placeholder={sceneTitlePlaceholder}
              readOnly={replayMode}
              value={sceneTitle}
            />
          </div>
          <button
            className="mt-7 inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm"
            disabled={!canGoToNextScene || replayMode}
            onClick={onGoToNextScene}
            style={{
              borderColor: "var(--border)",
              color: !canGoToNextScene || replayMode ? "#796f61" : "var(--text-primary)",
              background: "rgba(255,255,255,0.03)",
            }}
            type="button"
          >
            →
          </button>
        </div>
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
            onClick={onStartNewScene}
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
            <EvolveButton label={label} disabled={disabled} loading={isSubmitting} onClick={onPublish} />
          </div>
        </div>
      </div>
    </section>
  );
}
