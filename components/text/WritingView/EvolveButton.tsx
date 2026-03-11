interface EvolveButtonProps {
  label: "Conjure World" | "Evolve";
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  onClick?: () => void;
}

export function EvolveButton({ label, disabled = false, loading = false, loadingLabel = "Publishing…", onClick }: EvolveButtonProps) {
  return (
    <button
      className="w-full cursor-pointer rounded-xl px-5 py-3 text-sm font-bold transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:hover:brightness-100"
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        background: disabled || loading ? "#2a2318" : "var(--accent)",
        color: disabled || loading ? "#796f61" : "#1f180d",
      }}
      type="button"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
