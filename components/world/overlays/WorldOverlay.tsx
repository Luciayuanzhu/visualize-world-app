import type { LiveState, SleepReason } from "@/types/world";
import { ReplayOverlay } from "@/components/world/overlays/ReplayOverlay";
import { ResumingOverlay } from "@/components/world/overlays/ResumingOverlay";
import { SleepOverlay } from "@/components/world/overlays/SleepOverlay";
import { StartingOverlay } from "@/components/world/overlays/StartingOverlay";
import { TransitionOverlay } from "@/components/world/overlays/TransitionOverlay";

interface WorldOverlayProps {
  liveState: LiveState;
  sleepReason?: SleepReason;
  sceneName: string;
  onBackToCurrent?: () => void;
  onWake?: () => void;
  onRetry?: () => void;
}

export function WorldOverlay({ liveState, sleepReason, sceneName, onBackToCurrent, onWake, onRetry }: WorldOverlayProps) {
  switch (liveState) {
    case "starting":
      return <StartingOverlay />;
    case "sleeping":
      return <SleepOverlay onWake={onWake} reason={sleepReason} />;
    case "resuming":
      return <ResumingOverlay />;
    case "transitioning":
      return <TransitionOverlay sceneName={sceneName} />;
    case "replay":
      return <ReplayOverlay sceneName={sceneName} onBack={onBackToCurrent} />;
    case "error":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20">
          <p className="text-5xl font-semibold" style={{ fontFamily: "Newsreader, serif" }}>
            Connection lost
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 cursor-pointer rounded-full border px-6 py-2 text-sm font-semibold transition duration-150 hover:bg-white/5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            style={{ borderColor: "rgba(255,255,255,0.18)" }}
            disabled={!onRetry}
          >
            Retry
          </button>
        </div>
      );
    default:
      return null;
  }
}
