"use client";

import { useState } from "react";
import { Timeline } from "@/components/layout/Timeline/Timeline";
import { TopBar } from "@/components/layout/TopBar";
import { TextPanel } from "@/components/text/TextPanel";
import { WorldPanel } from "@/components/world/WorldPanel";
import type { LiveState } from "@/types/world";

interface SessionShellProps {
  title: string;
  initialDraft: string;
  initialLiveState: LiveState;
  lastPublishedOffset: number;
  scenes: Array<{ id: string; name: string }>;
  activeSceneId: string | null;
  activeSceneName: string;
}

export function SessionShell({
  title,
  initialDraft,
  initialLiveState,
  lastPublishedOffset,
  scenes,
  activeSceneId,
  activeSceneName,
}: SessionShellProps) {
  const [draft, setDraft] = useState(initialDraft);
  const hasWorldStarted = initialLiveState !== "idle";
  const hasUnpublishedText = hasWorldStarted ? draft.length > lastPublishedOffset : draft.trim().length >= 100;
  const replayMode = initialLiveState === "replay";

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title={title} />
      <main className="flex min-h-[calc(100vh-48px-72px)]">
        <WorldPanel liveState={initialLiveState} sceneName={activeSceneName} />
        <TextPanel
          draft={draft}
          onDraftChange={setDraft}
          hasWorldStarted={hasWorldStarted}
          hasUnpublishedText={hasUnpublishedText}
          replayMode={replayMode}
        />
      </main>
      <Timeline scenes={scenes} activeSceneId={activeSceneId} />
    </div>
  );
}
