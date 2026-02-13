"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type {
  ArticleSentence,
  ArticleDisplayMode,
  SentenceParseResult,
} from "@/features/article/types/article";
import { cn } from "@/shared/lib/utils";
import { Languages, Search } from "lucide-react";
import { SentenceParser } from "./sentence-parser";
import { SelectionPopover } from "./selection-popover";

interface ArticlePanelProps {
  sentences: ArticleSentence[];
  displayMode: ArticleDisplayMode;
  onDisplayModeChange: (mode: ArticleDisplayMode) => void;
  highlightSentenceId?: number | null;
}

export function ArticlePanel({
  sentences,
  displayMode,
  onDisplayModeChange,
  highlightSentenceId,
}: ArticlePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentenceRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [expandedParserId, setExpandedParserId] = useState<number | null>(null);
  const [parseResults, setParseResults] = useState<
    Map<number, SentenceParseResult>
  >(new Map());
  const [parsingIds, setParsingIds] = useState<Set<number>>(new Set());

  // Selection popover state
  const [selection, setSelection] = useState<{
    text: string;
    sentence: string;
    rect: DOMRect;
  } | null>(null);

  // Scroll to highlighted sentence
  useEffect(() => {
    if (highlightSentenceId != null) {
      const el = sentenceRefs.current.get(highlightSentenceId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightSentenceId]);

  // Handle sentence structure parse
  const handleParse = useCallback(
    async (sentenceId: number) => {
      if (expandedParserId === sentenceId) {
        setExpandedParserId(null);
        return;
      }

      if (parseResults.has(sentenceId)) {
        setExpandedParserId(sentenceId);
        return;
      }

      setExpandedParserId(sentenceId);
      setParsingIds((prev) => new Set(prev).add(sentenceId));

      try {
        const sentence = sentences.find((s) => s.id === sentenceId);
        if (!sentence) return;

        const response = await fetch("/api/article/parse-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sentence: sentence.original,
            context: sentences
              .filter(
                (s) =>
                  s.id >= sentenceId - 1 && s.id <= sentenceId + 1,
              )
              .map((s) => s.original)
              .join(" "),
          }),
        });

        const result = await response.json();
        if (result.success && result.data) {
          setParseResults((prev) =>
            new Map(prev).set(sentenceId, result.data),
          );
        }
      } catch {
        // silent fail
      } finally {
        setParsingIds((prev) => {
          const next = new Set(prev);
          next.delete(sentenceId);
          return next;
        });
      }
    },
    [expandedParserId, parseResults, sentences],
  );

  // Handle text selection for popover
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length > 200 || text.length < 1) {
      setSelection(null);
      return;
    }

    // Find which sentence contains the selection
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const sentenceEl = (
      container instanceof Element ? container : container.parentElement
    )?.closest("[data-sentence-id]");

    if (!sentenceEl) {
      setSelection(null);
      return;
    }

    const sentenceId = Number(sentenceEl.getAttribute("data-sentence-id"));
    const sentence = sentences.find((s) => s.id === sentenceId);
    if (!sentence) {
      setSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    setSelection({ text, sentence: sentence.original, rect });
  }, [sentences]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Translated Script</span>
          <span className="text-xs text-muted-foreground">
            {sentences.length}
          </span>
        </div>

        {/* Display mode toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          {(
            [
              { mode: "both" as const, label: "Both" },
              { mode: "original" as const, label: "Original" },
              { mode: "translated" as const, label: "Translation" },
            ] as const
          ).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => onDisplayModeChange(mode)}
              className={cn(
                "px-2 py-1 text-xs rounded transition-all",
                displayMode === mode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sentences */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        onMouseUp={handleMouseUp}
      >
        {sentences.map((sentence) => {
          const isHighlighted = highlightSentenceId === sentence.id;
          const isParserExpanded = expandedParserId === sentence.id;
          const isParsing = parsingIds.has(sentence.id);
          const parseResult = parseResults.get(sentence.id);

          return (
            <div
              key={sentence.id}
              ref={(el) => {
                if (el) sentenceRefs.current.set(sentence.id, el);
              }}
              data-sentence-id={sentence.id}
              className={cn(
                "px-4 py-3 border-b border-border/50 transition-all",
                isHighlighted && "bg-accent/10",
              )}
            >
              <div className="flex gap-3">
                {/* Sentence number */}
                <span className="text-xs font-mono text-muted-foreground shrink-0 pt-1 w-6 text-right">
                  {sentence.id + 1}
                </span>

                {/* Text content */}
                <div className="flex-1 space-y-1">
                  {(displayMode === "both" ||
                    displayMode === "original") && (
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        displayMode === "both"
                          ? "text-foreground"
                          : "text-foreground/90",
                      )}
                    >
                      {sentence.original}
                    </p>
                  )}
                  {(displayMode === "both" ||
                    displayMode === "translated") && (
                    <p
                      className={cn(
                        "text-sm leading-relaxed",
                        displayMode === "both"
                          ? "text-muted-foreground"
                          : "text-foreground/90",
                      )}
                    >
                      {sentence.translated}
                    </p>
                  )}
                </div>

                {/* Parse button */}
                <button
                  onClick={() => handleParse(sentence.id)}
                  className={cn(
                    "shrink-0 p-1.5 rounded-md transition-all",
                    isParserExpanded
                      ? "bg-accent text-background"
                      : "text-muted-foreground/40 hover:text-accent hover:bg-accent/10",
                  )}
                  title="Parse structure"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sentence parser result */}
              {isParserExpanded && (
                <div className="mt-3 ml-9">
                  <SentenceParser
                    result={parseResult || null}
                    isLoading={isParsing}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selection popover */}
      {selection && (
        <SelectionPopover
          word={selection.text}
          sentence={selection.sentence}
          rect={selection.rect}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
