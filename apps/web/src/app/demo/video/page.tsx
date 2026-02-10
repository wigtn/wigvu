"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sun,
  Moon,
  Play,
  Pause,
  Scroll,
  Languages,
  Sparkles,
  Clock,
  Star,
  Tag,
} from "lucide-react";

type DisplayMode = "both" | "original" | "translated";

// Mock data
const mockVideo = {
  title: "How AI is Transforming the Future of Work",
  channel: "TED",
  duration: "12:34",
  totalSeconds: 754, // 12:34 in seconds
  thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
};

const mockAnalysis = {
  summary:
    "이 영상은 AI가 업무 환경을 어떻게 변화시키고 있는지 설명합니다. 자동화, 생산성 향상, 그리고 새로운 직업의 등장에 대해 다루며, AI와 인간의 협업이 미래의 핵심이 될 것이라고 강조합니다.",
  watchScore: 85,
  keywords: ["AI", "자동화", "미래 직업", "생산성", "협업"],
  keyMoments: [
    { time: "00:00", seconds: 0, title: "인트로", description: "AI 혁명의 시작" },
    { time: "02:15", seconds: 135, title: "자동화의 영향", description: "반복 업무의 자동화가 가져온 변화" },
    { time: "05:30", seconds: 330, title: "새로운 기회", description: "AI로 인해 새롭게 등장하는 직업군" },
    { time: "08:45", seconds: 525, title: "협업의 중요성", description: "인간과 AI의 시너지 효과" },
    { time: "11:00", seconds: 660, title: "결론", description: "미래를 위한 준비 방법" },
  ],
};

const mockSegments = [
  {
    start: 0,
    originalText: "Welcome to this exploration of how artificial intelligence is reshaping our work.",
    translatedText: "인공지능이 우리의 업무를 어떻게 재편하고 있는지 탐구하는 시간에 오신 것을 환영합니다.",
  },
  {
    start: 5,
    originalText: "The changes we're seeing today are just the beginning.",
    translatedText: "오늘날 우리가 목격하고 있는 변화는 단지 시작에 불과합니다.",
  },
  {
    start: 10,
    originalText: "AI is automating routine tasks, freeing humans for more creative work.",
    translatedText: "AI는 반복적인 작업을 자동화하여 인간이 더 창의적인 일에 집중할 수 있게 합니다.",
  },
  {
    start: 18,
    originalText: "But this transformation also brings challenges we must address.",
    translatedText: "하지만 이 변화는 우리가 해결해야 할 도전과제도 가져옵니다.",
  },
  {
    start: 24,
    originalText: "The key is to embrace AI as a partner, not a replacement.",
    translatedText: "핵심은 AI를 대체자가 아닌 파트너로 받아들이는 것입니다.",
  },
];

export default function VideoDemoPage() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("both");
  const [isDark, setIsDark] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegment, setActiveSegment] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hoveredMoment, setHoveredMoment] = useState<number | null>(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="swiss-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/" className="btn-ghost p-2">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <span className="text-lg font-bold">WIGVU</span>
            </div>

            <button
              onClick={toggleTheme}
              className="btn-ghost p-2"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="swiss-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video & Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player Placeholder */}
            <div className="relative aspect-video bg-[var(--muted)] rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1 bg-white/30 rounded-full">
                    <div className="w-1/3 h-full bg-[var(--accent)] rounded-full" />
                  </div>
                  <span className="text-white text-sm">{mockVideo.duration}</span>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">
                {mockVideo.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)]">
                <span>{mockVideo.channel}</span>
                <span>·</span>
                <span>{mockVideo.duration}</span>
              </div>
            </div>

            {/* Key Moments - Mobile: Cards, Desktop: Timeline Bar */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-medium">핵심 구간</span>
              </div>

              {/* Mobile: Card View */}
              <div className="md:hidden horizontal-scroll pb-2">
                {mockAnalysis.keyMoments.map((moment, index) => (
                  <button
                    key={index}
                    className="expression-card min-w-[160px]"
                  >
                    <div className="text-xs text-[var(--accent)] font-mono mb-1">
                      {moment.time}
                    </div>
                    <div className="text-sm font-medium mb-1">{moment.title}</div>
                    <div className="text-xs text-[var(--foreground-secondary)]">
                      {moment.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop: Timeline Bar with Dots */}
              <div className="hidden md:block">
                <div className="relative h-16 bg-[var(--muted)] rounded-lg px-4">
                  {/* Timeline Track */}
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-[var(--border)] rounded-full -translate-y-1/2">
                    <div className="w-1/3 h-full bg-[var(--accent)] rounded-full" />
                  </div>

                  {/* Moment Dots */}
                  {mockAnalysis.keyMoments.map((moment, index) => {
                    const position = (moment.seconds / mockVideo.totalSeconds) * 100;
                    const isHovered = hoveredMoment === index;

                    return (
                      <div
                        key={index}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                        style={{ left: `calc(${position}% + 16px - ${position * 0.32}px)` }}
                        onMouseEnter={() => setHoveredMoment(index)}
                        onMouseLeave={() => setHoveredMoment(null)}
                      >
                        {/* Dot */}
                        <div
                          className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                            isHovered
                              ? "bg-[var(--accent)] scale-150"
                              : "bg-[var(--foreground)] hover:bg-[var(--accent)]"
                          }`}
                        />

                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-10 animate-fade-in">
                            <div className="swiss-popover min-w-[200px] text-center">
                              <div className="text-xs font-mono text-[var(--accent)] mb-1">
                                {moment.time}
                              </div>
                              <div className="text-sm font-medium mb-1">
                                {moment.title}
                              </div>
                              <div className="text-xs text-[var(--foreground-secondary)]">
                                {moment.description}
                              </div>
                            </div>
                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--card)]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Time Labels */}
                <div className="flex justify-between mt-2 text-xs text-[var(--foreground-tertiary)] px-1">
                  <span>00:00</span>
                  <span>{mockVideo.duration}</span>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="swiss-card">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-medium">AI 분석</span>
              </div>

              {/* Watch Score */}
              <div className="flex items-center gap-4 mb-4 p-3 bg-[var(--muted)] rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{mockAnalysis.watchScore}</span>
                  <span className="text-sm text-[var(--foreground-secondary)]">/ 100</span>
                </div>
                <div className="text-sm text-[var(--foreground-secondary)]">
                  시청 추천 점수
                </div>
              </div>

              {/* Summary */}
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">요약</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  {mockAnalysis.summary}
                </p>
              </div>

              {/* Keywords */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">키워드</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockAnalysis.keywords.map((keyword, index) => (
                    <span key={index} className="swiss-badge">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Script */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 swiss-card p-0 overflow-hidden">
              {/* Script Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-[var(--foreground-secondary)]" />
                  <span className="text-sm font-medium">번역 스크립트</span>
                  <span className="text-xs text-[var(--foreground-tertiary)]">
                    {mockSegments.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Display Mode */}
                  <div className="swiss-tabs text-xs p-0.5">
                    <button
                      onClick={() => setDisplayMode("both")}
                      className={`swiss-tab py-1 px-2 text-xs ${displayMode === "both" ? "active" : ""}`}
                    >
                      양쪽
                    </button>
                    <button
                      onClick={() => setDisplayMode("original")}
                      className={`swiss-tab py-1 px-2 text-xs ${displayMode === "original" ? "active" : ""}`}
                    >
                      원문
                    </button>
                    <button
                      onClick={() => setDisplayMode("translated")}
                      className={`swiss-tab py-1 px-2 text-xs ${displayMode === "translated" ? "active" : ""}`}
                    >
                      번역
                    </button>
                  </div>

                  {/* Auto Scroll */}
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`p-1.5 rounded-md transition-all ${
                      autoScroll
                        ? "bg-[var(--foreground)] text-[var(--background)]"
                        : "bg-[var(--muted)] text-[var(--foreground-secondary)]"
                    }`}
                    title={autoScroll ? "자동 스크롤 켜짐" : "자동 스크롤 꺼짐"}
                  >
                    <Scroll className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Script Content */}
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {mockSegments.map((segment, index) => {
                  const isActive = index === activeSegment;

                  return (
                    <button
                      key={index}
                      onClick={() => setActiveSegment(index)}
                      className={`w-full text-left flex gap-3 px-4 py-3 transition-all border-l-2 ${
                        isActive
                          ? "bg-[var(--accent)]/10 border-l-[var(--accent)]"
                          : "border-l-transparent hover:bg-[var(--muted)]"
                      }`}
                    >
                      <span
                        className={`text-xs font-mono shrink-0 pt-0.5 ${
                          isActive ? "text-[var(--accent)]" : "text-[var(--foreground-tertiary)]"
                        }`}
                      >
                        {formatTime(segment.start)}
                      </span>

                      <div className="flex flex-col gap-1 flex-1">
                        {displayMode === "both" ? (
                          <>
                            <span
                              className={`text-sm leading-relaxed ${
                                isActive ? "font-medium" : "text-[var(--foreground-secondary)]"
                              }`}
                            >
                              {segment.translatedText}
                            </span>
                            <span className="text-xs text-[var(--foreground-tertiary)]">
                              {segment.originalText}
                            </span>
                          </>
                        ) : displayMode === "original" ? (
                          <span
                            className={`text-sm leading-relaxed ${
                              isActive ? "font-medium" : "text-[var(--foreground-secondary)]"
                            }`}
                          >
                            {segment.originalText}
                          </span>
                        ) : (
                          <span
                            className={`text-sm leading-relaxed ${
                              isActive ? "font-medium" : "text-[var(--foreground-secondary)]"
                            }`}
                          >
                            {segment.translatedText}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Script Footer */}
              <div className="px-4 py-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-xs text-[var(--foreground-tertiary)]">
                  <span>
                    {activeSegment + 1} / {mockSegments.length}
                  </span>
                  <div className="w-24 h-1 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{
                        width: `${((activeSegment + 1) / mockSegments.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--foreground-tertiary)] mb-4">
            이것은 WIGVU 영상 분석 뷰의 디자인 목업입니다.
          </p>
          <Link href="/" className="btn-secondary">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
