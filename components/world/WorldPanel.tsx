import type { RefObject } from "react";
import type { DirectionControl } from "@/lib/session-config";
import { VideoStream } from "@/components/world/VideoStream";
import { WorldOverlay } from "@/components/world/overlays/WorldOverlay";
import { WorldStatusBar } from "@/components/world/WorldStatusBar";
import { PRE_WORLD_MIN_CHARACTERS } from "@/lib/session-config";
import type { LiveState } from "@/types/world";

export function WorldPanel({
  liveState,
  sceneName,
  currentFrameUrl,
  liveMediaStream,
  liveVideoRef,
  replayMediaUrl,
  replayMediaKind,
  controlsDisabled = false,
  onDirectionInteract,
  onBackToCurrent,
  onWake,
  onRetry,
}: {
  liveState: LiveState;
  sceneName?: string;
  currentFrameUrl?: string | null;
  liveMediaStream?: MediaStream | null;
  liveVideoRef?: RefObject<HTMLVideoElement | null>;
  replayMediaUrl?: string | null;
  replayMediaKind?: "image" | "video" | null;
  controlsDisabled?: boolean;
  onDirectionInteract?: (direction: DirectionControl) => void;
  onBackToCurrent?: () => void;
  onWake?: () => void;
  onRetry?: () => void;
}) {
  const backgroundImage =
    liveState === "replay"
      ? replayMediaKind === "image"
        ? replayMediaUrl
        : null
      : liveState === "sleeping" || liveState === "resuming" || (liveState === "live" && !liveMediaStream)
        ? currentFrameUrl
        : null;

  return (
    <section className="relative min-w-[480px] flex-[3] overflow-hidden border-r bg-black" style={{ borderColor: "var(--border)" }}>
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: `url("${backgroundImage}")`,
            filter: liveState === "sleeping" ? "blur(12px) brightness(0.62)" : liveState === "replay" ? "none" : "blur(4px) brightness(0.7)",
          }}
        />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,234,182,0.13), rgba(12,10,7,0.76)), linear-gradient(90deg, rgba(66,49,27,0.75), rgba(255,232,180,0.06), rgba(66,49,27,0.75)), linear-gradient(160deg, #1f170d 0%, #5a4424 44%, #100d0a 100%)",
        }}
      />
      <VideoStream
        ref={liveVideoRef}
        mediaStream={liveState !== "replay" ? liveMediaStream : null}
        src={liveState === "replay" && replayMediaKind === "video" ? replayMediaUrl : null}
        loop={liveState === "replay" && replayMediaKind === "video"}
      />
      <WorldStatusBar visible={liveState === "updating"} />
      {liveState === "live" ? (
        <div
          className="absolute right-4 top-4 flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(6,6,6,0.42)" }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--live)" }} />
          <span>Live</span>
        </div>
      ) : null}
      {liveState === "idle" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
            Pre-world
          </p>
          <h1 className="mt-3 text-4xl font-bold">Write to begin</h1>
          <p className="mt-4 max-w-xl text-base leading-7" style={{ color: "var(--text-secondary)" }}>
            Write {PRE_WORLD_MIN_CHARACTERS} characters to conjure a world.
          </p>
        </div>
      ) : null}
      {liveState === "live" ? (
        <div className="absolute bottom-4 right-4 z-20 grid grid-cols-3 gap-2 pointer-events-auto">
          <div />
          <ControlButton disabled={controlsDisabled} label="↑" promptLabel="Move forward" onClick={() => onDirectionInteract?.("forward")} />
          <div />
          <ControlButton disabled={controlsDisabled} label="←" promptLabel="Turn left" onClick={() => onDirectionInteract?.("left")} />
          <ControlButton disabled={controlsDisabled} label="↓" promptLabel="Move backward" onClick={() => onDirectionInteract?.("backward")} />
          <ControlButton disabled={controlsDisabled} label="→" promptLabel="Turn right" onClick={() => onDirectionInteract?.("right")} />
        </div>
      ) : null}
      {liveState === "updating" ? (
        <div className="absolute bottom-4 left-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          World reacting…
        </div>
      ) : null}
      <WorldOverlay
        liveState={liveState}
        sceneName={sceneName ?? "Vault Opening"}
        onBackToCurrent={onBackToCurrent}
        onWake={onWake}
        onRetry={onRetry}
      />
    </section>
  );
}

function ControlButton({
  label,
  promptLabel,
  disabled = false,
  onClick,
}: {
  label: string;
  promptLabel: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={promptLabel}
      title={promptLabel}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-35"
      style={{
        borderColor: "rgba(255,255,255,0.12)",
        background: "rgba(8,8,8,0.52)",
        color: "var(--text-primary)",
        backdropFilter: "blur(10px)",
      }}
    >
      {label}
    </button>
  );
}
