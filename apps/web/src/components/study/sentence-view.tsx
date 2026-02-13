"use client";

import type { StudySentence } from "@/types/study";
import type { ViewMode } from "./view-mode-toggle";

interface SentenceViewProps {
  sentences: StudySentence[];
  viewMode: ViewMode;
}

export function SentenceView({ sentences, viewMode }: SentenceViewProps) {
  return (
    <div className="space-y-6">
      {sentences.map((sentence, i) => (
        <div key={i} className="space-y-1" id={`sentence-${i + 1}`}>
          {/* Original Korean */}
          {(viewMode === "interleaved" || viewMode === "original") && (
            <p
              className="text-lg leading-[1.8] font-medium text-[var(--foreground)]"
              style={{
                transition: "opacity 200ms ease, max-height 200ms ease",
              }}
            >
              {sentence.original}
            </p>
          )}

          {/* Translation */}
          {(viewMode === "interleaved" || viewMode === "translation") && (
            <p
              className="text-base leading-relaxed text-[var(--foreground-secondary)] pl-4 border-l-2 border-[var(--accent-light)]"
              style={{
                transition: "opacity 200ms ease, max-height 200ms ease",
              }}
            >
              {sentence.translated}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
