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
import { DIRECTION_INTERACT_PROMPTS, PRE_WORLD_MIN_CHARACTERS, type DirectionControl } from "@/lib/session-config";
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
import type { LiveState, SleepReason, WorldState } from "@/types/world";

interface SceneDraftState {
  id: string;
  index: number;
  name: string;
  hasStarted: boolean;
  draftContent: string;
  publishedFromOffset: number;
  latestSegmentId: string | null;
  latestLastFrameKey: string | null;
  latestLastFrameDataUrl: string | null;
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
  type PendingRequest = "publish" | "startScene" | "sleep" | "wake" | null;

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
  const [currentFrameUrl, setCurrentFrameUrl] = useState(initialSceneRecord?.latestLastFrameDataUrl ?? null);
  const [replayMediaUrl, setReplayMediaUrl] = useState<string | null>(null);
  const [replayMediaKind, setReplayMediaKind] = useState<"image" | "video" | null>(null);
  const [liveMediaStream, setLiveMediaStream] = useState<MediaStream | null>(null);
  const [sleepReason, setSleepReason] = useState<SleepReason>("manual");
  const [pendingRequest, setPendingRequest] = useState<PendingRequest>(null);
  const [assistLoadingAction, setAssistLoadingAction] = useState<"continue" | "polish" | null>(null);
  const [movementStatus, setMovementStatus] = useState<string | null>(null);
  const [odysseyConfig, setOdysseyConfig] = useState<OdysseyClientConfigResponse>({ enabled: false, mode: "mock" });
  const odysseyClientRef = useRef<OdysseyClientHandle | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const movementStatusTimeoutRef = useRef<number | null>(null);
  const previewCaptureTimeoutRef = useRef<number | null>(null);
  const liveStateRef = useRef<LiveState>(initialLiveState);
  const sleepReasonRef = useRef<SleepReason>("manual");
  const pendingSleepReasonRef = useRef<SleepReason | null>(null);
  const currentSceneIdRef = useRef<string | null>(activeSceneId);
  const currentSceneStartedRef = useRef(initialSceneStarted);
  const lastPersistedSceneIdRef = useRef<string | null>(activeSceneId);
  const lastPersistedDraftRef = useRef(initialDraft);
  const lastPersistedSceneNameRef = useRef(
    initialSceneRecord && isSystemSceneName(initialSceneRecord.name) ? "" : activeSceneName,
  );
  const lastPersistedPublishedOffsetRef = useRef(lastPublishedOffset);
  const replayModeRef = useRef(initialLiveState === "replay");
  const liveSegmentIdRef = useRef<string | null>(initialSceneRecord?.latestSegmentId ?? null);
  const previewCapturedSegmentIdRef = useRef<string | null>(null);
  const queuePreviewCaptureRef = useRef<() => void>(() => {});
  const { captureFrame } = useFrameCapture();

  const replayMode = liveState === "replay";
  const isSubmitting = pendingRequest !== null;
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
    sleepReasonRef.current = sleepReason;
  }, [sleepReason]);

  useEffect(() => {
    currentSceneIdRef.current = currentSceneId;
  }, [currentSceneId]);

  useEffect(() => {
    currentSceneStartedRef.current = currentSceneStarted;
  }, [currentSceneStarted]);

  useEffect(() => {
    replayModeRef.current = replayMode;
  }, [replayMode]);

  useEffect(() => {
    liveSegmentIdRef.current = currentScene?.latestSegmentId ?? null;
  }, [currentScene?.latestSegmentId]);

  const markScenePersisted = useCallback(
    (sceneId: string | null, nextDraft: string, nextSceneName: string, nextPublishedOffset: number) => {
      lastPersistedSceneIdRef.current = sceneId;
      lastPersistedDraftRef.current = nextDraft;
      lastPersistedSceneNameRef.current = nextSceneName;
      lastPersistedPublishedOffsetRef.current = nextPublishedOffset;
    },
    [],
  );

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimeoutRef.current !== null) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
  }, []);

  const clearMovementStatusTimer = useCallback(() => {
    if (movementStatusTimeoutRef.current !== null) {
      window.clearTimeout(movementStatusTimeoutRef.current);
      movementStatusTimeoutRef.current = null;
    }
  }, []);

  const clearPreviewCaptureTimer = useCallback(() => {
    if (previewCaptureTimeoutRef.current !== null) {
      window.clearTimeout(previewCaptureTimeoutRef.current);
      previewCaptureTimeoutRef.current = null;
    }
  }, []);
  const replayScene = useMemo(
    () => scenes.find((scene) => scene.id === replaySceneId) ?? null,
    [scenes, replaySceneId],
  );
  const selectedSceneName = replayMode ? replayScene?.name ?? currentSceneName : currentSceneName;
  const hasWorldStarted = currentSceneStarted;
  const hasUnpublishedText = hasWorldStarted ? draft.length > publishedOffset : draft.trim().length >= PRE_WORLD_MIN_CHARACTERS;

  const interactQueue = useInteractQueue(async (prompt: string) => {
    if (!prompt) {
      return;
    }

    try {
      await odysseyClientRef.current?.interact(prompt);
      void logClientEvent("info", "direction interact acknowledged", {
        prompt,
      });
    } catch (error) {
      console.error(error);
      void logClientEvent("error", "direction interact failed", {
        prompt,
        message: error instanceof Error ? error.message : "unknown",
      });
      clearMovementStatusTimer();
      setMovementStatus(null);
    }
  });

  const loadFrameUrl = useCallback(async (frameKey: string | null | undefined, segmentId?: string | null) => {
    if (!frameKey && !segmentId) {
      return null;
    }

    const response = await fetch("/api/storage/frame-read-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frameKey: frameKey ?? undefined, segmentId: segmentId ?? undefined }),
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

      const frameUrl = await loadFrameUrl(scene.latestLastFrameKey, scene.latestSegmentId);
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
    if (current?.latestLastFrameDataUrl) {
      setCurrentFrameUrl(current.latestLastFrameDataUrl);
      return;
    }

    if (!current?.latestLastFrameKey && !current?.latestSegmentId) {
      setCurrentFrameUrl(null);
      return;
    }

    void loadFrameUrl(current.latestLastFrameKey, current.latestSegmentId)
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

  async function patchScene(sceneId: string, update: UpdateSceneRequest) {
    await fetch(`/api/scenes/${sceneId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(update),
    });
  }

  const logClientEvent = useCallback(
    async (level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) => {
      const payload = {
        level,
        message,
        meta: {
          sessionId,
          currentSceneId: currentSceneIdRef.current,
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
    [sessionId],
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
              pendingSleepReasonRef.current = null;
              setSleepReason("manual");
              setLiveMediaStream(stream);
              queuePreviewCaptureRef.current();
              if (
                liveStateRef.current === "starting" ||
                liveStateRef.current === "resuming" ||
                liveStateRef.current === "sleeping" ||
                liveStateRef.current === "transitioning"
              ) {
                setLiveState("live");
              }
            }
          },
          onDisconnected() {
            if (!cancelled) {
              setLiveMediaStream(null);
              const nextSleepReason = pendingSleepReasonRef.current ?? sleepReasonRef.current ?? "disconnect";
              void logClientEvent("warn", "odyssey stream disconnected", {
                replayMode: replayModeRef.current,
                sleepReason: nextSleepReason,
              });
              if (!replayModeRef.current && currentSceneStartedRef.current) {
                setSleepReason(nextSleepReason === "manual" ? "disconnect" : nextSleepReason);
                setLiveState("sleeping");
              }
            }
          },
          onStreamEnded() {
            if (!cancelled) {
              const nextSleepReason = pendingSleepReasonRef.current ?? sleepReasonRef.current ?? "disconnect";
              void logClientEvent("info", "odyssey stream ended", {
                replayMode: replayModeRef.current,
                sleepReason: nextSleepReason,
              });
              if (!replayModeRef.current && currentSceneStartedRef.current) {
                setSleepReason(nextSleepReason === "manual" ? "disconnect" : nextSleepReason);
                setLiveState("sleeping");
              }
            }
          },
          onStreamError(reason, message) {
            if (!cancelled) {
              if (reason === "session_timeout") {
                pendingSleepReasonRef.current = "timeout";
                setSleepReason("timeout");
              }
              void logClientEvent("error", "odyssey stream error", {
                reason,
                message,
              });
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

  useEffect(() => {
    if (!currentSceneId || replayMode || isSubmitting) {
      clearAutosaveTimer();
      return;
    }

    const hasPendingChanges =
      currentSceneId !== lastPersistedSceneIdRef.current ||
      draft !== lastPersistedDraftRef.current ||
      currentSceneName !== lastPersistedSceneNameRef.current ||
      publishedOffset !== lastPersistedPublishedOffsetRef.current;

    if (!hasPendingChanges) {
      clearAutosaveTimer();
      return;
    }

    clearAutosaveTimer();
    autosaveTimeoutRef.current = window.setTimeout(() => {
      void patchScene(currentSceneId, {
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      })
        .then(() => {
          markScenePersisted(currentSceneId, draft, currentSceneName, publishedOffset);
        })
        .catch((error) => {
          console.error(error);
          void logClientEvent("error", "draft autosave failed", {
            message: error instanceof Error ? error.message : "unknown",
          });
        });
    }, 800);

    return () => {
      clearAutosaveTimer();
    };
  }, [clearAutosaveTimer, currentSceneId, currentSceneName, draft, isSubmitting, logClientEvent, markScenePersisted, publishedOffset, replayMode]);

  useEffect(() => {
    return () => {
      clearAutosaveTimer();
    };
  }, [clearAutosaveTimer]);

  useEffect(() => {
    return () => {
      clearMovementStatusTimer();
    };
  }, [clearMovementStatusTimer]);

  useEffect(() => {
    return () => {
      clearPreviewCaptureTimer();
    };
  }, [clearPreviewCaptureTimer]);

  useInactivitySleep(
    null,
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

    await patchScene(currentSceneId, update);
  }

  async function flushDraftAutosave() {
    clearAutosaveTimer();

    if (!currentSceneId || replayMode) {
      return;
    }

    const hasPendingChanges =
      currentSceneId !== lastPersistedSceneIdRef.current ||
      draft !== lastPersistedDraftRef.current ||
      currentSceneName !== lastPersistedSceneNameRef.current ||
      publishedOffset !== lastPersistedPublishedOffsetRef.current;

    if (!hasPendingChanges) {
      return;
    }

    await patchScene(currentSceneId, {
      draftContent: draft,
      name: currentSceneName.trim() || undefined,
      publishedFromOffset: publishedOffset,
    });
    markScenePersisted(currentSceneId, draft, currentSceneName, publishedOffset);
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

  const persistPreviewFrame = useCallback(async (segmentId: string, dataUrl: string) => {
    const response = await fetch(`/api/segments/${segmentId}/preview-frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lastFrameDataUrl: dataUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Preview frame save failed with ${response.status}`);
    }
  }, []);

  const queuePreviewCapture = useCallback(() => {
    clearPreviewCaptureTimer();

    let attempts = 0;
    const maxAttempts = 5;

    const runCapture = () => {
      attempts += 1;
      const segmentId = liveSegmentIdRef.current;
      if (!segmentId || previewCapturedSegmentIdRef.current === segmentId) {
        previewCaptureTimeoutRef.current = null;
        return;
      }

      void captureFrame(liveVideoRef.current)
        .then(async (capture) => {
          if (!capture?.dataUrl) {
            if (attempts < maxAttempts) {
              previewCaptureTimeoutRef.current = window.setTimeout(runCapture, 1200);
            } else {
              previewCaptureTimeoutRef.current = null;
            }
            return;
          }

          await persistPreviewFrame(segmentId, capture.dataUrl);
          previewCapturedSegmentIdRef.current = segmentId;
          setCurrentFrameUrl(capture.objectUrl);
          previewCaptureTimeoutRef.current = null;
        })
        .catch((error) => {
          console.error(error);
          void logClientEvent("warn", "preview frame capture failed", {
            segmentId,
            attempt: attempts,
            message: error instanceof Error ? error.message : "unknown",
          });
          if (attempts < maxAttempts) {
            previewCaptureTimeoutRef.current = window.setTimeout(runCapture, 1200);
          } else {
            previewCaptureTimeoutRef.current = null;
          }
        });
    };

    previewCaptureTimeoutRef.current = window.setTimeout(runCapture, 1800);
  }, [captureFrame, clearPreviewCaptureTimer, logClientEvent, persistPreviewFrame]);

  useEffect(() => {
    queuePreviewCaptureRef.current = queuePreviewCapture;
  }, [queuePreviewCapture]);

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
          pendingSleepReasonRef.current = null;
          setSleepReason("manual");
          setLiveMediaStream(stream);
          queuePreviewCaptureRef.current();
          if (
            liveStateRef.current === "starting" ||
            liveStateRef.current === "resuming" ||
            liveStateRef.current === "sleeping" ||
            liveStateRef.current === "transitioning"
          ) {
            setLiveState("live");
          }
        },
        onDisconnected() {
          setLiveMediaStream(null);
          const nextSleepReason = pendingSleepReasonRef.current ?? sleepReasonRef.current ?? "disconnect";
          void logClientEvent("warn", "odyssey stream disconnected", {
            replayMode: replayModeRef.current,
            sleepReason: nextSleepReason,
          });
          if (!replayModeRef.current && currentSceneStartedRef.current) {
            setSleepReason(nextSleepReason === "manual" ? "disconnect" : nextSleepReason);
            setLiveState("sleeping");
          }
        },
        onStreamEnded() {
          const nextSleepReason = pendingSleepReasonRef.current ?? sleepReasonRef.current ?? "disconnect";
          void logClientEvent("info", "odyssey stream ended", {
            replayMode: replayModeRef.current,
            sleepReason: nextSleepReason,
          });
          if (!replayModeRef.current && currentSceneStartedRef.current) {
            setSleepReason(nextSleepReason === "manual" ? "disconnect" : nextSleepReason);
            setLiveState("sleeping");
          }
        },
        onStreamError(reason, message) {
          if (reason === "session_timeout") {
            pendingSleepReasonRef.current = "timeout";
            setSleepReason("timeout");
          }
          void logClientEvent("error", "odyssey stream error", {
            reason,
            message,
          });
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

    clearPreviewCaptureTimer();
    let frameKey: string | null = null;
    let frameDataUrl: string | null = null;

    try {
      const capture = await captureFrame(liveVideoRef.current);
      if (capture?.objectUrl) {
        setCurrentFrameUrl(capture.objectUrl);
      }
      frameDataUrl = capture?.dataUrl ?? null;
      frameKey = await reserveFrameKey(sceneId);
    } catch (error) {
      console.error(error);
      void logClientEvent("error", "frame capture failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    await ensureOdysseyClient().endStream();
    if (liveSegmentIdRef.current === segmentId) {
      liveSegmentIdRef.current = null;
    }
    try {
      await fetch(`/api/segments/${segmentId}/end-ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lastFrameKey: frameKey ?? undefined,
          lastFrameDataUrl: frameDataUrl ?? undefined,
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
    liveSegmentIdRef.current = segmentId;
    previewCapturedSegmentIdRef.current = null;

    if (frameKey) {
      try {
        const readUrl = await loadFrameUrl(frameKey);
        const resolvedReadUrl = readUrl;
        if (resolvedReadUrl) {
          const response = await fetch(resolvedReadUrl);
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

    void logClientEvent("info", "odyssey stream started", {
      segmentId,
      odysseyStreamId: streamId,
    });
  }

  async function handleRetry() {
    if (isSubmitting) {
      return;
    }

    if (currentSceneStarted) {
      await handleWake();
      return;
    }

    if (draft.trim().length >= PRE_WORLD_MIN_CHARACTERS) {
      await handlePublish();
      return;
    }

    setLiveState("idle");
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

    currentSceneIdRef.current = nextActiveScene?.id ?? null;
    currentSceneStartedRef.current = nextActiveScene?.hasStarted ?? false;
    liveSegmentIdRef.current = nextActiveScene?.latestSegmentId ?? null;
    markScenePersisted(
      nextActiveScene?.id ?? null,
      nextActiveScene?.draftContent ?? "",
      nextActiveScene && isSystemSceneName(nextActiveScene.name) ? "" : nextActiveScene?.name ?? "",
      nextActiveScene?.publishedFromOffset ?? 0,
    );
    setSessionTitle(detail.title);
    setScenes(detail.scenes);
    setCurrentSceneId(nextActiveScene?.id ?? null);
    setCurrentSceneName(nextActiveScene && isSystemSceneName(nextActiveScene.name) ? "" : nextActiveScene?.name ?? "");
    setCurrentSceneStarted(nextActiveScene?.hasStarted ?? false);
    setDraft(nextActiveScene?.draftContent ?? "");
    setPublishedOffset(nextActiveScene?.publishedFromOffset ?? 0);
    setCurrentFrameUrl(nextActiveScene?.latestLastFrameDataUrl ?? null);
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
        markScenePersisted(currentSceneId, nextDraft, currentSceneName, publishedOffset);
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
    markScenePersisted(currentSceneId, draft, trimmed, publishedOffset);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handlePublish() {
    if (isSubmitting || replayMode || !hasUnpublishedText) {
      return;
    }

    setPendingRequest("publish");
    pendingSleepReasonRef.current = null;
    setSleepReason("manual");
    setLiveState(hasWorldStarted ? "updating" : "starting");

    try {
      const previousSceneId = currentScene?.id ?? null;
      const previousSegmentId = currentScene?.latestSegmentId ?? null;

      await flushDraftAutosave();
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });
      if (currentSceneId) {
        markScenePersisted(currentSceneId, draft, currentSceneName, publishedOffset);
      }

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
      void logClientEvent("error", "publish failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      setLiveState("error");
    } finally {
      setPendingRequest(null);
    }
  }

  async function handleStartNewScene() {
    if (isSubmitting || replayMode || !hasWorldStarted) {
      return;
    }

    setPendingRequest("startScene");
    pendingSleepReasonRef.current = null;
    setSleepReason("manual");

    try {
      const previousSceneId = currentScene?.id ?? null;
      const previousSegmentId = currentScene?.latestSegmentId ?? null;

      await flushDraftAutosave();
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });
      if (currentSceneId) {
        markScenePersisted(currentSceneId, draft, currentSceneName, publishedOffset);
      }

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

      currentSceneIdRef.current = scene.id;
      currentSceneStartedRef.current = false;
      liveSegmentIdRef.current = null;
      setScenes(nextScenes);
      setCurrentSceneId(scene.id);
      setCurrentSceneName("");
      setCurrentSceneStarted(false);
      setDraft("");
      setPublishedOffset(0);
      setCurrentFrameUrl(null);
      markScenePersisted(scene.id, "", "", 0);
      setReplaySceneId(null);
      setReplayMediaUrl(null);
      setReplayMediaKind(null);
      setSleepReason("manual");
      setLiveState("idle");

      void endActiveStream(previousSceneId, previousSegmentId).catch((error) => {
        console.error(error);
        void logClientEvent("error", "start new scene cleanup failed", {
          message: error instanceof Error ? error.message : "unknown",
        });
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      void logClientEvent("error", "start new scene failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      setLiveState("error");
    } finally {
      setPendingRequest(null);
    }
  }

  async function handleGoToPreviousScene() {
    if (!previousScene || isSubmitting) {
      return;
    }

    try {
      await flushDraftAutosave();
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });
      if (currentSceneId) {
        markScenePersisted(currentSceneId, draft, currentSceneName, publishedOffset);
      }
      await patchSession({ currentSceneId: previousScene.id });

      currentSceneIdRef.current = previousScene.id;
      currentSceneStartedRef.current = previousScene.hasStarted;
      liveSegmentIdRef.current = previousScene.latestSegmentId;
      setCurrentSceneId(previousScene.id);
      setCurrentSceneName(isSystemSceneName(previousScene.name) ? "" : previousScene.name);
      setCurrentSceneStarted(previousScene.hasStarted);
      setDraft(previousScene.draftContent);
      setPublishedOffset(previousScene.publishedFromOffset);
      setCurrentFrameUrl(previousScene.latestLastFrameDataUrl);
      markScenePersisted(
        previousScene.id,
        previousScene.draftContent,
        isSystemSceneName(previousScene.name) ? "" : previousScene.name,
        previousScene.publishedFromOffset,
      );
      setReplaySceneId(null);
      setReplayMediaUrl(null);
      setReplayMediaKind(null);
      setSleepReason("manual");
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
      await flushDraftAutosave();
      await patchCurrentScene({
        draftContent: draft,
        name: currentSceneName.trim() || undefined,
        publishedFromOffset: publishedOffset,
      });
      if (currentSceneId) {
        markScenePersisted(currentSceneId, draft, currentSceneName, publishedOffset);
      }
      await patchSession({ currentSceneId: nextScene.id });

      currentSceneIdRef.current = nextScene.id;
      currentSceneStartedRef.current = nextScene.hasStarted;
      liveSegmentIdRef.current = nextScene.latestSegmentId;
      setCurrentSceneId(nextScene.id);
      setCurrentSceneName(isSystemSceneName(nextScene.name) ? "" : nextScene.name);
      setCurrentSceneStarted(nextScene.hasStarted);
      setDraft(nextScene.draftContent);
      setPublishedOffset(nextScene.publishedFromOffset);
      setCurrentFrameUrl(nextScene.latestLastFrameDataUrl);
      markScenePersisted(
        nextScene.id,
        nextScene.draftContent,
        isSystemSceneName(nextScene.name) ? "" : nextScene.name,
        nextScene.publishedFromOffset,
      );
      setReplaySceneId(null);
      setReplayMediaUrl(null);
      setReplayMediaKind(null);
      setSleepReason("manual");
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
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene) {
      return;
    }

    try {
      if (sceneId === currentSceneId && replayMode) {
        handleBackToCurrent();
        return;
      }

      if (sceneId !== currentSceneId && !replayMode && currentSceneStarted) {
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
    setSleepReason("manual");
    setLiveState(currentSceneStarted ? "sleeping" : "idle");
  }

  async function handleSleep() {
    if (!currentSceneStarted || isSubmitting || replayMode) {
      return;
    }

    setPendingRequest("sleep");

    try {
      pendingSleepReasonRef.current = "manual";
      setSleepReason("manual");
      await flushDraftAutosave();
      await endActiveStream(currentSceneId, currentScene?.latestSegmentId ?? null);

      const response = await fetch(`/api/sessions/${sessionId}/sleep`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Sleep failed with ${response.status}`);
      }

      const payload = (await response.json()) as SleepSessionResponse;
      applySessionDetail(payload.session);
      if (payload.frameKey || currentScene?.latestSegmentId) {
        const nextFrameUrl = await loadFrameUrl(payload.frameKey, currentScene?.latestSegmentId);
        setCurrentFrameUrl(nextFrameUrl);
      }
      setLiveState("sleeping");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      void logClientEvent("error", "sleep failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      setLiveState("error");
    } finally {
      setPendingRequest(null);
    }
  }

  async function handleWake() {
    if (!currentSceneStarted) {
      return;
    }

    pendingSleepReasonRef.current = null;
    setSleepReason("manual");
    setPendingRequest("wake");
    setLiveState("resuming");

    try {
      await flushDraftAutosave();
      const response = await fetch(`/api/sessions/${sessionId}/wake`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Wake failed with ${response.status}`);
      }

      const payload = (await response.json()) as WakeSessionResponse;
      applySessionDetail(payload.session);
      setWorldState(payload.session.worldState ?? worldState);
      if (payload.frameKey || payload.segmentId) {
        const nextFrameUrl = await loadFrameUrl(payload.frameKey, payload.segmentId);
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
      void logClientEvent("error", "wake failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      setLiveState("error");
    } finally {
      setPendingRequest(null);
    }
  }

  function handleDirectionalInteract(direction: DirectionControl) {
    if (isSubmitting || replayMode || liveState !== "live") {
      return;
    }

    const prompt = DIRECTION_INTERACT_PROMPTS[direction];
    const movementLabel =
      direction === "forward"
        ? "Moving forward..."
        : direction === "backward"
          ? "Moving backward..."
          : direction === "left"
            ? "Turning left..."
            : "Turning right...";

    clearMovementStatusTimer();
    setMovementStatus(movementLabel);
    movementStatusTimeoutRef.current = window.setTimeout(() => {
      setMovementStatus(null);
      movementStatusTimeoutRef.current = null;
    }, 10_000);
    void logClientEvent("info", "direction interact requested", {
      direction,
      prompt,
    });

    interactQueue.enqueue(prompt);
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
          sleepReason={sleepReason}
          movementStatus={movementStatus}
          controlsDisabled={isSubmitting || replayMode}
          onDirectionInteract={handleDirectionalInteract}
          onBackToCurrent={handleBackToCurrent}
          onWake={handleWake}
          onRetry={handleRetry}
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
          publishLoading={pendingRequest === "publish"}
          startSceneLoading={pendingRequest === "startScene"}
        />
      </main>
      <Timeline scenes={scenes} activeSceneId={replayMode ? replaySceneId : currentSceneId} onSelectScene={handleSelectScene} />
    </div>
  );
}

function isSystemSceneName(name: string) {
  return /^Scene\s+\d+$/i.test(name.trim());
}
