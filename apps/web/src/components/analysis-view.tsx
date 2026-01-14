"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { VideoAnalysis } from "@/types/analysis";
import { formatDuration, formatViewCount } from "@/lib/youtube";
import { useVideoSync } from "@/hooks/use-video-sync";
import { ScriptPanel } from "@/components/script-panel";
import { KeyMomentsBar } from "@/components/key-moments-bar";
import { UrlInput } from "@/components/url-input";
import {
  Clock,
  Eye,
  RotateCcw,
  ThumbsUp,
  AlertCircle,
} from "lucide-react";

// YouTube Player types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: {
            autoplay?: number;
            start?: number;
            rel?: number;
            modestbranding?: number;
          };
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

interface AnalysisViewProps {
  analysis: VideoAnalysis;
  onReset: () => void;
  onNewAnalyze: (url: string) => void;
  isLoading: boolean;
}

export function AnalysisView({
  analysis,
  onReset,
  onNewAnalyze,
  isLoading,
}: AnalysisViewProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerId = `youtube-player-${analysis.videoId}`;

  const {
    activeSegmentIndex,
    seekTo,
    setPlayer,
    autoScrollEnabled,
    toggleAutoScroll,
  } = useVideoSync(analysis.transcriptSegments);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadPlayer = () => {
      if (!containerRef.current) return;

      let playerDiv = document.getElementById(playerId);
      if (!playerDiv) {
        playerDiv = document.createElement("div");
        playerDiv.id = playerId;
        containerRef.current.appendChild(playerDiv);
      }

      const player = new window.YT.Player(playerId, {
        videoId: analysis.videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            setIsPlayerReady(true);
            playerRef.current = player;
            setPlayer(player);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = loadPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis.videoId]); // setPlayer 제거 - player 재생성 방지

  const handleSegmentClick = useCallback(
    (seconds: number) => {
      seekTo(seconds);
    },
    [seekTo]
  );

  const hasSegments =
    analysis.transcriptSegments && analysis.transcriptSegments.length > 0;

  const scoreLabel =
    analysis.watchScore >= 8
      ? "강력 추천"
      : analysis.watchScore >= 6
      ? "추천"
      : analysis.watchScore >= 4
      ? "보통"
      : "비추천";

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Header - URL Input & Meta */}
      <header className="flex-shrink-0 border-b border-border bg-[var(--background-elevated)]">
        <div className="flex items-center gap-4 px-4 py-2">
          {/* Logo */}
          <button
            onClick={onReset}
            className="text-lg font-bold tracking-tight text-accent hover:opacity-80 transition-opacity"
          >
            QuickPreview
          </button>

          {/* URL Input */}
          <div className="flex-1 max-w-xl">
            <UrlInput onAnalyze={onNewAnalyze} isLoading={isLoading} compact />
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatViewCount(analysis.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(analysis.duration)}
            </span>
            <span className="flex items-center gap-1.5 text-accent">
              <ThumbsUp className="w-3.5 h-3.5" />
              {formatViewCount(analysis.likeCount)}
            </span>
          </div>

          {/* Reset Button */}
          <button onClick={onReset} className="btn-ghost p-2" title="새 분석">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content - Video + Transcript */}
      {/* 데스크탑: 가로 레이아웃 / 모바일: 세로 레이아웃 */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-auto lg:overflow-hidden">
        {/* Left: Video Player & Info */}
        <div className="shrink-0 lg:flex-1 flex flex-col min-w-0 p-4 gap-3">
          {/* Video Player */}
          <div className="aspect-video lg:flex-1 lg:aspect-auto min-h-0">
            <div
              ref={containerRef}
              className="w-full h-full bg-black rounded-md overflow-hidden [&>iframe]:w-full [&>iframe]:h-full"
            >
              {!isPlayerReady && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    플레이어 로딩 중...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Video Info Bar */}
          <div className="shrink-0 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold leading-tight truncate">
                {analysis.title}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {analysis.channelName}
              </p>
            </div>

            {/* Mobile Stats */}
            <div className="flex lg:hidden items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {formatViewCount(analysis.viewCount)}
              </span>
              <span className="flex items-center gap-1 text-accent">
                <ThumbsUp className="w-3 h-3" />
                {formatViewCount(analysis.likeCount)}
              </span>
            </div>
          </div>
        </div>

        {/* 모바일: 핵심장면 (영상 바로 아래) */}
        <div className="lg:hidden shrink-0 border-t border-border bg-(--background-elevated)">
          <KeyMomentsBar
            highlights={analysis.highlights}
            keywords={analysis.keywords}
            watchScore={analysis.watchScore}
            scoreLabel={scoreLabel}
            onMomentClick={handleSegmentClick}
          />
        </div>

        {/* Right: Script Panel - 모바일에서는 아래에, 데스크탑에서는 오른쪽에 */}
        <div className="flex-1 lg:flex-none lg:w-80 xl:w-95 border-t lg:border-t-0 lg:border-l border-border min-h-64 lg:min-h-0">
          {hasSegments ? (
            <ScriptPanel
              segments={analysis.transcriptSegments!}
              activeIndex={activeSegmentIndex}
              onSegmentClick={handleSegmentClick}
              autoScrollEnabled={autoScrollEnabled}
              onToggleAutoScroll={toggleAutoScroll}
              isKorean={analysis.isKorean}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-(--background-elevated)">
              <div className="text-center text-muted-foreground p-4">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">자막을 사용할 수 없습니다</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer - Key Moments & Keywords (데스크탑만) */}
      <footer className="hidden lg:block shrink-0 border-t border-border bg-(--background-elevated)">
        <KeyMomentsBar
          highlights={analysis.highlights}
          keywords={analysis.keywords}
          watchScore={analysis.watchScore}
          scoreLabel={scoreLabel}
          onMomentClick={handleSegmentClick}
        />
      </footer>
    </div>
  );
}
