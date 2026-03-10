import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { getMockSessionList } from "@/lib/mocks/session";

export default function SessionsPage() {
  const sessions = getMockSessionList();

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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/session/${session.id}?state=live`}
              className="rounded-[20px] border p-4 transition-transform duration-150 hover:-translate-y-0.5"
              style={{ borderColor: "var(--border)", background: "rgba(23,18,13,0.9)" }}
            >
              <div
                className="aspect-video rounded-[14px] border"
                style={{
                  borderColor: "rgba(255,255,255,0.05)",
                  background:
                    "linear-gradient(180deg, rgba(255,233,181,0.12), rgba(15,12,8,0.72)), linear-gradient(140deg, #15110c, #6a4d24 48%, #120d09)",
                }}
              />
              <div className="mt-4">
                <h2 className="text-lg font-bold">{session.title}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  3 scenes
                </p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
