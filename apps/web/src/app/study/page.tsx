"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStudyAnalysis } from "@/features/study/hooks/use-study-analysis";
import { ViewModeToggle, type ViewMode } from "@/features/study/components/view-mode-toggle";
import { SentenceView } from "@/features/study/components/sentence-view";
import { ExpressionCard } from "@/features/study/components/expression-card";
import { ExpressionSummary } from "@/features/study/components/expression-summary";

function StudyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, result, error, analyze } = useStudyAnalysis();
  const [viewMode, setViewMode] = useState<ViewMode>("interleaved");
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    const urlParam = searchParams.get("url");
    const storedText = sessionStorage.getItem("studyText");

    const lang = localStorage.getItem("selectedLanguage") || "en";

    if (urlParam) {
      setTitle(decodeURIComponent(urlParam));
      // URL mode: send URL as text, backend will handle scraping
      analyze(decodeURIComponent(urlParam), lang, "URL 글");
    } else if (storedText) {
      setTitle(storedText.slice(0, 50) + (storedText.length > 50 ? "..." : ""));
      analyze(storedText, lang, undefined);
      sessionStorage.removeItem("studyText");
    } else {
      router.push("/");
    }
  }, [searchParams, analyze, router]);

  // Listen for language changes
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const lang = (e as CustomEvent).detail;
      if (result) {
        // Re-analyze with new language
        const urlParam = searchParams.get("url");
        const text = urlParam ? decodeURIComponent(urlParam) : "";
        if (text) analyze(text, lang);
      }
    };
    window.addEventListener("languageChange", handleLangChange);
    return () => window.removeEventListener("languageChange", handleLangChange);
  }, [result, searchParams, analyze]);

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft size={16} />
          New Text
        </button>
      </div>

      {title && (
        <h2 className="text-lg font-semibold mb-4 line-clamp-2">{title}</h2>
      )}

      {/* View mode toggle */}
      {result && (
        <div className="mb-6">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)]">
            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            Analyzing...
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 skeleton-shimmer rounded w-full" />
              <div className="h-5 skeleton-shimmer rounded w-3/4" />
              <div className="h-4 skeleton-shimmer rounded w-5/6 ml-4 mt-1" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 space-y-4">
          <p className="text-[var(--destructive)] text-sm">{error.message}</p>
          <button
            onClick={() => router.push("/")}
            className="btn-ghost text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-0 animate-fade-in">
          {/* Sentences */}
          <SentenceView sentences={result.sentences} viewMode={viewMode} />

          {/* Expressions */}
          {result.expressions.length > 0 && (
            <div className="mt-10 pt-8 border-t border-[var(--border)]">
              <h3 className="text-base font-semibold mb-4">
                Key Expressions ({result.expressions.length})
              </h3>
              <div className="space-y-3">
                {result.expressions.map((expr, i) => (
                  <ExpressionCard key={i} expression={expr} />
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {result.expressions.length > 0 && (
            <div className="mt-10 pt-8 border-t border-[var(--border)]">
              <ExpressionSummary expressions={result.expressions} />
              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push("/")}
                  className="btn-primary px-6 py-2.5"
                >
                  Study New Text →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6">
          <div className="h-5 skeleton-shimmer rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-5 skeleton-shimmer rounded" />
            ))}
          </div>
        </div>
      }
    >
      <StudyContent />
    </Suspense>
  );
}
