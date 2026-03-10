interface SleepOverlayProps {
  onWake?: () => void;
}

export function SleepOverlay({ onWake }: SleepOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md">
      <p className="text-4xl font-bold">World is resting</p>
      <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
        It will wake from where you left it.
      </p>
      <button
        className="mt-6 rounded-xl px-6 py-3 text-sm font-bold"
        style={{ background: "var(--accent)", color: "#1f180d" }}
        onClick={onWake}
        type="button"
      >
        Resume World
      </button>
    </div>
  );
}
