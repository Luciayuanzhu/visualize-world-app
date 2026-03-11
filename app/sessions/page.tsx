import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const user = await requireUser();
  const sessions = await db.worldSession.findMany({
    where: { userId: user.uid },
    include: {
      scenes: {
        orderBy: { index: "asc" },
        include: {
          segments: {
            orderBy: { startedAt: "desc" },
            select: { lastFrameDataUrl: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      <TopBar title="Sessions" showNewSession />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight">Session List</h1>
          <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
            Pick up where you left off in your writing workflow.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {sessions.map((session) => {
            const currentScene = session.scenes.find((scene) => scene.id === session.currentSceneId) ?? session.scenes[session.scenes.length - 1] ?? null;
            const previewUrl = currentScene?.segments[0]?.lastFrameDataUrl ?? null;

            return (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="cursor-pointer rounded-[20px] border p-4 transition duration-150 hover:-translate-y-0.5 hover:brightness-110"
                style={{ borderColor: "var(--border)", background: "rgba(23,18,13,0.9)" }}
              >
                <div
                  className="aspect-video rounded-[14px] border bg-cover bg-center"
                  style={{
                    borderColor: "rgba(255,255,255,0.05)",
                    backgroundImage: previewUrl ? `linear-gradient(180deg, rgba(10,9,7,0.08), rgba(10,9,7,0.28)), url("${previewUrl}")` : undefined,
                    background:
                      previewUrl === null
                        ? "linear-gradient(180deg, rgba(255,233,181,0.12), rgba(15,12,8,0.72)), linear-gradient(140deg, #15110c, #6a4d24 48%, #120d09)"
                        : undefined,
                  }}
                />
                <div className="mt-4">
                  <h2 className="text-lg font-bold">{session.title}</h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {session.scenes.length} scenes
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
