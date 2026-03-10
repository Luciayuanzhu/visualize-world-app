interface TopBarProps {
  title: string;
  showNewSession?: boolean;
}

export function TopBar({ title, showNewSession = false }: TopBarProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b px-6" style={{ borderColor: "var(--border)", background: "rgba(15,12,8,0.94)" }}>
      <div className="flex items-center gap-3">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 16px rgba(219,166,31,0.45)" }} />
        <span className="text-xs font-bold uppercase tracking-[0.12em]">Visualize</span>
        <span className="text-sm text-[color:var(--text-secondary)]">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {showNewSession ? (
          <button
            className="rounded-lg border px-4 py-2 text-xs font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            + New Session
          </button>
        ) : null}
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold"
          style={{ borderColor: "var(--border)", background: "rgba(219,166,31,0.12)", color: "var(--accent)" }}
        >
          JD
        </span>
      </div>
    </header>
  );
}
