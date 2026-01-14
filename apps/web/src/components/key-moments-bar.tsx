"use client";

import { Highlight } from "@/types/analysis";
import { formatDuration } from "@/lib/youtube";
import { Play, Star, Hash } from "lucide-react";

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
  watchScore,
  scoreLabel,
  onMomentClick,
}: KeyMomentsBarProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-6">
        {/* Watch Score */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-accent">
            <Play className="w-3 h-3 text-muted-foreground" />
            {/* <Star className="w-4 h-4 fill-current" /> */}
            {/* <span className="text-lg font-bold">{watchScore}</span>
            <span className="text-xs text-muted-foreground">/10</span> */}
          </div>
          <span className="text-xs text-muted-foreground">핵심장면</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-border flex-shrink-0" />

        {/* Key Moments - Horizontal Scroll */}
        {highlights && highlights.length > 0 && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
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

        {/* Divider */}
        {highlights && highlights.length > 0 && keywords.length > 0 && (
          <div className="w-px h-8 bg-border flex-shrink-0" />
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="flex-shrink-0 max-w-[280px]">
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
