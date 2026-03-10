"use client";

interface DraftEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function DraftEditor({ value, onChange, readOnly = false }: DraftEditorProps) {
  return (
    <textarea
      className="min-h-[320px] w-full resize-none border-0 bg-transparent text-lg leading-8 outline-none"
      placeholder="Begin your story…"
      readOnly={readOnly}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
