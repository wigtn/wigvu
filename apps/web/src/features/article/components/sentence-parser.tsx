"use client";

import type { SentenceParseResult } from "@/features/article/types/article";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";

interface SentenceParserProps {
  result: SentenceParseResult | null;
  isLoading: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  주어: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  동사: "bg-red-500/10 text-red-600 border-red-500/20",
  목적어: "bg-green-500/10 text-green-600 border-green-500/20",
  보어: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  부사구: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  관계사절: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  분사구문: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  전치사구: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  접속사: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  "to부정사": "bg-indigo-500/10 text-indigo-600 border-indigo-500/10",
};

const ROLE_LABELS: Record<string, string> = {
  주어: "Subject",
  동사: "Verb",
  목적어: "Object",
  보어: "Complement",
  부사구: "Adverbial",
  관계사절: "Relative Clause",
  분사구문: "Participle",
  전치사구: "Prepositional",
  접속사: "Conjunction",
  "to부정사": "Infinitive",
};

export function SentenceParser({ result, isLoading }: SentenceParserProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Parsing structure...</span>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      {/* Components */}
      <div className="space-y-1.5">
        {result.components
          .filter((c) => c.parentId == null)
          .map((component) => (
            <div key={component.id} className="flex items-start gap-2">
              <span
                className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                  ROLE_COLORS[component.role] ||
                  "bg-gray-500/10 text-gray-600 border-gray-500/20"
                }`}
              >
                {ROLE_LABELS[component.role] || component.role}
              </span>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">
                  {component.text}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {component.explanation}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Reading order */}
      {result.readingOrder && (
        <div className="flex items-start gap-2 pt-2 border-t border-border/30">
          <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Reading Order
            </span>
            <p className="text-sm text-foreground mt-0.5">
              {result.readingOrder}
            </p>
          </div>
        </div>
      )}

      {/* Grammar points */}
      {result.grammarPoints.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          {result.grammarPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-medium text-accent">
                  {point.type}
                </span>
                <p className="text-xs text-muted-foreground">
                  {point.explanation}
                </p>
                <p className="text-xs text-foreground/60 italic mt-0.5">
                  &quot;{point.highlight}&quot;
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
