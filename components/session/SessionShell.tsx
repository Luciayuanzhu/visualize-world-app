"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Timeline } from "@/components/layout/Timeline/Timeline";
import { TopBar } from "@/components/layout/TopBar";
import { TextPanel } from "@/components/text/TextPanel";
import { WorldPanel } from "@/components/world/WorldPanel";
import { mergeWorldState } from "@/lib/world-state";
import type {
  CreateSceneResponse,
  PublishSessionResponse,
  SessionDetail,
} from "@/types/api";
import type { LiveState, WorldState } from "@/types/world";

interface SessionShellProps {
  sessionId: string;
  title: string;
  initialDraft: string;
  initialLiveState: LiveState;
  lastPublishedOffset: number;
  scenes: Array<{ id: string; name: string; hasStarted: boolean }>;
  activeSceneId: string | null;
  activeSceneName: string;
  initialWorldState: WorldState;
  initialSceneStarted: boolean;
}

export function SessionShell({
  sessionId,
  title,
  initialDraft,
  initialLiveState,
  lastPublishedOffset,
  scenes: initialScenes,
  activeSceneId,
  activeSceneName,
  initialWorldState,
  initialSceneStarted,
}: SessionShellProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState(initialDraft);
  const [liveState, setLiveState] = useState<LiveState>(initialLiveState);
  const [scenes, setScenes] = useState(initialScenes);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(activeSceneId);
  const [currentSceneName, setCurrentSceneName] = useState(activeSceneName);
  const [currentSceneStarted, setCurrentSceneStarted] = useState(initialSceneStarted);
  const [publishedOffset, setPublishedOffset] = useState(lastPublishedOffset);
  const [worldState, setWorldState] = useState(initialWorldState);
  const [replaySceneId, setReplaySceneId] = useState<string | null>(initialLiveState === "replay" ? activeSceneId : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const replayMode = liveState === "replay";
  const selectedSceneId = replayMode ? replaySceneId : currentSceneId;
  const selectedScene = useMemo(
    () => scenes.find((scene) => scene.id === selectedSceneId) ?? null,
    [scenes, selectedSceneId],
  );
  const selectedSceneName = selectedScene?.name ?? currentSceneName;
  const hasWorldStarted = currentSceneStarted;
  const hasUnpublishedText = hasWorldStarted ? draft.length > publishedOffset : draft.trim().length >= 100;

  async function handlePublish() {
    if (isSubmitting || replayMode || !hasUnpublishedText) {
      return;
    }

    setIsSubmitting(true);
    setLiveState(hasWorldStarted ? "updating" : "starting");

    try {
      const response = await fetch(`/api/sessions/${sessionId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draft }),
      });

      if (!response.ok) {
        throw new Error(`Publish failed with ${response.status}`);
      }

      const payload = (await response.json()) as PublishSessionResponse;
      const detail = payload.session;
      const nextActiveScene =
        detail.scenes.find((scene) => scene.id === detail.currentSceneId) ?? detail.scenes[detail.scenes.length - 1] ?? null;

      setScenes(detail.scenes.map((scene) => ({ id: scene.id, name: scene.name, hasStarted: scene.hasStarted })));
      setCurrentSceneId(nextActiveScene?.id ?? null);
      setCurrentSceneName(nextActiveScene?.name ?? "Untitled Scene");
      setCurrentSceneStarted(nextActiveScene?.hasStarted ?? false);
      setPublishedOffset(detail.lastPublishedOffset);
      setWorldState(detail.worldState ?? mergeWorldState(worldState, payload.worldStateUpdates));
      setReplaySceneId(null);

      if (payload.action.type === "transition") {
        setLiveState("transitioning");
        window.setTimeout(() => setLiveState("live"), 1200);
      } else if (payload.action.type === "noop") {
        setLiveState(nextActiveScene?.hasStarted ? "live" : "idle");
      } else {
        setLiveState("live");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLiveState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartNewScene() {
    if (isSubmitting || replayMode || !hasWorldStarted) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/scenes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draftOffsetStart: draft.length }),
      });

      if (!response.ok) {
        throw new Error(`New scene failed with ${response.status}`);
      }

      const scene = (await response.json()) as CreateSceneResponse;
      const nextScenes = [...scenes, { id: scene.id, name: scene.name, hasStarted: false }];

      setScenes(nextScenes);
      setCurrentSceneId(scene.id);
      setCurrentSceneName(scene.name);
      setCurrentSceneStarted(false);
      setReplaySceneId(null);
      setLiveState("idle");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLiveState("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectScene(sceneId: string) {
    if (sceneId === currentSceneId) {
      if (replayMode) {
        handleBackToCurrent();
      }
      return;
    }

    const scene = scenes.find((item) => item.id === sceneId);

    if (!scene) {
      return;
    }

    setReplaySceneId(scene.id);
    setLiveState("replay");
  }

  function handleBackToCurrent() {
    setReplaySceneId(null);
    setLiveState(currentSceneStarted ? "sleeping" : "idle");
  }

  function handleWake() {
    if (!currentSceneStarted) {
      return;
    }

    setLiveState("resuming");
    window.setTimeout(() => setLiveState("live"), 900);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title={title} />
      <main className="flex min-h-[calc(100vh-48px-72px)]">
        <WorldPanel liveState={liveState} sceneName={selectedSceneName} onBackToCurrent={handleBackToCurrent} onWake={handleWake} />
        <TextPanel
          draft={draft}
          onDraftChange={setDraft}
          onPublish={handlePublish}
          onStartNewScene={handleStartNewScene}
          hasWorldStarted={hasWorldStarted}
          hasUnpublishedText={hasUnpublishedText}
          replayMode={replayMode}
          currentReplaySceneName={selectedSceneName}
          isSubmitting={isSubmitting}
        />
      </main>
      <Timeline scenes={scenes} activeSceneId={selectedSceneId} onSelectScene={handleSelectScene} />
    </div>
  );
}
