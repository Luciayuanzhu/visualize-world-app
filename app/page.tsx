import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <main className="flex min-h-screen items-center justify-center px-6">
        <section
          className="w-full max-w-5xl rounded-[28px] border p-14"
          style={{ borderColor: "var(--border)", background: "linear-gradient(180deg, rgba(26,21,14,0.96), rgba(15,12,8,0.98))" }}
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-4xl font-extrabold uppercase tracking-[0.04em]">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: "var(--accent)" }} />
              <span>Visualize</span>
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8" style={{ color: "var(--text-secondary)" }}>
              Write while a living world grows beside your draft.
            </p>
            <div
              className="mx-auto mt-10 aspect-[21/9] w-full rounded-[18px] border"
              style={{
                borderColor: "var(--border)",
                background:
                  "linear-gradient(180deg, rgba(245,224,170,0.10), rgba(15,12,8,0.64)), radial-gradient(circle at 50% 20%, rgba(255,222,151,0.45), transparent 24%), linear-gradient(140deg, #0f1216 10%, #53442a 50%, #1d130b 90%)",
              }}
            />
            <div className="mt-10 flex justify-center gap-4">
              <Link
                className="rounded-xl px-6 py-3 text-sm font-bold"
                href="/session/demo"
                style={{ background: "var(--accent)", color: "#1f180d" }}
              >
                Start writing
              </Link>
              <Link
                className="rounded-xl border px-6 py-3 text-sm font-semibold"
                href="/sessions"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                View sessions
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
