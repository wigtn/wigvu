"use client";

import { StudyInput } from "@/features/study/components/study-input";
import { RecommendedLinks } from "@/features/study/components/recommended-links";

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 sm:px-6" style={{ paddingTop: "15vh" }}>
      <div className="w-full max-w-[640px] text-center space-y-6">
        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Learn Korean by Reading
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Paste any Korean text and AI will translate it sentence by sentence
          </p>
        </div>

        {/* Input */}
        <StudyInput />

        {/* Recommended Links */}
        <RecommendedLinks />
      </div>
    </div>
  );
}
