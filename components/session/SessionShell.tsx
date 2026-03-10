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
  UpdateSceneRequest,
  UpdateSessionRequest,
} from "@/types/api";
import type { LiveState, WorldState } from "@/types/world";

interface SceneDraftState {
  id: string;
  index: number;
  name: string;
  hasStarted: boolean;
  draftContent: string;
  publishedFromOffset: number;
}

interface SessionShellProps {
  sessionId: string;
  title: string;
  initialDraft: string;
  initialLiveState: LiveState;
  lastPublishedOffset: number;
  scenes: SceneDraftState[];
  activeSceneId: string | null;
  activeSceneName: string;
  initialWorldState: WorldState;
  initialSceneStarted: boolean;
}

export function SessionShell({
  sessionId,
  title: initialTitle,
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
  const initialSceneRecord = initialScenes.find((scene) => scene.id === activeSceneId) ?? null;
  const [liveState, setLiveState] = useState<LiveState>(initialLiveState);
  const [sessionTitle, setSessionTitle] = useState(initialTitle);
  const [scenes, setScenes] = useState<SceneDraftState[]>(initialScenes);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(activeSceneId);
  const [currentSceneName, setCurrentSceneName] = useState(
    initialSceneRecord && isSystemSceneName(initialSceneRecord.name) ? "" : activeSceneName,
  );
  const [currentSceneStarted, setCurrentSceneStarted] = useState(initialSceneStarted);
  const [draft, setDraft] = useState(initialDraft);
  const [publishedOffset, setPublishedOffset] = useState(lastPublishedOffset);
  const [worldState, setWorldState] = useState(initialWorldState);
  const [replaySceneId, setReplaySceneId] = useState<string | null>(initialLiveState === "replay" ? activeSceneId : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const replayMode = liveState === "replay";
  const currentScene = useMemo(
    () => scenes.find((scene) => scene.id === currentSceneId) ?? null,
    [scenes, currentSceneId],
  );
  const previousScene = useMemo(() => {
    if (!currentSceneId) {
      return null;
    }

    const currentIndex = scenes.findIndex((scene) => scene.id === currentSceneId);
    return currentIndex > 0 ? scenes[currentIndex - 1] : null;
  }, [scenes, currentSceneId]);
  const nextScene = useMemo(() => {
    if (!currentSceneId) {
      return null;
    }

    const currentIndex = scenes.findIndex((scene) => scene.id === currentSceneId);
    return currentIndex >= 0 && currentIndex < scenes.length - 1 ? scenes[currentIndex + 1] : null;
  }, [scenes, currentSceneId]);
  const replayScene = useMemo(
    () => scenes.find((scene) => scene.id === replaySceneId) ?? null,
    [scenes, replaySceneId],
  );
  const selectedSceneName = replayMode ? replayScene?.name ?? currentSceneName : currentSceneName;
  const hasWorldStarted = currentSceneStarted;
  const hasUnpublishedText = hasWorldStarted ? draft.length > publishedOffset : draft.trim().length >= 100;

  async function patchCurrentScene(update: UpdateSceneRequest) {
    if (!currentSceneId) {
      return;
    }

    await fetch(`/api/scenes/${currentSceneId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    });
  }

  async function patchSession(update: UpdateSessionRequest) {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    });
  }

  async function handleSessionTitleSave() {
    const trimmed = sessionTitle.trim();
    const nextTitle = trimmed || "Untitled World";

    setSessionTitle(nextTitle);

    await patchSession({ title: nextTitle });
    startTransition(() => {
      router.refresh();
    });
  }

  function syncSceneState(sceneId: string, update: Partial<SceneDraftState>) {
    setScenes((current) => current.map((scene) => (scene.id === sceneId ? { ...scene, ...update } : scene)));
  }

  async function handleDraftChange(value: string) {
    setDraft(value);
    if (currentSceneId) {
      syncSceneState(currentSceneId, { draftContent: value });
    }
  }

  async function handleSceneTitleChange(value: string) {
    setCurrentSceneName(value);
    if (currentSceneId) {
      syncSceneState(currentSceneId, { name: value });
    }
  }

  async function handleSceneTitleSave() {
    if (!currentSceneId) {
      return;
    }

    const trimmed = currentSceneName.trim();
    if (!trimmed) {
      return;
    }

    await patchCurrentScene({ name: trimmed });
    startTransition(() => {
      router.refresh();
    });
  }

  async function handlePublish() {
    if (isSubmitting || replayMode || !hasUnpublishedText) {
      return;
    }

    setIsSubmitting(true);
    setLiveState(hasWorldStarted ? "updating" : "starting");

    try {
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });

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

      setSessionTitle(detail.title);
      setScenes(detail.scenes);
      setCurrentSceneId(nextActiveScene?.id ?? null);
      setCurrentSceneName(nextActiveScene && isSystemSceneName(nextActiveScene.name) ? "" : nextActiveScene?.name ?? "");
      setCurrentSceneStarted(nextActiveScene?.hasStarted ?? false);
      setDraft(nextActiveScene?.draftContent ?? "");
      setPublishedOffset(nextActiveScene?.publishedFromOffset ?? 0);
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
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });

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
      const nextScenes = [...scenes, scene];

      setScenes(nextScenes);
      setCurrentSceneId(scene.id);
      setCurrentSceneName("");
      setCurrentSceneStarted(false);
      setDraft("");
      setPublishedOffset(0);
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

  async function handleGoToPreviousScene() {
    if (!previousScene || isSubmitting) {
      return;
    }

    try {
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });
      await patchSession({ currentSceneId: previousScene.id });

      setCurrentSceneId(previousScene.id);
      setCurrentSceneName(isSystemSceneName(previousScene.name) ? "" : previousScene.name);
      setCurrentSceneStarted(previousScene.hasStarted);
      setDraft(previousScene.draftContent);
      setPublishedOffset(previousScene.publishedFromOffset);
      setReplaySceneId(null);
      setLiveState(previousScene.hasStarted ? "sleeping" : "idle");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLiveState("error");
    }
  }

  async function handleGoToNextScene() {
    if (!nextScene || isSubmitting) {
      return;
    }

    try {
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });
      await patchSession({ currentSceneId: nextScene.id });

      setCurrentSceneId(nextScene.id);
      setCurrentSceneName(isSystemSceneName(nextScene.name) ? "" : nextScene.name);
      setCurrentSceneStarted(nextScene.hasStarted);
      setDraft(nextScene.draftContent);
      setPublishedOffset(nextScene.publishedFromOffset);
      setReplaySceneId(null);
      setLiveState(nextScene.hasStarted ? "sleeping" : "idle");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLiveState("error");
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
      <TopBar title={sessionTitle} editable onTitleChange={setSessionTitle} onTitleSave={handleSessionTitleSave} />
      <main className="flex min-h-[calc(100vh-48px-72px)]">
        <WorldPanel liveState={liveState} sceneName={selectedSceneName} onBackToCurrent={handleBackToCurrent} onWake={handleWake} />
        <TextPanel
          draft={draft}
          onDraftChange={handleDraftChange}
          onPublish={handlePublish}
          onStartNewScene={handleStartNewScene}
          onGoToPreviousScene={handleGoToPreviousScene}
          onGoToNextScene={handleGoToNextScene}
          onSceneTitleChange={handleSceneTitleChange}
          onSceneTitleSave={handleSceneTitleSave}
          sceneTitle={currentSceneName}
          sceneTitlePlaceholder={currentScene ? `Scene ${currentScene.index}` : "Scene 1"}
          canGoToPreviousScene={Boolean(previousScene)}
          canGoToNextScene={Boolean(nextScene)}
          hasWorldStarted={hasWorldStarted}
          hasUnpublishedText={hasUnpublishedText}
          replayMode={replayMode}
          currentReplaySceneName={selectedSceneName}
          isSubmitting={isSubmitting}
        />
      </main>
      <Timeline scenes={scenes} activeSceneId={replayMode ? replaySceneId : currentSceneId} onSelectScene={handleSelectScene} />
    </div>
  );
}

function isSystemSceneName(name: string) {
  return /^Scene\s+\d+$/i.test(name.trim());
}
