"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { UrlInput } from "@/components/url-input";
import { LoadingState } from "@/components/loading-state";
import { VideoAnalysis, AnalyzeResponse } from "@/types/analysis";
import { analysisStore } from "@/store/analysis-store";
import {
  RotateCcw,
  AlertCircle,
  Zap,
  Languages,
  Sparkles,
  Play,
  Hash,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

const TOTAL_SLIDES = 3;

const features = [
  {
    icon: Sparkles,
    title: "AI 요약",
    description: "영상의 핵심 내용을 한눈에 파악할 수 있는 요약본을 제공합니다",
  },
  {
    icon: Play,
    title: "핵심 장면",
    description: "중요한 부분만 골라서 바로 해당 타임스탬프로 이동합니다",
  },
  {
    icon: Languages,
    title: "실시간 자막",
    description: "영상과 동기화된 자막을 원본/번역 동시에 확인할 수 있습니다",
  },
  {
    icon: Hash,
    title: "키워드 추출",
    description: "영상의 주제를 파악할 수 있는 핵심 키워드를 보여줍니다",
  },
];

const steps = [
  { number: "1", title: "URL 붙여넣기", description: "YouTube 영상 링크 입력" },
  { number: "2", title: "AI 분석", description: "자막 추출 및 내용 분석" },
  { number: "3", title: "결과 확인", description: "요약, 핵심장면, 키워드" },
];

async function analyzeVideo(url: string): Promise<VideoAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data: AnalyzeResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || "Analysis failed");
  }

  return data.data;
}

export default function Home() {
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 페이드 전환 캐러셀: [0] [1] [2]
  const scrollToIndex = useCallback((index: number) => {
    carouselRef.current?.scrollTo({
      left: index * window.innerWidth,
      behavior: "instant",
    });
  }, []);

  // 페이드 전환 헬퍼
  const FADE_DURATION = 300; // 페이드 시간 (ms)

  const fadeToSlide = useCallback(
    (targetSlide: number) => {
      if (isTransitioning) return;
      if (targetSlide === currentSlide) return;

      setIsTransitioning(true);
      setIsFading(true);

      setTimeout(() => {
        scrollToIndex(targetSlide);
        setCurrentSlide(targetSlide);

        requestAnimationFrame(() => {
          setIsFading(false);
          setTimeout(() => {
            setIsTransitioning(false);
          }, FADE_DURATION);
        });
      }, FADE_DURATION);
    },
    [currentSlide, isTransitioning, scrollToIndex]
  );

  const goToSlide = useCallback(
    (index: number) => {
      fadeToSlide(index);
    },
    [fadeToSlide]
  );

  const nextSlide = useCallback(() => {
    const next = currentSlide === TOTAL_SLIDES - 1 ? 0 : currentSlide + 1;
    fadeToSlide(next);
  }, [currentSlide, fadeToSlide]);

  const prevSlide = useCallback(() => {
    const prev = currentSlide === 0 ? TOTAL_SLIDES - 1 : currentSlide - 1;
    fadeToSlide(prev);
  }, [currentSlide, fadeToSlide]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // 자동 슬라이드 (2초마다, 무한 루프)
  useEffect(() => {
    if (isTransitioning) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 2000);

    return () => clearInterval(timer);
  }, [isTransitioning, nextSlide]);

  // URL 입력 섹션으로 스크롤
  const scrollToInput = useCallback(() => {
    const inputSection = document.getElementById("url-input-section");
    inputSection?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const mutation = useMutation({
    mutationFn: analyzeVideo,
    onSuccess: (data: VideoAnalysis) => {
      analysisStore.set(data);
      router.push(`/analyze/${data.videoId}`);
    },
  });

  const handleAnalyze = (url: string) => {
    mutation.mutate(url);
  };

  const handleReset = () => {
    mutation.reset();
  };

  // 로딩 중 (실제 또는 테스트)
  if (mutation.isPending || testLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <LoadingState />
        {testLoading && (
          <button
            onClick={() => setTestLoading(false)}
            className="btn-ghost text-sm"
          >
            테스트 종료
          </button>
        )}
      </div>
    );
  }

  // 에러 상태
  if (mutation.isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bento-card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">분석 실패</h2>
          <p className="text-muted-foreground mb-6">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "알 수 없는 오류가 발생했습니다"}
          </p>
          <button onClick={handleReset} className="btn-primary">
            <RotateCcw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 초기 상태: 랜딩 페이지 (가로 캐러셀 + 스크롤 URL 입력)
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header - 고정 */}
      <header className="fixed top-0 left-0 right-0 shrink-0 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-bold text-lg">WIGTN</span>
          </div>
          {/* 테스트 버튼 (개발용) */}
          <button
            onClick={() => setTestLoading(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:border-accent transition-colors"
            title="로딩 테스트"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">로딩 테스트</span>
          </button>
        </div>
      </header>

      {/* 캐러셀 컨테이너 */}
      <div className="h-screen w-full shrink-0 relative pt-16 overflow-hidden">
        <div
          ref={carouselRef}
          className={`h-full flex overflow-x-hidden transition-opacity duration-200 ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* Slide 1: Hero */}
          <section className="relative w-screen h-full shrink-0 flex flex-col items-center justify-center px-4 md:px-6">
            <div className="max-w-3xl mx-auto w-full">
              {/* 타이틀 */}
              <div className="text-center mb-4 md:mb-6">
                <h1 className="text-2xl md:text-4xl font-bold mb-2">
                  YouTube 영상, 빠르게 파악하세요
                </h1>
                <p className="text-muted-foreground text-sm md:text-lg">
                  URL 하나로 AI가 핵심 내용을 분석해드립니다
                </p>
              </div>

              {/* SVG 일러스트 - URL 입력 → 분석 결과 변환 애니메이션 */}
              <svg
                viewBox="0 0 800 500"
                className="w-full max-w-3xl h-auto mx-auto hidden md:block"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <style>
                    {`
                  /*
                   * 타임라인 (10초 사이클):
                   * 0-30%: URL 입력 + 타이핑
                   * 30-35%: URL 사라짐
                   * 35-55%: 로딩 스피너
                   * 55-60%: 로딩 사라짐 + 결과 나타남
                   * 60-95%: 결과 화면 표시
                   * 95-100%: 결과 사라짐 → 리셋
                   */

                  /* 기본 플로팅 애니메이션 */
                  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
                  @keyframes floatCircle1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-5px, -10px); } }
                  @keyframes floatCircle2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(5px, -8px); } }
                  @keyframes rotate1 { 0%, 100% { transform: rotate(15deg); } 50% { transform: rotate(25deg); } }
                  @keyframes rotate2 { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(-20deg); } }

                  /* 1단계: URL 입력창 (0-30% 보임, 30-35% 사라짐) */
                  @keyframes urlShow {
                    0%, 30% { opacity: 1; }
                    35%, 100% { opacity: 0; }
                  }

                  /* 글자 타이핑 애니메이션 (10초 사이클) */
                  @keyframes charType {
                    0% { opacity: 0; }
                    0.5% { opacity: 1; }
                    30% { opacity: 1; }
                    35%, 100% { opacity: 0; }
                  }
                  .char { animation: charType 10s infinite; }
                  .char-0 { animation-delay: 0s; }
                  .char-1 { animation-delay: 0.07s; }
                  .char-2 { animation-delay: 0.14s; }
                  .char-3 { animation-delay: 0.21s; }
                  .char-4 { animation-delay: 0.28s; }
                  .char-5 { animation-delay: 0.35s; }
                  .char-6 { animation-delay: 0.42s; }
                  .char-7 { animation-delay: 0.49s; }
                  .char-8 { animation-delay: 0.56s; }
                  .char-9 { animation-delay: 0.63s; }
                  .char-10 { animation-delay: 0.70s; }
                  .char-11 { animation-delay: 0.77s; }
                  .char-12 { animation-delay: 0.84s; }
                  .char-13 { animation-delay: 0.91s; }
                  .char-14 { animation-delay: 0.98s; }
                  .char-15 { animation-delay: 1.05s; }
                  .char-16 { animation-delay: 1.12s; }
                  .char-17 { animation-delay: 1.19s; }
                  .char-18 { animation-delay: 1.26s; }
                  .char-19 { animation-delay: 1.33s; }
                  .char-20 { animation-delay: 1.40s; }
                  .char-21 { animation-delay: 1.47s; }
                  .char-22 { animation-delay: 1.54s; }
                  .char-23 { animation-delay: 1.61s; }
                  .char-24 { animation-delay: 1.68s; }
                  .char-25 { animation-delay: 1.75s; }
                  .char-26 { animation-delay: 1.82s; }
                  .char-27 { animation-delay: 1.89s; }
                  .char-28 { animation-delay: 1.96s; }
                  .char-29 { animation-delay: 2.03s; }
                  .char-30 { animation-delay: 2.10s; }
                  .char-31 { animation-delay: 2.17s; }
                  .char-32 { animation-delay: 2.24s; }
                  .char-33 { animation-delay: 2.31s; }
                  .char-34 { animation-delay: 2.38s; }
                  .char-35 { animation-delay: 2.45s; }

                  /* 커서 깜빡임 + 이동 (글자 36개 × 0.07초 = 2.52초 = 25.2%) */
                  @keyframes cursor {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                  }
                  @keyframes cursorMove {
                    0% { transform: translateX(0); }
                    25.2% { transform: translateX(295px); }
                    30%, 100% { transform: translateX(295px); }
                  }
                  /* 2단계: 로딩 스피너 (35-55% 보임) */
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes loaderShow {
                    0%, 33% { opacity: 0; }
                    38%, 52% { opacity: 1; }
                    57%, 100% { opacity: 0; }
                  }

                  /* 3단계: 결과 화면 (55%부터 나타남, 95%에 사라짐) */
                  @keyframes resultFadeIn {
                    0%, 55% { opacity: 0; transform: translateY(15px); }
                    62%, 92% { opacity: 1; transform: translateY(0); }
                    98%, 100% { opacity: 0; transform: translateY(0); }
                  }
                  @keyframes resultFadeIn2 {
                    0%, 58% { opacity: 0; transform: translateY(15px); }
                    65%, 92% { opacity: 1; transform: translateY(0); }
                    98%, 100% { opacity: 0; transform: translateY(0); }
                  }
                  @keyframes resultFadeIn3 {
                    0%, 61% { opacity: 0; transform: translateY(15px); }
                    68%, 92% { opacity: 1; transform: translateY(0); }
                    98%, 100% { opacity: 0; transform: translateY(0); }
                  }
                  @keyframes resultFadeIn4 {
                    0%, 64% { opacity: 0; transform: translateY(15px); }
                    71%, 92% { opacity: 1; transform: translateY(0); }
                    98%, 100% { opacity: 0; transform: translateY(0); }
                  }

                  /* 스크립트 라인 하이라이트 */
                  @keyframes lineHighlight {
                    0%, 62% { opacity: 0.2; }
                    70%, 80% { opacity: 0.7; }
                    90%, 100% { opacity: 0.2; }
                  }

                  .monitor-group { animation: float 4s ease-in-out infinite; }
                  .url-input-screen { animation: urlShow 10s ease-in-out infinite; }
                  .url-cursor { animation: cursor 0.5s step-end infinite, cursorMove 10s linear infinite; }
                  .loader { animation: spin 0.8s linear infinite, loaderShow 10s ease-in-out infinite; transform-origin: 400px 220px; }
                  .header-area { animation: resultFadeIn 10s ease-in-out infinite; }
                  .video-area { animation: resultFadeIn 10s ease-in-out infinite; }
                  .script-area { animation: resultFadeIn2 10s ease-in-out infinite; }
                  .title-area { animation: resultFadeIn3 10s ease-in-out infinite; }
                  .tags-area { animation: resultFadeIn4 10s ease-in-out infinite; }
                  .line1 { animation: lineHighlight 10s ease-in-out infinite 0s; }
                  .line2 { animation: lineHighlight 10s ease-in-out infinite 0.12s; }
                  .line3 { animation: lineHighlight 10s ease-in-out infinite 0.24s; }
                  .line4 { animation: lineHighlight 10s ease-in-out infinite 0.36s; }
                  .line5 { animation: lineHighlight 10s ease-in-out infinite 0.48s; }
                  .line6 { animation: lineHighlight 10s ease-in-out infinite 0.6s; }
                  .line7 { animation: lineHighlight 10s ease-in-out infinite 0.72s; }
                  .line8 { animation: lineHighlight 10s ease-in-out infinite 0.84s; }
                  .float-c1 { animation: floatCircle1 5s ease-in-out infinite; }
                  .float-c2 { animation: floatCircle2 6s ease-in-out infinite; }
                  .float-r1 { animation: rotate1 4s ease-in-out infinite; transform-origin: 70px 130px; }
                  .float-r2 { animation: rotate2 5s ease-in-out infinite; transform-origin: 738px 308px; }
                `}
                  </style>
                </defs>

                {/* 장식: 플로팅 요소들 */}
                <circle
                  className="float-c1"
                  cx="720"
                  cy="100"
                  r="30"
                  fill="var(--accent)"
                  opacity="0.15"
                />
                <circle
                  className="float-c2"
                  cx="80"
                  cy="380"
                  r="25"
                  fill="var(--accent)"
                  opacity="0.15"
                />
                <rect
                  className="float-r1"
                  x="60"
                  y="120"
                  width="20"
                  height="20"
                  rx="4"
                  fill="var(--accent)"
                  opacity="0.2"
                />
                <rect
                  className="float-r2"
                  x="730"
                  y="300"
                  width="16"
                  height="16"
                  rx="3"
                  fill="var(--accent)"
                  opacity="0.2"
                />

                {/* 모니터 그룹 - 전체 플로팅 */}
                <g className="monitor-group">
                  {/* 모니터 스탠드 */}
                  <rect
                    x="350"
                    y="420"
                    width="100"
                    height="20"
                    rx="4"
                    fill="var(--muted)"
                  />
                  <rect
                    x="320"
                    y="440"
                    width="160"
                    height="12"
                    rx="6"
                    fill="var(--muted)"
                  />

                  {/* 모니터 외곽 */}
                  <rect
                    x="100"
                    y="40"
                    width="600"
                    height="380"
                    rx="16"
                    fill="var(--card)"
                    stroke="var(--border)"
                    strokeWidth="2"
                  />

                  {/* 모니터 화면 */}
                  <rect
                    x="120"
                    y="60"
                    width="560"
                    height="340"
                    rx="8"
                    fill="var(--background)"
                  />

                  {/* URL 입력 화면 (초기 상태) */}
                  <g className="url-input-screen">
                    {/* 중앙 URL 입력바 */}
                    <rect
                      x="200"
                      y="190"
                      width="400"
                      height="50"
                      rx="25"
                      fill="var(--muted)"
                      opacity="0.3"
                    />
                    <rect
                      x="200"
                      y="190"
                      width="400"
                      height="50"
                      rx="25"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      opacity="0.5"
                    />
                    {/* URL 텍스트 (글자별 타이핑 효과) */}
                    <text
                      x="225"
                      y="222"
                      fill="var(--foreground)"
                      fontSize="14"
                      fontFamily="ui-monospace, monospace"
                    >
                      {"https://youtube.com/watch?v=abc123"
                        .split("")
                        .map((char, i) => (
                          <tspan key={i} className={`char char-${i}`}>
                            {char}
                          </tspan>
                        ))}
                    </text>
                    {/* 깜빡이는 커서 */}
                    <rect
                      className="url-cursor"
                      x="225"
                      y="207"
                      width="2"
                      height="18"
                      fill="var(--accent)"
                    />
                  </g>

                  {/* 로딩 스피너 */}
                  <circle
                    className="loader"
                    cx="400"
                    cy="220"
                    r="20"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeDasharray="80"
                    strokeDashoffset="60"
                    strokeLinecap="round"
                  />

                  {/* === 분석 결과 화면 (페이드인) === */}

                  {/* 헤더 바 */}
                  <g className="header-area">
                    <rect
                      x="120"
                      y="60"
                      width="560"
                      height="40"
                      rx="8"
                      fill="var(--background-elevated, var(--muted))"
                    />
                    <circle cx="145" cy="80" r="6" fill="var(--accent)" />
                    <rect
                      x="160"
                      y="74"
                      width="80"
                      height="12"
                      rx="2"
                      fill="var(--foreground)"
                      opacity="0.8"
                    />
                    <rect
                      x="500"
                      y="74"
                      width="160"
                      height="12"
                      rx="6"
                      fill="var(--muted)"
                    />
                  </g>

                  {/* 왼쪽: 비디오 플레이어 */}
                  <g className="video-area">
                    <rect
                      x="140"
                      y="115"
                      width="280"
                      height="160"
                      rx="8"
                      fill="var(--foreground)"
                      opacity="0.1"
                    />
                    <polygon
                      className="play-btn"
                      points="280,175 280,215 310,195"
                      fill="var(--accent)"
                    />
                  </g>

                  {/* 왼쪽: 영상 제목 */}
                  <g className="title-area">
                    <rect
                      x="140"
                      y="285"
                      width="200"
                      height="14"
                      rx="2"
                      fill="var(--foreground)"
                      opacity="0.7"
                    />
                    <rect
                      x="140"
                      y="305"
                      width="120"
                      height="10"
                      rx="2"
                      fill="var(--muted-foreground)"
                      opacity="0.5"
                    />
                  </g>

                  {/* 오른쪽: 스크립트 패널 */}
                  <g className="script-area">
                    <rect
                      x="440"
                      y="115"
                      width="220"
                      height="200"
                      rx="8"
                      fill="var(--background-elevated, var(--muted))"
                      opacity="0.5"
                    />
                    <rect
                      className="line1"
                      x="455"
                      y="130"
                      width="190"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line2"
                      x="455"
                      y="145"
                      width="170"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line3"
                      x="455"
                      y="160"
                      width="185"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line4"
                      x="455"
                      y="175"
                      width="160"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line5"
                      x="455"
                      y="190"
                      width="180"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line6"
                      x="455"
                      y="205"
                      width="175"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line7"
                      x="455"
                      y="220"
                      width="165"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line8"
                      x="455"
                      y="235"
                      width="190"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                    <rect
                      className="line9"
                      x="455"
                      y="250"
                      width="155"
                      height="8"
                      rx="2"
                      fill="var(--accent)"
                    />
                  </g>

                  {/* 하단: 키워드 태그들 */}
                  <g className="tags-area">
                    <rect
                      x="140"
                      y="335"
                      width="520"
                      height="50"
                      rx="8"
                      fill="var(--background-elevated, var(--muted))"
                      opacity="0.5"
                    />
                    <rect
                      className="tag1"
                      x="155"
                      y="350"
                      width="60"
                      height="20"
                      rx="10"
                      fill="var(--accent)"
                    />
                    <rect
                      className="tag2"
                      x="225"
                      y="350"
                      width="50"
                      height="20"
                      rx="10"
                      fill="var(--accent)"
                    />
                    <rect
                      className="tag3"
                      x="285"
                      y="350"
                      width="70"
                      height="20"
                      rx="10"
                      fill="var(--accent)"
                    />
                    <rect
                      className="tag4"
                      x="365"
                      y="350"
                      width="55"
                      height="20"
                      rx="10"
                      fill="var(--accent)"
                    />
                    <rect
                      className="tag5"
                      x="430"
                      y="350"
                      width="65"
                      height="20"
                      rx="10"
                      fill="var(--accent)"
                    />
                  </g>
                </g>
              </svg>

              {/* 모바일용 간단한 일러스트 */}
              <div className="md:hidden flex flex-col items-center gap-4 py-8">
                <div className="w-full max-w-xs bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-destructive/50" />
                    <div className="w-3 h-3 rounded-full bg-warning/50" />
                    <div className="w-3 h-3 rounded-full bg-success/50" />
                  </div>
                  <div className="bg-muted rounded-full px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                    <span className="truncate">youtube.com/watch?v=...</span>
                    <div className="w-1.5 h-4 bg-accent animate-pulse rounded-sm" />
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-accent rotate-90" />
                <div className="flex gap-2">
                  <div className="bg-accent/20 text-accent text-xs px-3 py-1 rounded-full">
                    AI 요약
                  </div>
                  <div className="bg-accent/20 text-accent text-xs px-3 py-1 rounded-full">
                    핵심장면
                  </div>
                  <div className="bg-accent/20 text-accent text-xs px-3 py-1 rounded-full">
                    키워드
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Slide 2: Features */}
          <section className="relative w-screen h-full shrink-0 flex flex-col items-center justify-center px-4 md:px-6 bg-background -mt-16">
            <div className="max-w-5xl mx-auto w-full">
              <div className="text-center mb-4 md:mb-8">
                <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-3">
                  이런 것들을 알 수 있어요
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  YouTube 링크 하나로 영상의 모든 것을 파악하세요
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredFeature(index)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      className={`bento-card p-3 md:p-6 cursor-default transition-all duration-200 ${
                        hoveredFeature === index
                          ? "border-accent/50 bg-accent/5 scale-[1.02] shadow-lg shadow-accent/10"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                        <div
                          className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
                            hoveredFeature === index
                              ? "bg-accent text-background scale-110"
                              : "bg-accent/10 text-accent"
                          }`}
                        >
                          <Icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Slide 3: Steps */}
          <section className="relative w-screen h-full shrink-0 flex flex-col items-center justify-center px-4 md:px-6 -mt-16">
            <div className="max-w-4xl mx-auto w-full">
              <div className="text-center mb-6 md:mb-12">
                <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-3">
                  사용 방법
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  3단계로 간단하게
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center md:items-start gap-3 md:gap-4"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl md:text-3xl mb-2 md:mb-4 transition-transform hover:scale-110">
                        {step.number}
                      </div>
                      <h3 className="font-semibold text-base md:text-lg mb-1 md:mb-2">
                        {step.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground max-w-32 md:max-w-37.5">
                        {step.description}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className="hidden md:block w-6 h-6 text-muted-foreground shrink-0 mt-7" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* 고정 CTA 버튼 */}
        <div className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={scrollToInput}
            className="btn-primary px-6 py-2.5 md:px-8 md:py-3 text-sm md:text-base shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 transition-all"
          >
            지금 시작하기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 사이드 네비게이션 화살표 */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted hover:scale-110 transition-all"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted hover:scale-110 transition-all"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        {/* 하단 인디케이터 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index
                  ? "w-6 bg-accent"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* URL 입력 섹션 - 스크롤 */}
      <section
        id="url-input-section"
        className="min-h-screen flex items-center px-4 md:px-6 py-12 bg-(--background-elevated)"
      >
        <div className="max-w-2xl mx-auto w-full space-y-6 md:space-y-8">
          <div className="text-center space-y-2 md:space-y-3">
            <h2 className="text-xl md:text-3xl font-bold">
              YouTube URL을 입력하세요
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              링크를 붙여넣으면 AI가 자동으로 분석을 시작합니다
            </p>
          </div>

          <div className="bento-card p-4 md:p-6 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
            <UrlInput
              onAnalyze={handleAnalyze}
              isLoading={mutation.isPending}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background/80 text-gray-300">
        {/* <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4"> */}
        {/* 회사 정보 */}
        {/* <div className="space-y-4">
              <h1 className="text-lg font-bold text-white">WIGTN</h1>
              
              <p className="text-sm">Youtube 영상 AI 분석 서비스</p>
            </div> */}

        {/* 링크 */}
        {/* <div>
              <h4 className="mb-4 font-semibold text-white">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="transition hover:text-white">
                    문제 풀기
                  </Link>
                </li>
                <li>
                  <Link href="/guide" className="transition hover:text-white">
                    사용 가이드
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="transition hover:text-white">
                    자주 묻는 질문
                  </Link>
                </li>
              </ul>
            </div> */}

        {/* 회사 */}
        {/* <div>
              <h4 className="mb-4 font-semibold text-white">회사</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/about" className="transition hover:text-white">
                    소개
                  </a>
                </li>
                <li>
                  <a href="/contact" className="transition hover:text-white">
                    문의하기
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="transition hover:text-white">
                    개인정보처리방침
                  </a>
                </li>
              </ul>
            </div> */}

        {/* 소셜 미디어 */}
        {/* <div>
              <h4 className="mb-4 font-semibold text-white">팔로우</h4>
              <div className="flex space-x-4">
                <a href="#" className="transition hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="transition hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="transition hover:text-white">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </div> */}

        {/* 하단 저작권 */}
        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; 2026 WIGTN. All rights reserved.</p>
        </div>
        {/* </div> */}
      </footer>
    </div>
  );
}
