"use client";

import { useEffect, useRef, useState } from "react";
import { TranscriptSegment } from "@/features/video/types/analysis";
import { Languages, Scroll } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type DisplayMode = "both" | "original" | "translated";

interface ScriptPanelProps {
  segments: TranscriptSegment[];
  activeIndex: number;
  onSegmentClick: (seconds: number) => void;
  autoScrollEnabled: boolean;
  onToggleAutoScroll: () => void;
  isKorean?: boolean;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ScriptPanel({
  segments,
  activeIndex,
  onSegmentClick,
  autoScrollEnabled,
  onToggleAutoScroll,
  isKorean = false,
}: ScriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("both");

  // 자동 스크롤
  useEffect(() => {
    if (autoScrollEnabled && activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;

      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      const scrollTop =
        active.offsetTop - container.offsetTop - containerRect.height / 2 + activeRect.height / 2;

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "smooth",
      });
    }
  }, [activeIndex, autoScrollEnabled]);

  const hasTranslation = segments.some(
    (seg) => seg.originalText && seg.translatedText && seg.originalText !== seg.translatedText
  );

  return (
    <div className="flex flex-col h-full bg-(--background-elevated)">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {isKorean ? "Subtitles" : "Translated Script"}
          </span>
          <span className="text-xs text-muted-foreground">
            {segments.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* 표시 모드 토글 - 원본/번역, 원문만, 번역본만 */}
          {hasTranslation && !isKorean && (
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              <button
                onClick={() => setDisplayMode("both")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-all",
                  displayMode === "both"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Show both original and translation"
              >
                Both
              </button>
              <button
                onClick={() => setDisplayMode("original")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-all",
                  displayMode === "original"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Show original only"
              >
                Original
              </button>
              <button
                onClick={() => setDisplayMode("translated")}
                className={cn(
                  "px-2 py-1 text-xs rounded transition-all",
                  displayMode === "translated"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Show translation only"
              >
                Translation
              </button>
            </div>
          )}

          {/* 자동 스크롤 토글 */}
          <button
            onClick={onToggleAutoScroll}
            className={cn(
              "p-1.5 rounded-md transition-all",
              autoScrollEnabled
                ? "bg-foreground text-background"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
            title={autoScrollEnabled ? "Auto-scroll on" : "Auto-scroll off"}
          >
            <Scroll className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Segments List - 고정 높이, 자동 스크롤 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {segments.map((segment, index) => {
          const isActive = index === activeIndex;
          const originalText = segment.originalText || segment.text;
          const translatedText = segment.translatedText || segment.text;
          const showBothTexts = hasTranslation && !isKorean && originalText !== translatedText;

          return (
            <button
              key={index}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSegmentClick(segment.start)}
              className={cn(
                "w-full text-left flex gap-3 px-4 py-3 transition-all border-l-2",
                isActive
                  ? "bg-accent/10 border-l-accent"
                  : "border-l-transparent hover:bg-(--background-hover)"
              )}
            >
              {/* Timestamp - 활성화 시 파란색 */}
              <span
                className={cn(
                  "text-xs font-mono shrink-0 pt-0.5",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                {formatTimestamp(segment.start)}
              </span>

              {/* Text - 표시 모드에 따라 다르게 */}
              <div className="flex flex-col gap-1 flex-1">
                {showBothTexts ? (
                  displayMode === "both" ? (
                    <>
                      {/* 번역본 (한국어) - 진하게 */}
                      <span
                        className={cn(
                          "text-sm leading-relaxed",
                          isActive ? "text-foreground font-medium" : "text-foreground/90"
                        )}
                      >
                        {translatedText}
                      </span>
                      {/* 원문 (영어) - 반투명 */}
                      <span
                        className={cn(
                          "text-xs leading-relaxed",
                          isActive ? "text-muted-foreground/70" : "text-muted-foreground/50"
                        )}
                      >
                        {originalText}
                      </span>
                    </>
                  ) : displayMode === "original" ? (
                    <span
                      className={cn(
                        "text-sm leading-relaxed",
                        isActive ? "text-foreground font-medium" : "text-muted-foreground"
                      )}
                    >
                      {originalText}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-sm leading-relaxed",
                        isActive ? "text-foreground font-medium" : "text-muted-foreground"
                      )}
                    >
                      {translatedText}
                    </span>
                  )
                ) : (
                  <span
                    className={cn(
                      "text-sm leading-relaxed",
                      isActive ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {isKorean ? segment.text : translatedText}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer - 진행바 */}
      {activeIndex >= 0 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {activeIndex + 1} / {segments.length}
            </span>
            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${((activeIndex + 1) / segments.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
