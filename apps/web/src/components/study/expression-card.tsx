"use client";

import type { StudyExpression } from "@/types/study";

interface ExpressionCardProps {
  expression: StudyExpression;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  idiom: { bg: "var(--level-beginner-bg)", text: "var(--level-beginner)", label: "숙어" },
  collocation: { bg: "var(--accent-light)", text: "var(--accent)", label: "콜로케이션" },
  slang: { bg: "var(--level-intermediate-bg)", text: "var(--level-intermediate)", label: "구어체" },
  formal_expression: { bg: "var(--level-advanced-bg)", text: "var(--level-advanced)", label: "격식 표현" },
  grammar_pattern: { bg: "var(--accent-light)", text: "var(--info)", label: "문법 패턴" },
};

export function ExpressionCard({ expression }: ExpressionCardProps) {
  const style = CATEGORY_STYLES[expression.category] || CATEGORY_STYLES.collocation;

  const scrollToSentence = () => {
    if (expression.sentenceId !== undefined) {
      const el = document.getElementById(`sentence-${expression.sentenceId + 1}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div
      className="p-4 rounded-lg bg-[var(--background-secondary)] cursor-pointer hover:bg-[var(--border)] transition-colors"
      onClick={scrollToSentence}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-base font-semibold text-[var(--foreground)]">
          {expression.expression}
        </p>
        <span
          className="badge shrink-0"
          style={{
            backgroundColor: style.bg,
            color: style.text,
          }}
        >
          {style.label}
        </span>
      </div>
      <p className="text-sm text-[var(--foreground-secondary)]">
        {expression.meaning}
      </p>
      {expression.context && (
        <p className="text-xs text-[var(--foreground-secondary)] mt-1 opacity-60">
          &ldquo;{expression.context}&rdquo;
        </p>
      )}
    </div>
  );
}
