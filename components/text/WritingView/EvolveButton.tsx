interface EvolveButtonProps {
  label: "Conjure World" | "Evolve";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function EvolveButton({ label, disabled = false, loading = false, onClick }: EvolveButtonProps) {
  return (
    <button
      className="w-full rounded-xl px-5 py-3 text-sm font-bold"
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        background: disabled || loading ? "#2a2318" : "var(--accent)",
        color: disabled || loading ? "#796f61" : "#1f180d",
      }}
      type="button"
    >
      {loading ? "Publishing…" : label}
    </button>
  );
}
