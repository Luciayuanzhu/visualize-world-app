interface SceneThumbnailProps {
  name: string;
  active?: boolean;
}

export function SceneThumbnail({ name, active = false }: SceneThumbnailProps) {
  return (
    <div
      className="flex min-w-[120px] items-center gap-2 rounded-lg border p-2"
      style={{
        borderColor: active ? "var(--accent)" : "var(--border)",
        background: active ? "rgba(219,166,31,0.12)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="h-7 w-10 rounded-md" style={{ background: "linear-gradient(160deg, rgba(219,166,31,0.24), rgba(255,255,255,0.04))" }} />
      <div className="min-w-0">
        <div className="truncate text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
          {active ? "Current" : "Scene"}
        </div>
        <div className="truncate text-[11px] font-semibold">{name}</div>
      </div>
    </div>
  );
}
