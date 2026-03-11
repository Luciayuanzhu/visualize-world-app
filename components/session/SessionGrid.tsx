"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteWorldDialog } from "@/components/session/DeleteWorldDialog";

interface SessionCard {
  id: string;
  title: string;
  sceneCount: number;
  previewUrl: string | null;
}

interface SessionGridProps {
  sessions: SessionCard[];
}

export function SessionGrid({ sessions }: SessionGridProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const pendingSession = sessions.find((session) => session.id === pendingDeleteId) ?? null;

  async function handleDelete() {
    if (!pendingSession || deleting) {
      return;
    }

    setDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const response = await fetch(`/api/sessions/${pendingSession.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Delete failed with ${response.status}`);
      }

      setPendingDeleteId(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      setDeleteErrorMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="group relative rounded-[20px] border p-4 transition duration-150 hover:-translate-y-0.5 hover:brightness-110"
            style={{ borderColor: "var(--border)", background: "rgba(23,18,13,0.9)" }}
          >
            <button
              type="button"
              onClick={() => {
                setDeleteErrorMessage(null);
                setPendingDeleteId(session.id);
              }}
              className="absolute right-5 top-5 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-sm font-semibold transition duration-150 hover:brightness-110"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(11,9,7,0.72)",
                color: "var(--text-primary)",
              }}
              aria-label={`Delete ${session.title}`}
            >
              ×
            </button>
            <Link href={`/session/${session.id}`} className="block cursor-pointer">
              <div
                className="aspect-video rounded-[14px] border bg-cover bg-center"
                style={{
                  borderColor: "rgba(255,255,255,0.05)",
                  backgroundImage: session.previewUrl
                    ? `linear-gradient(180deg, rgba(10,9,7,0.08), rgba(10,9,7,0.28)), url("${session.previewUrl}")`
                    : undefined,
                  background:
                    session.previewUrl === null
                      ? "linear-gradient(180deg, rgba(255,233,181,0.12), rgba(15,12,8,0.72)), linear-gradient(140deg, #15110c, #6a4d24 48%, #120d09)"
                      : undefined,
                }}
              />
              <div className="mt-4">
                <h2 className="text-lg font-bold">{session.title}</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {session.sceneCount} scenes
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <DeleteWorldDialog
        open={Boolean(pendingSession)}
        deleting={deleting}
        title={pendingSession?.title ?? "Untitled World"}
        errorMessage={deleteErrorMessage}
        onCancel={() => {
          if (deleting) {
            return;
          }
          setDeleteErrorMessage(null);
          setPendingDeleteId(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
