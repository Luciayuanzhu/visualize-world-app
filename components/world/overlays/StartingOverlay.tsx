export function StartingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      <div
        className="h-10 w-10 rounded-full border-2 border-l-transparent animate-spin"
        style={{ borderColor: "rgba(219,166,31,0.18)", borderLeftColor: "var(--accent)" }}
      />
      <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        World is forming…
      </p>
    </div>
  );
}
