"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link as LinkIcon } from "lucide-react";

const URL_PATTERN = /^https?:\/\//;

export function StudyInput() {
  const router = useRouter();
  const [text, setText] = useState("");

  const isUrl = URL_PATTERN.test(text.trim());
  const isEmpty = text.trim().length === 0;

  const handleSubmit = () => {
    if (isEmpty) return;
    const encoded = encodeURIComponent(text.trim());
    if (isUrl) {
      router.push(`/study?url=${encoded}`);
    } else {
      sessionStorage.setItem("studyText", text.trim());
      router.push("/study");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="relative text-left">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="한국어 텍스트 또는 URL을 붙여넣으세요..."
        className="input-field min-h-[120px] pr-4 pb-12"
        rows={4}
      />

      {/* URL indicator */}
      {isUrl && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--accent)]">
          <LinkIcon size={12} />
          <span>URL에서 텍스트를 가져옵니다</span>
        </div>
      )}

      {/* Submit button */}
      <div className="absolute bottom-3 right-3">
        <button
          onClick={handleSubmit}
          disabled={isEmpty}
          className="btn-primary px-4 py-2 text-sm"
        >
          학습 시작
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
