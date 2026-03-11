"use client";

import { DraftEditor } from "@/components/text/WritingView/DraftEditor";
import { EvolveButton } from "@/components/text/WritingView/EvolveButton";
import { PRE_WORLD_MIN_CHARACTERS } from "@/lib/session-config";

interface WritingViewProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onPublish?: () => void;
  onStartNewScene?: () => void;
  onGoToPreviousScene?: () => void;
  onGoToNextScene?: () => void;
  onAssist?: (action: "continue" | "polish") => void;
  onSceneTitleChange?: (value: string) => void;
  onSceneTitleSave?: () => void;
  sceneTitle?: string;
  sceneTitlePlaceholder?: string;
  canGoToPreviousScene?: boolean;
  canGoToNextScene?: boolean;
  assistLoadingAction?: "continue" | "polish" | null;
  hasWorldStarted?: boolean;
  hasUnpublishedText?: boolean;
  replayMode?: boolean;
  currentReplaySceneName?: string;
  isSubmitting?: boolean;
  publishLoading?: boolean;
  startSceneLoading?: boolean;
}

export function WritingView({
  draft,
  onDraftChange,
  onPublish,
  onStartNewScene,
  onGoToPreviousScene,
  onGoToNextScene,
  onAssist,
  onSceneTitleChange,
  onSceneTitleSave,
  sceneTitle = "",
  sceneTitlePlaceholder = "Scene 1",
  canGoToPreviousScene = false,
  canGoToNextScene = false,
  assistLoadingAction = null,
  hasWorldStarted = false,
  hasUnpublishedText = false,
  replayMode = false,
  currentReplaySceneName = "Scene 1",
  isSubmitting = false,
  publishLoading = false,
  startSceneLoading = false,
}: WritingViewProps) {
  const isBelowThreshold = !hasWorldStarted && draft.trim().length < PRE_WORLD_MIN_CHARACTERS;
  const disabled = replayMode || isSubmitting || (hasWorldStarted ? !hasUnpublishedText : isBelowThreshold);
  const label = hasWorldStarted ? "Evolve" : "Conjure World";
  const newSceneDisabled = replayMode || isSubmitting || !hasWorldStarted;
  const remainingCharacters = Math.max(PRE_WORLD_MIN_CHARACTERS - draft.trim().length, 0);

  return (
    <section className="flex min-w-[360px] flex-[2] flex-col bg-[color:var(--bg-surface)]">
      <div className="px-8 pt-6">
        <div className="flex items-start gap-3">
          <button
            className="mt-7 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-sm transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
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
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
                Draft
              </p>
              <div className="flex items-center gap-2">
                <div className="group relative">
                  <button
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-sm transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
                    disabled={replayMode || isSubmitting || assistLoadingAction !== null}
                    onClick={() => onAssist?.("continue")}
                    style={{
                      borderColor: "var(--border)",
                      color: replayMode || isSubmitting || assistLoadingAction !== null ? "#796f61" : "var(--text-primary)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                    title="AI continue"
                    type="button"
                  >
                    ✎
                  </button>
                  <div
                    className="pointer-events-none absolute right-0 top-10 hidden w-44 rounded-lg border px-3 py-2 text-[11px] leading-5 group-hover:block"
                    style={{
                      borderColor: "var(--border)",
                      background: "rgba(10,9,7,0.96)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Continue the current scene in the same voice.
                  </div>
                </div>
                <div className="group relative">
                  <button
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-sm transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
                    disabled={replayMode || isSubmitting || assistLoadingAction !== null}
                    onClick={() => onAssist?.("polish")}
                    style={{
                      borderColor: "var(--border)",
                      color: replayMode || isSubmitting || assistLoadingAction !== null ? "#796f61" : "var(--text-primary)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                    title="AI polish"
                    type="button"
                  >
                    ✦
                  </button>
                  <div
                    className="pointer-events-none absolute right-0 top-10 hidden w-48 rounded-lg border px-3 py-2 text-[11px] leading-5 group-hover:block"
                    style={{
                      borderColor: "var(--border)",
                      background: "rgba(10,9,7,0.96)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Polish the draft for clarity, rhythm, and sensory detail.
                  </div>
                </div>
              </div>
            </div>
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
            className="mt-7 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-sm transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
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
        {assistLoadingAction ? (
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            {assistLoadingAction === "continue" ? "AI continuing draft…" : "AI polishing draft…"}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          {hasWorldStarted ? `Publish changes with ${label}.` : `Write at least ${PRE_WORLD_MIN_CHARACTERS} characters to enable Conjure World.`}
        </p>
        {!hasWorldStarted && remainingCharacters > 0 ? (
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
            {remainingCharacters} more characters to conjure
          </p>
        ) : null}
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
            className="rounded-xl border px-4 py-3 text-sm font-semibold transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
            disabled={newSceneDisabled}
            onClick={onStartNewScene}
            style={{
              borderColor: "var(--border)",
              background: newSceneDisabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
              color: newSceneDisabled ? "#796f61" : "var(--text-primary)",
            }}
            type="button"
          >
            {startSceneLoading ? "Starting Scene…" : "Start New Scene"}
          </button>
          <div className="flex-1">
            <EvolveButton label={label} disabled={disabled} loading={publishLoading} loadingLabel={hasWorldStarted ? "Publishing…" : "Conjuring…"} onClick={onPublish} />
          </div>
        </div>
      </div>
    </section>
  );
}
