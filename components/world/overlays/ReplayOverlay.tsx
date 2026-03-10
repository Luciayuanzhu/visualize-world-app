interface ReplayOverlayProps {
  sceneName: string;
  onBack?: () => void;
}

export function ReplayOverlay({ sceneName, onBack }: ReplayOverlayProps) {
  return (
    <>
      <button
        className="absolute left-4 top-4 rounded-lg border px-4 py-2 text-sm font-semibold"
        style={{ borderColor: "var(--border)", background: "rgba(6,6,6,0.52)" }}
        onClick={onBack}
        type="button"
      >
        Back to Current
      </button>
      <div
        className="absolute right-4 top-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(6,6,6,0.42)" }}
      >
        Replay
      </div>
      <div className="absolute bottom-5 left-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
          Replaying Scene
        </p>
        <p className="mt-2 text-xl font-semibold">{sceneName}</p>
      </div>
    </>
  );
}
