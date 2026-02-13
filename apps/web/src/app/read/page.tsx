"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Newspaper } from "lucide-react";
import { useArticleAnalysis } from "@/features/article/hooks/use-article-analysis";
import { ArticlePanel } from "@/features/article/components/article-panel";
import { ExpressionBar } from "@/features/article/components/expression-bar";
import type { ArticleDisplayMode } from "@/features/article/types/article";

export default function ReadPage() {
  const router = useRouter();
  const {
    steps,
    isLoading,
    isComplete,
    error,
    result,
    startAnalysis,
    reset,
  } = useArticleAnalysis();

  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [urlValue, setUrlValue] = useState("");
  const [textValue, setTextValue] = useState("");
  const [displayMode, setDisplayMode] = useState<ArticleDisplayMode>("both");
  const [highlightSentenceId, setHighlightSentenceId] = useState<
    number | null
  >(null);

  const handleSubmit = () => {
    if (inputMode === "url" && urlValue.trim()) {
      startAnalysis({ url: urlValue.trim() });
    } else if (inputMode === "text" && textValue.trim()) {
      startAnalysis({ text: textValue.trim() });
    }
  };

  const handleReset = () => {
    reset();
    setUrlValue("");
    setTextValue("");
    setHighlightSentenceId(null);
  };

  // Input view
  if (!isLoading && !result && !error) {
    return (
      <div
        className="flex flex-col items-center px-4 sm:px-6"
        style={{ paddingTop: "15vh" }}
      >
        <div className="w-full max-w-[640px] text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Learn by Reading Articles
            </h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Paste a URL or enter text and AI will translate sentence by sentence and extract expressions
            </p>
          </div>

          {/* Input mode toggle */}
          <div className="flex items-center justify-center gap-1 bg-muted rounded-lg p-1 w-fit mx-auto">
            <button
              onClick={() => setInputMode("url")}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                inputMode === "url"
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              URL
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                inputMode === "text"
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Text
            </button>
          </div>

          {/* Input */}
          <div className="space-y-3">
            {inputMode === "url" ? (
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="https://bbc.com/news/article..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted-foreground/50"
              />
            ) : (
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Paste English text here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-border bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-muted-foreground/50 resize-none"
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={
                inputMode === "url"
                  ? !urlValue.trim()
                  : !textValue.trim()
              }
              className="w-full py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Start Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading view
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.step}
                className="flex items-center gap-3 text-sm"
              >
                {step.status === "active" ? (
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                ) : step.status === "done" ? (
                  <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border" />
                )}
                <span
                  className={
                    step.status === "active"
                      ? "text-foreground"
                      : step.status === "done"
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                  }
                >
                  {step.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error view
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Analysis Failed
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-6 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Result view
  if (result) {
    return (
      <div className="flex flex-col h-full">
        {/* Article header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {result.article.source && (
                  <span className="flex items-center gap-1">
                    <Newspaper className="w-3 h-3" />
                    {result.article.source}
                  </span>
                )}
                {result.article.publishedDate && (
                  <>
                    <span>·</span>
                    <span>
                      {new Date(
                        result.article.publishedDate,
                      ).toLocaleDateString("en-US")}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-sm font-semibold text-foreground truncate">
                {result.article.title || "Article"}
              </h1>
            </div>
          </div>
        </div>

        {/* Expression bar */}
        <ExpressionBar
          expressions={result.expressions}
          onExpressionClick={(id) => setHighlightSentenceId(id)}
        />

        {/* Article panel */}
        <div className="flex-1 overflow-hidden">
          <ArticlePanel
            sentences={result.sentences}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            highlightSentenceId={highlightSentenceId}
          />
        </div>
      </div>
    );
  }

  return null;
}
