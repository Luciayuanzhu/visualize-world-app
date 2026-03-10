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
        className="absolute left-40 top-4 rounded-lg border px-4 py-2 text-sm"
        style={{ borderColor: "var(--border)", background: "rgba(6,6,6,0.52)" }}
      >
        Replay: {sceneName}
      </div>
    </>
  );
}
