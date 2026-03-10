import type { LiveState } from "@/types/world";
import { ReplayOverlay } from "@/components/world/overlays/ReplayOverlay";
import { ResumingOverlay } from "@/components/world/overlays/ResumingOverlay";
import { SleepOverlay } from "@/components/world/overlays/SleepOverlay";
import { StartingOverlay } from "@/components/world/overlays/StartingOverlay";
import { TransitionOverlay } from "@/components/world/overlays/TransitionOverlay";

interface WorldOverlayProps {
  liveState: LiveState;
  sceneName: string;
}

export function WorldOverlay({ liveState, sceneName }: WorldOverlayProps) {
  switch (liveState) {
    case "starting":
      return <StartingOverlay />;
    case "sleeping":
      return <SleepOverlay />;
    case "resuming":
      return <ResumingOverlay />;
    case "transitioning":
      return <TransitionOverlay sceneName={sceneName} />;
    case "replay":
      return <ReplayOverlay sceneName={sceneName} />;
    case "error":
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20">
          <p className="text-5xl font-semibold" style={{ fontFamily: "Newsreader, serif" }}>
            Connection lost
          </p>
          <button className="mt-6 rounded-full border px-6 py-2 text-sm font-semibold" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
            Retry
          </button>
        </div>
      );
    default:
      return null;
  }
}
