interface SceneThumbnailProps {
  index: number;
  name: string;
  active?: boolean;
  onClick?: () => void;
}

function isSystemSceneName(name: string, index: number) {
  return name.trim().toLowerCase() === `scene ${index}`.toLowerCase();
}

export function SceneThumbnail({ index, name, active = false, onClick }: SceneThumbnailProps) {
  const showTitle = !isSystemSceneName(name, index);

  return (
    <button
      className="flex min-w-[120px] cursor-pointer items-center gap-2 rounded-lg border p-2 transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
      onClick={onClick}
      style={{
        borderColor: active ? "var(--accent)" : "var(--border)",
        background: active ? "rgba(219,166,31,0.12)" : "rgba(255,255,255,0.03)",
      }}
      type="button"
    >
      <div className="h-7 w-10 rounded-md" style={{ background: "linear-gradient(160deg, rgba(219,166,31,0.24), rgba(255,255,255,0.04))" }} />
      <div className="min-w-0">
        <div className="truncate text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
          {`Scene ${index}`}
        </div>
        <div className="truncate text-[11px] font-semibold">{showTitle ? name : active ? "Current" : "Untitled"}</div>
      </div>
    </button>
  );
}
