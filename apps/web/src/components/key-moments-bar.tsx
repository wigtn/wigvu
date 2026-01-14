"use client";

import { Highlight } from "@/types/analysis";
import { formatDuration } from "@/lib/youtube";
import { Play, Hash } from "lucide-react";

interface KeyMomentsBarProps {
  highlights: Highlight[];
  keywords: string[];
  watchScore: number;
  scoreLabel: string;
  onMomentClick: (seconds: number) => void;
}

export function KeyMomentsBar({
  highlights,
  keywords,
  onMomentClick,
}: KeyMomentsBarProps) {
  return (
    <div className="px-4 py-3">
      {/* 모바일: 세로 레이아웃 (키워드 위, 핵심장면 아래) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {/* 모바일 키워드 - 작게 한 줄로 */}
        {keywords.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <Hash className="w-3 h-3 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5">
              {keywords.slice(0, 4).map((keyword, index) => (
                <span key={index} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground whitespace-nowrap">
                  {keyword}
                </span>
              ))}
              {keywords.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{keywords.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 모바일 핵심장면 */}
        {highlights && highlights.length > 0 && (
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">핵심 장면</span>
            </div>
            <div className="horizontal-scroll stagger-children">
              {highlights.map((highlight, index) => (
                <button
                  key={index}
                  onClick={() => onMomentClick(highlight.timestamp)}
                  className="key-moment-card text-left"
                >
                  <div className="text-xs font-mono text-accent mb-1">
                    {formatDuration(highlight.timestamp)}
                  </div>
                  <div className="text-sm font-medium leading-tight line-clamp-2">
                    {highlight.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 데스크탑: 가로 레이아웃 */}
      <div className="hidden lg:flex items-center gap-6">
        {/* Watch Score Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Play className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">핵심장면</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border shrink-0" />

        {/* Key Moments - Horizontal Scroll */}
        {highlights && highlights.length > 0 && (
          <div className="flex-1 min-w-0">
            <div className="horizontal-scroll stagger-children">
              {highlights.map((highlight, index) => (
                <button
                  key={index}
                  onClick={() => onMomentClick(highlight.timestamp)}
                  className="key-moment-card text-left"
                >
                  <div className="text-xs font-mono text-accent mb-1">
                    {formatDuration(highlight.timestamp)}
                  </div>
                  <div className="text-sm font-medium leading-tight line-clamp-2">
                    {highlight.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {highlights && highlights.length > 0 && keywords.length > 0 && (
          <div className="w-px h-8 bg-border shrink-0" />
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="shrink-0 max-w-70">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">키워드</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {keywords.slice(0, 5).map((keyword, index) => (
                <span key={index} className="badge">
                  {keyword}
                </span>
              ))}
              {keywords.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  +{keywords.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
