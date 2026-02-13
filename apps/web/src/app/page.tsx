"use client";

import { StudyInput } from "@/components/study/study-input";
import { RecommendedLinks } from "@/components/study/recommended-links";

export default function Home() {
  return (
    <div className="flex flex-col items-center px-4 sm:px-6" style={{ paddingTop: "15vh" }}>
      <div className="w-full max-w-[640px] text-center space-y-6">
        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            한국어, 읽으면서 배우세요
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)]">
            텍스트를 붙여넣으면 AI가 문장별로 번역해드려요
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
