import { VideoStream } from "@/components/world/VideoStream";
import { WorldOverlay } from "@/components/world/overlays/WorldOverlay";
import { WorldStatusBar } from "@/components/world/WorldStatusBar";
import type { LiveState } from "@/types/world";

export function WorldPanel({
  liveState,
  sceneName,
  onBackToCurrent,
  onWake,
}: {
  liveState: LiveState;
  sceneName?: string;
  onBackToCurrent?: () => void;
  onWake?: () => void;
}) {
  return (
    <section className="relative min-w-[480px] flex-[3] overflow-hidden border-r bg-black" style={{ borderColor: "var(--border)" }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,234,182,0.13), rgba(12,10,7,0.76)), linear-gradient(90deg, rgba(66,49,27,0.75), rgba(255,232,180,0.06), rgba(66,49,27,0.75)), linear-gradient(160deg, #1f170d 0%, #5a4424 44%, #100d0a 100%)",
        }}
      />
      <VideoStream />
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
            Write 100 characters to conjure a world.
          </p>
        </div>
      ) : null}
      {liveState === "updating" ? (
        <div className="absolute bottom-4 left-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          World reacting…
        </div>
      ) : null}
      <WorldOverlay liveState={liveState} sceneName={sceneName ?? "Vault Opening"} onBackToCurrent={onBackToCurrent} onWake={onWake} />
    </section>
  );
}
