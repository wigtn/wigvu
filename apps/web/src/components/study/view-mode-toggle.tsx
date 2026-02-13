"use client";

export type ViewMode = "interleaved" | "original" | "translation";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const MODES: { value: ViewMode; label: string }[] = [
  { value: "interleaved", label: "교차" },
  { value: "original", label: "원문만" },
  { value: "translation", label: "번역만" },
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
