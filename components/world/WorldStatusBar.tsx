interface WorldStatusBarProps {
  visible?: boolean;
}

export function WorldStatusBar({ visible = false }: WorldStatusBarProps) {
  if (!visible) return null;

  return <div className="absolute left-0 top-0 h-[3px] w-1/2" style={{ background: "var(--accent)" }} />;
}
