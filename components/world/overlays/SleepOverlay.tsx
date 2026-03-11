import type { SleepReason } from "@/types/world";

interface SleepOverlayProps {
  onWake?: () => void;
  reason?: SleepReason;
}

export function SleepOverlay({ onWake, reason = "manual" }: SleepOverlayProps) {
  const title = reason === "timeout" ? "This world segment ended" : reason === "disconnect" ? "World connection paused" : "World is resting";
  const description =
    reason === "timeout"
      ? "This live exploration reached the 150-second Odyssey limit. Resume World to continue from here."
      : reason === "disconnect"
        ? "The live stream disconnected. Resume World to reconnect from the latest frame."
        : "It will wake from where you left it.";
  const buttonLabel = reason === "timeout" ? "Continue World" : "Resume World";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md">
      <p className="text-4xl font-bold">{title}</p>
      <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
      <button
        className="mt-6 rounded-xl px-6 py-3 text-sm font-bold"
        style={{ background: "var(--accent)", color: "#1f180d" }}
        onClick={onWake}
        type="button"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
