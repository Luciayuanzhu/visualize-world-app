"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Timeline } from "@/components/layout/Timeline/Timeline";
import { TopBar } from "@/components/layout/TopBar";
import { TextPanel } from "@/components/text/TextPanel";
import { WorldPanel } from "@/components/world/WorldPanel";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { useInactivitySleep } from "@/hooks/useInactivitySleep";
import { useInteractQueue } from "@/hooks/useInteractQueue";
import { createOdysseyClient, type OdysseyClientHandle } from "@/lib/odyssey-client";
import { mergeWorldState } from "@/lib/world-state";
import type {
  AssistDraftResponse,
  CreateSceneResponse,
  FrameReadUrlResponse,
  OdysseyClientConfigResponse,
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
  const [liveMediaStream, setLiveMediaStream] = useState<MediaStream | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assistLoadingAction, setAssistLoadingAction] = useState<"continue" | "polish" | null>(null);
  const [odysseyConfig, setOdysseyConfig] = useState<OdysseyClientConfigResponse>({ enabled: false, mode: "mock" });
  const odysseyClientRef = useRef<OdysseyClientHandle | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveStateRef = useRef<LiveState>(initialLiveState);
  const currentSceneStartedRef = useRef(initialSceneStarted);
  const replayModeRef = useRef(initialLiveState === "replay");
  const { captureFrame } = useFrameCapture();

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

  useEffect(() => {
    liveStateRef.current = liveState;
  }, [liveState]);

  useEffect(() => {
    currentSceneStartedRef.current = currentSceneStarted;
  }, [currentSceneStarted]);

  useEffect(() => {
    replayModeRef.current = replayMode;
  }, [replayMode]);
  const replayScene = useMemo(
    () => scenes.find((scene) => scene.id === replaySceneId) ?? null,
    [scenes, replaySceneId],
  );
  const selectedSceneName = replayMode ? replayScene?.name ?? currentSceneName : currentSceneName;
  const hasWorldStarted = currentSceneStarted;
  const hasUnpublishedText = hasWorldStarted ? draft.length > publishedOffset : draft.trim().length >= 100;

  const interactQueue = useInteractQueue(async (prompt: string) => {
    if (!prompt) {
      return;
    }

    await odysseyClientRef.current?.interact(prompt);
  });

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

  const logClientEvent = useCallback(
    async (level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) => {
      const payload = {
        level,
        message,
        meta: {
          sessionId,
          currentSceneId,
          liveState: liveStateRef.current,
          ...meta,
        },
      };

      try {
        await fetch("/api/client-log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [currentSceneId, sessionId],
  );

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/odyssey/client-config")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Odyssey config failed with ${response.status}`);
        }

        return (await response.json()) as OdysseyClientConfigResponse;
      })
      .then((config) => {
        if (cancelled) {
          return;
        }

        setOdysseyConfig(config);
        odysseyClientRef.current = createOdysseyClient(config, {
          onConnected(stream) {
            if (!cancelled) {
              setLiveMediaStream(stream);
              if (liveStateRef.current === "starting" || liveStateRef.current === "resuming" || liveStateRef.current === "sleeping") {
                setLiveState("live");
              }
            }
          },
          onDisconnected() {
            if (!cancelled) {
              setLiveMediaStream(null);
              void logClientEvent("warn", "odyssey stream disconnected", {
                replayMode: replayModeRef.current,
              });
              if (!replayModeRef.current && currentSceneStartedRef.current) {
                setLiveState("sleeping");
              }
            }
          },
          onStreamEnded() {
            if (!cancelled) {
              setLiveMediaStream(null);
              void logClientEvent("info", "odyssey stream ended", {
                replayMode: replayModeRef.current,
              });
              if (!replayModeRef.current && currentSceneStartedRef.current) {
                setLiveState("sleeping");
              }
            }
          },
          onError(error) {
            console.error(error);
            if (!cancelled) {
              void logClientEvent("error", "odyssey handler error", {
                message: error.message,
              });
              setLiveState("error");
            }
          },
        });
      })
      .catch((error) => {
        console.error(error);
        void logClientEvent("error", "odyssey config bootstrap failed", {
          message: error instanceof Error ? error.message : "unknown",
        });
      });

    return () => {
      cancelled = true;
      odysseyClientRef.current?.disconnect();
      odysseyClientRef.current = null;
    };
  }, [logClientEvent]);

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

  async function reserveFrameKey(sceneId: string) {
    const response = await fetch("/api/storage/frame-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        sceneId,
        extension: "jpg",
      }),
    });

    if (!response.ok) {
      throw new Error(`Frame key reservation failed with ${response.status}`);
    }

    const payload = (await response.json()) as { frameKey: string };
    return payload.frameKey;
  }

  function ensureOdysseyClient() {
    if (!odysseyClientRef.current) {
      odysseyClientRef.current = createOdysseyClient(odysseyConfig, {
        onConnected(stream) {
          setLiveMediaStream(stream);
          if (liveStateRef.current === "starting" || liveStateRef.current === "resuming" || liveStateRef.current === "sleeping") {
            setLiveState("live");
          }
        },
        onDisconnected() {
          setLiveMediaStream(null);
          void logClientEvent("warn", "odyssey stream disconnected", {
            replayMode: replayModeRef.current,
          });
          if (!replayModeRef.current && currentSceneStartedRef.current) {
            setLiveState("sleeping");
          }
        },
        onStreamEnded() {
          setLiveMediaStream(null);
          void logClientEvent("info", "odyssey stream ended", {
            replayMode: replayModeRef.current,
          });
          if (!replayModeRef.current && currentSceneStartedRef.current) {
            setLiveState("sleeping");
          }
        },
        onError(error) {
          console.error(error);
          void logClientEvent("error", "odyssey handler error", {
            message: error.message,
          });
          setLiveState("error");
        },
      });
    }

    return odysseyClientRef.current;
  }

  async function endActiveStream(sceneId: string | null, segmentId: string | null) {
    if (!sceneId || !segmentId) {
      return null;
    }

    let frameKey: string | null = null;

    try {
      const capture = await captureFrame(liveVideoRef.current);
      if (capture?.objectUrl) {
        setCurrentFrameUrl(capture.objectUrl);
      }
      frameKey = await reserveFrameKey(sceneId);
    } catch (error) {
      console.error(error);
      void logClientEvent("error", "frame capture failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    await ensureOdysseyClient().endStream();
    setLiveMediaStream(null);

    try {
      await fetch(`/api/segments/${segmentId}/end-ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lastFrameKey: frameKey ?? undefined,
        }),
      });
    } catch (error) {
      console.error(error);
      void logClientEvent("error", "segment end ack failed", {
        segmentId,
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    return frameKey;
  }

  async function startLaunchedStream(segmentId: string, prompt: string, frameKey: string | null) {
    let seedImage: Blob | null = null;

    if (frameKey) {
      try {
        const readUrl = await loadFrameUrl(frameKey);
        if (readUrl) {
          const response = await fetch(readUrl);
          seedImage = await response.blob();
        }
      } catch (error) {
        console.error(error);
        void logClientEvent("warn", "frame seed load failed", {
          frameKey,
          message: error instanceof Error ? error.message : "unknown",
        });
      }
    }

    const streamId = await ensureOdysseyClient().startStream(prompt, seedImage);

    const ackResponse = await fetch(`/api/segments/${segmentId}/start-ack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        odysseyStreamId: streamId,
      }),
    });

    if (!ackResponse.ok) {
      void logClientEvent("error", "segment start ack failed", {
        segmentId,
        status: ackResponse.status,
      });
      throw new Error(`Segment start ack failed with ${ackResponse.status}`);
    }
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
      const previousSceneId = currentScene?.id ?? null;
      const previousSegmentId = currentScene?.latestSegmentId ?? null;

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

      if (payload.action.type === "transition") {
        await endActiveStream(previousSceneId, previousSegmentId);
      }

      applySessionDetail(detail);
      setWorldState(detail.worldState ?? mergeWorldState(worldState, payload.worldStateUpdates));
      setReplaySceneId(null);
      setReplayMediaUrl(null);
      setReplayMediaKind(null);

      if (payload.launch) {
        if (payload.action.type === "transition") {
          setLiveState("transitioning");
        }
        await startLaunchedStream(payload.launch.segmentId, payload.launch.prompt, payload.launch.frameKey);
        setLiveState("live");
      } else if (payload.action.type === "transition") {
        setLiveState("transitioning");
        window.setTimeout(() => setLiveState("live"), 1200);
      } else if (payload.action.type === "noop") {
        setLiveState(publishedActiveScene?.hasStarted ? "live" : "idle");
      } else {
        interactQueue.enqueue(payload.action.prompt);
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
      const previousSceneId = currentScene?.id ?? null;
      const previousSegmentId = currentScene?.latestSegmentId ?? null;

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
      await endActiveStream(previousSceneId, previousSegmentId);
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
      if (!replayMode && currentSceneStarted) {
        await endActiveStream(currentSceneId, currentScene?.latestSegmentId ?? null);
      }

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
      await endActiveStream(currentSceneId, currentScene?.latestSegmentId ?? null);

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
      if (payload.segmentId) {
        await startLaunchedStream(payload.segmentId, payload.startPrompt, payload.frameKey);
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
          liveMediaStream={liveMediaStream}
          liveVideoRef={liveVideoRef}
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
