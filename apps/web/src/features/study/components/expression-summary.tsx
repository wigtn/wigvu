"use client";

import type { StudyExpression } from "@/features/study/types/study";

interface ExpressionSummaryProps {
  expressions: StudyExpression[];
}

const CATEGORY_LABELS: Record<string, string> = {
  idiom: "Idiom",
  collocation: "Collocation",
  slang: "Slang",
  formal_expression: "Formal",
  grammar_pattern: "Grammar",
};

export function ExpressionSummary({ expressions }: ExpressionSummaryProps) {
  // Group by category
  const grouped = expressions.reduce<Record<string, StudyExpression[]>>(
    (acc, expr) => {
      const cat = expr.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(expr);
      return acc;
    },
    {},
  );

  const categories = Object.entries(grouped);

  if (categories.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-semibold mb-4">Expression Review Summary</h3>
      <p className="text-sm text-[var(--foreground-secondary)] mb-6">
        Expressions learned from this text
      </p>

      <div className="space-y-5">
        {categories.map(([category, exprs]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
              {CATEGORY_LABELS[category] || category} ({exprs.length})
            </h4>
            <ul className="space-y-1.5">
              {exprs.map((expr, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--foreground-secondary)]"
                >
                  <span className="text-[var(--foreground-secondary)]">· </span>
                  <span className="text-[var(--foreground)] font-medium">
                    {expr.expression}
                  </span>
                  <span> — {expr.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
