export function ResumingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25">
      <div
        className="h-8 w-8 rounded-full border-2 border-l-transparent animate-spin"
        style={{ borderColor: "rgba(219,166,31,0.18)", borderLeftColor: "var(--accent)" }}
      />
      <p className="mt-4 text-lg font-semibold">Waking world…</p>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        This may take a moment.
      </p>
    </div>
  );
}
