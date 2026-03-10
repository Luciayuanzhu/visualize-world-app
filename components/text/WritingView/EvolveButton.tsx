interface EvolveButtonProps {
  label: "Conjure World" | "Evolve";
  disabled?: boolean;
}

export function EvolveButton({ label, disabled = false }: EvolveButtonProps) {
  return (
    <button
      className="w-full rounded-xl px-5 py-3 text-sm font-bold"
      disabled={disabled}
      style={{
        background: disabled ? "#2a2318" : "var(--accent)",
        color: disabled ? "#796f61" : "#1f180d",
      }}
      type="button"
    >
      {label}
    </button>
  );
}
