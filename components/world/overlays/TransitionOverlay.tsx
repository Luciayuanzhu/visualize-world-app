export function TransitionOverlay({ sceneName }: { sceneName: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>
        New Scene
      </p>
      <p className="mt-3 text-5xl font-semibold" style={{ fontFamily: "Newsreader, serif" }}>
        {sceneName}
      </p>
    </div>
  );
}
