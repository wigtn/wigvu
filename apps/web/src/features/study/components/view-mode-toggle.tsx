"use client";

export type ViewMode = "interleaved" | "original" | "translation";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: { value: ViewMode; label: string }[] = [
  { value: "interleaved", label: "Both" },
  { value: "original", label: "Original" },
  { value: "translation", label: "Translation" },
];

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="view-mode-toggle">
      {MODES.map((m) => (
        <button
          key={m.value}
          className={mode === m.value ? "active" : ""}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
