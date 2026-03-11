import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { SessionGrid } from "@/components/session/SessionGrid";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const user = await requireUser();
  const sessions = await db.worldSession.findMany({
    where: { userId: user.uid },
    include: {
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
      scenes: {
        orderBy: { index: "asc" },
        include: {
          segments: {
            orderBy: { startedAt: "desc" },
            where: { lastFrameDataUrl: { not: null } },
            select: { lastFrameDataUrl: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  const visibleSessions = sessions.filter((session) => {
    const latestDraft = session.revisions[0]?.content.trim() ?? "";
    return session.scenes.length > 0 || latestDraft.length > 0 || session.title !== "Untitled World";
  });
  const sessionCards = visibleSessions.map((session) => ({
    id: session.id,
    title: session.title,
    sceneCount: session.scenes.length,
    previewUrl:
      [...session.scenes].reverse().find((scene) => scene.segments[0]?.lastFrameDataUrl)?.segments[0]?.lastFrameDataUrl ?? null,
  }));

  return (
    <div className="min-h-screen">
      <TopBar title="Sessions" showNewSession />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {visibleSessions.length === 0 ? (
          <div
            className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center rounded-[28px] border px-8 py-16 text-center"
            style={{
              borderColor: "var(--border)",
              background:
                "radial-gradient(circle at top, rgba(255,233,181,0.16), rgba(15,12,8,0) 38%), linear-gradient(180deg, rgba(24,18,12,0.96), rgba(14,11,8,0.96))",
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
              No Worlds Yet
            </p>
            <h1 className="mt-4 text-5xl font-extrabold tracking-tight">Create your first world</h1>
            <p className="mt-4 max-w-xl text-lg leading-8" style={{ color: "var(--text-secondary)" }}>
              Start from a blank draft, write at least 50 characters, and conjure your first explorable scene.
            </p>
            <Link
              href="/session/new"
              className="mt-8 cursor-pointer rounded-xl px-6 py-3 text-sm font-bold transition duration-150 hover:brightness-110"
              style={{ background: "var(--accent)", color: "#1f180d" }}
            >
              Create World
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h1 className="text-5xl font-extrabold tracking-tight">My Worlds</h1>
              <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
                Pick up where you left off in your writing workflow.
              </p>
            </div>
            <SessionGrid sessions={sessionCards} />
          </>
        )}
      </main>
    </div>
  );
}
