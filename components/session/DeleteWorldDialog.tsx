"use client";

interface DeleteWorldDialogProps {
  open: boolean;
  deleting?: boolean;
  title: string;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteWorldDialog({ open, deleting = false, title, errorMessage = null, onCancel, onConfirm }: DeleteWorldDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,5,4,0.68)] px-6 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-[28px] border p-7 shadow-[0_28px_80px_rgba(0,0,0,0.42)]"
        style={{
          borderColor: "rgba(219,166,31,0.18)",
          background:
            "radial-gradient(circle at top, rgba(255,222,133,0.15), rgba(21,16,11,0) 36%), linear-gradient(180deg, rgba(24,18,12,0.98), rgba(14,11,8,0.98))",
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>
          Delete World
        </p>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-tight">Delete this world?</h2>
        <p className="mt-4 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {title || "Untitled World"}
          </span>{" "}
          will be permanently removed with its scenes, drafts, snapshots, and stream history. This cannot be undone.
        </p>
        {errorMessage ? (
          <p className="mt-4 rounded-xl border px-4 py-3 text-sm leading-6" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#f3c8a3", background: "rgba(83,39,18,0.42)" }}>
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
            style={{
              borderColor: "var(--border)",
              background: "rgba(255,255,255,0.04)",
              color: deleting ? "#796f61" : "var(--text-primary)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
            style={{
              background: deleting ? "rgba(219,166,31,0.42)" : "var(--accent)",
              color: "#1f180d",
            }}
          >
            {deleting ? "Deleting..." : "Delete World"}
          </button>
        </div>
      </div>
    </div>
  );
}
