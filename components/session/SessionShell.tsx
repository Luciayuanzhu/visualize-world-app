"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Timeline } from "@/components/layout/Timeline/Timeline";
import { TopBar } from "@/components/layout/TopBar";
import { TextPanel } from "@/components/text/TextPanel";
import { WorldPanel } from "@/components/world/WorldPanel";
import { useInactivitySleep } from "@/hooks/useInactivitySleep";
import { mergeWorldState } from "@/lib/world-state";
import type {
  AssistDraftResponse,
  CreateSceneResponse,
  FrameReadUrlResponse,
  PublishSessionResponse,
  RecordingReadUrlResponse,
  SleepSessionResponse,
  UpdateSceneRequest,
  UpdateSessionRequest,
  WakeSessionResponse,
} from "@/types/api";
import type { LiveState, WorldState } from "@/types/world";

interface SceneDraftState {
  id: string;
  index: number;
  name: string;
  hasStarted: boolean;
  draftContent: string;
  publishedFromOffset: number;
  latestSegmentId: string | null;
  latestLastFrameKey: string | null;
  latestRecordingVideoKey: string | null;
  resumePrompt: string | null;
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
  const [currentFrameUrl, setCurrentFrameUrl] = useState<string | null>(null);
  const [replayMediaUrl, setReplayMediaUrl] = useState<string | null>(null);
  const [replayMediaKind, setReplayMediaKind] = useState<"image" | "video" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assistLoadingAction, setAssistLoadingAction] = useState<"continue" | "polish" | null>(null);

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

  const loadFrameUrl = useCallback(async (frameKey: string | null | undefined) => {
    if (!frameKey) {
      return null;
    }

    const response = await fetch("/api/storage/frame-read-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frameKey }),
    });

    if (!response.ok) {
      throw new Error(`Frame read failed with ${response.status}`);
    }

    const payload = (await response.json()) as FrameReadUrlResponse;
    return payload.readUrl;
  }, []);

  const loadReplayMedia = useCallback(
    async (scene: SceneDraftState) => {
      if (scene.latestRecordingVideoKey && scene.latestSegmentId) {
        const response = await fetch("/api/storage/recording-read-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            segmentId: scene.latestSegmentId,
            recordingVideoKey: scene.latestRecordingVideoKey,
          }),
        });

        if (response.ok) {
          const payload = (await response.json()) as RecordingReadUrlResponse;
          if (payload.readUrl) {
            return {
              url: payload.readUrl,
              kind: "video" as const,
            };
          }
        }
      }

      const frameUrl = await loadFrameUrl(scene.latestLastFrameKey);
      if (frameUrl) {
        return {
          url: frameUrl,
          kind: "image" as const,
        };
      }

      return {
        url: null,
        kind: null,
      };
    },
    [loadFrameUrl],
  );

  useEffect(() => {
    let cancelled = false;

    const current = scenes.find((scene) => scene.id === currentSceneId) ?? null;
    if (!current?.latestLastFrameKey) {
      setCurrentFrameUrl(null);
      return;
    }

    void loadFrameUrl(current.latestLastFrameKey)
      .then((url) => {
        if (!cancelled) {
          setCurrentFrameUrl(url);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [scenes, currentSceneId, loadFrameUrl]);

  useInactivitySleep(
    8 * 60_000,
    () => {
      if (currentSceneStarted && !replayMode && !isSubmitting && (liveState === "live" || liveState === "updating")) {
        void handleSleep();
      }
    },
    60_000,
  );

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

  function applySessionDetail(detail: PublishSessionResponse["session"] | SleepSessionResponse["session"] | WakeSessionResponse["session"]) {
    const nextActiveScene =
      detail.scenes.find((scene) => scene.id === detail.currentSceneId) ?? detail.scenes[detail.scenes.length - 1] ?? null;

    setSessionTitle(detail.title);
    setScenes(detail.scenes);
    setCurrentSceneId(nextActiveScene?.id ?? null);
    setCurrentSceneName(nextActiveScene && isSystemSceneName(nextActiveScene.name) ? "" : nextActiveScene?.name ?? "");
    setCurrentSceneStarted(nextActiveScene?.hasStarted ?? false);
    setDraft(nextActiveScene?.draftContent ?? "");
    setPublishedOffset(nextActiveScene?.publishedFromOffset ?? 0);
  }

  async function handleAssist(action: "continue" | "polish") {
    if (replayMode || isSubmitting || assistLoadingAction) {
      return;
    }

    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      return;
    }

    setAssistLoadingAction(action);

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          draft,
          sceneTitle: currentSceneName.trim() || undefined,
          sessionTitle: sessionTitle.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Assist failed with ${response.status}`);
      }

      const payload = (await response.json()) as AssistDraftResponse;
      const nextDraft = action === "continue" ? `${draft.trimEnd()}\n\n${payload.content.trim()}` : payload.content;

      setDraft(nextDraft);
      if (currentSceneId) {
        syncSceneState(currentSceneId, { draftContent: nextDraft });
        await patchCurrentScene({
          draftContent: nextDraft,
          name: currentSceneName.trim() || undefined,
          publishedFromOffset: publishedOffset,
        });
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLiveState("error");
    } finally {
      setAssistLoadingAction(null);
    }
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
      const publishedActiveScene =
        detail.scenes.find((scene) => scene.id === detail.currentSceneId) ?? detail.scenes[detail.scenes.length - 1] ?? null;
      applySessionDetail(detail);
      setWorldState(detail.worldState ?? mergeWorldState(worldState, payload.worldStateUpdates));
      setReplaySceneId(null);
      setReplayMediaUrl(null);
      setReplayMediaKind(null);

      if (payload.action.type === "transition") {
        setLiveState("transitioning");
        window.setTimeout(() => setLiveState("live"), 1200);
      } else if (payload.action.type === "noop") {
        setLiveState(publishedActiveScene?.hasStarted ? "live" : "idle");
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
      setReplayMediaUrl(null);
      setReplayMediaKind(null);
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
      setReplayMediaUrl(null);
      setReplayMediaKind(null);
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
      setReplayMediaUrl(null);
      setReplayMediaKind(null);
      setLiveState(nextScene.hasStarted ? "sleeping" : "idle");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLiveState("error");
    }
  }

  async function handleSelectScene(sceneId: string) {
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

    try {
      const media = await loadReplayMedia(scene);
      setReplayMediaUrl(media.url);
      setReplayMediaKind(media.kind);
      setReplaySceneId(scene.id);
      setLiveState("replay");
    } catch (error) {
      console.error(error);
      setLiveState("error");
    }
  }

  function handleBackToCurrent() {
    setReplaySceneId(null);
    setReplayMediaUrl(null);
    setReplayMediaKind(null);
    setLiveState(currentSceneStarted ? "sleeping" : "idle");
  }

  async function handleSleep() {
    if (!currentSceneStarted || isSubmitting || replayMode) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/sleep`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Sleep failed with ${response.status}`);
      }

      const payload = (await response.json()) as SleepSessionResponse;
      applySessionDetail(payload.session);
      if (payload.frameKey) {
        const nextFrameUrl = await loadFrameUrl(payload.frameKey);
        setCurrentFrameUrl(nextFrameUrl);
      }
      setLiveState("sleeping");

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

  async function handleWake() {
    if (!currentSceneStarted) {
      return;
    }

    setLiveState("resuming");

    try {
      const response = await fetch(`/api/sessions/${sessionId}/wake`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Wake failed with ${response.status}`);
      }

      const payload = (await response.json()) as WakeSessionResponse;
      applySessionDetail(payload.session);
      setWorldState(payload.session.worldState ?? worldState);
      if (payload.frameKey) {
        const nextFrameUrl = await loadFrameUrl(payload.frameKey);
        setCurrentFrameUrl(nextFrameUrl);
      }
      setLiveState("live");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      setLiveState("error");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title={sessionTitle} editable onTitleChange={setSessionTitle} onTitleSave={handleSessionTitleSave} />
      <main className="flex min-h-[calc(100vh-48px-72px)]">
        <WorldPanel
          liveState={liveState}
          sceneName={selectedSceneName}
          currentFrameUrl={currentFrameUrl}
          replayMediaUrl={replayMediaUrl}
          replayMediaKind={replayMediaKind}
          onBackToCurrent={handleBackToCurrent}
          onWake={handleWake}
        />
        <TextPanel
          draft={draft}
          onDraftChange={handleDraftChange}
          onPublish={handlePublish}
          onStartNewScene={handleStartNewScene}
          onGoToPreviousScene={handleGoToPreviousScene}
          onGoToNextScene={handleGoToNextScene}
          onAssist={handleAssist}
          onSceneTitleChange={handleSceneTitleChange}
          onSceneTitleSave={handleSceneTitleSave}
          sceneTitle={currentSceneName}
          sceneTitlePlaceholder={currentScene ? `Scene ${currentScene.index}` : "Scene 1"}
          canGoToPreviousScene={Boolean(previousScene)}
          canGoToNextScene={Boolean(nextScene)}
          assistLoadingAction={assistLoadingAction}
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
