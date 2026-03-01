"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { WordLookupResult } from "@/features/article/types/article";
import { lookupWord } from "@/shared/lib/api/article-api";
import { Loader2, X, Volume2 } from "lucide-react";

interface SelectionPopoverProps {
  word: string;
  sentence: string;
  rect: DOMRect;
  onClose: () => void;
}

export function SelectionPopover({
  word,
  sentence,
  rect,
  onClose,
}: SelectionPopoverProps) {
  const [result, setResult] = useState<WordLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch word lookup
  useEffect(() => {
    let cancelled = false;

    async function lookup() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await lookupWord(word, sentence) as { success?: boolean; data?: WordLookupResult; error?: { message?: string } };

        if (cancelled) return;

        if (data.success && data.data) {
          setResult(data.data);
        } else {
          setError(data.error?.message || "Lookup failed");
        }
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    lookup();
    return () => {
      cancelled = true;
    };
  }, [word, sentence]);

  // Close on click outside
  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Position popover
  const top = rect.bottom + window.scrollY + 8;
  const left = Math.max(
    16,
    Math.min(
      rect.left + rect.width / 2 - 160,
      window.innerWidth - 336,
    ),
  );

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[320px] bg-[var(--surface)] border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ top, left }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {word}
          </span>
          {result?.pronunciation && (
            <span className="text-xs text-muted-foreground">
              {result.pronunciation}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-[300px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Looking up...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 py-2">{error}</p>
        ) : result ? (
          <div className="space-y-3">
            {/* Meanings */}
            <div className="space-y-1">
              {result.meanings.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5 uppercase">
                    {m.partOfSpeech}
                  </span>
                  <span className="text-sm text-foreground">
                    {m.definition}
                  </span>
                </div>
              ))}
            </div>

            {/* Context meaning */}
            {result.contextMeaning && (
              <div className="pt-2 border-t border-border/30">
                <span className="text-[10px] font-medium text-accent uppercase tracking-wider">
                  In this sentence
                </span>
                <p className="text-sm text-foreground mt-0.5">
                  {result.contextMeaning}
                </p>
              </div>
            )}

            {/* Examples */}
            {result.examples.length > 0 && (
              <div className="pt-2 border-t border-border/30">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Examples
                </span>
                <div className="mt-1 space-y-1">
                  {result.examples.map((ex, i) => (
                    <p
                      key={i}
                      className="text-xs text-muted-foreground italic"
                    >
                      {ex}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
