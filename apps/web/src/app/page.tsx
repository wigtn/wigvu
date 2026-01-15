"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

const TOTAL_SLIDES = 4;

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
    description: "영상과 동기화된 자막을 한/영 동시에 확인할 수 있습니다",
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
  const carouselRef = useRef<HTMLDivElement>(null);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    carouselRef.current?.scrollTo({
      left: index * window.innerWidth,
      behavior: "smooth",
    });
  }, []);

  const nextSlide = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      goToSlide(currentSlide + 1);
    }
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // 스크롤 위치 동기화
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      const scrollLeft = carousel.scrollLeft;
      const slideWidth = window.innerWidth;
      const newSlide = Math.round(scrollLeft / slideWidth);
      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    };

    carousel.addEventListener("scroll", handleScroll);
    return () => carousel.removeEventListener("scroll", handleScroll);
  }, [currentSlide]);

  // 자동 슬라이드 (2초마다, 마지막 슬라이드 제외)
  useEffect(() => {
    if (currentSlide >= TOTAL_SLIDES - 1) return;

    const timer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 100000);

    return () => clearInterval(timer);
  }, [currentSlide, goToSlide]);

  const mutation = useMutation({
    mutationFn: analyzeVideo,
    onSuccess: (data) => {
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

  // 로딩 중
  if (mutation.isPending) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <LoadingState />
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

  // 초기 상태: 랜딩 페이지 (가로 캐러셀)
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header - 고정 */}
      <header className="shrink-0 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-bold text-lg">WIGTN</span>
          </div>
          {/* <button
            onClick={() => goToSlide(TOTAL_SLIDES - 1)}
            className="btn-primary px-4 py-2 text-sm"
          >
            시작하기
          </button> */}
        </div>
      </header>

      {/* 캐러셀 컨테이너 */}
      <div
        ref={carouselRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
        style={{
          scrollBehavior: "smooth",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Slide 1: Hero */}
        <section className="relative w-screen h-full shrink-0 snap-start flex flex-col items-center justify-center px-6">
          <div className="max-w-4xl mx-auto w-full">
            {/* 타이틀 */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                YouTube 영상, 빠르게 파악하세요
              </h1>
              <p className="text-muted-foreground text-lg">
                URL 하나로 AI가 핵심 내용을 분석해드립니다
              </p>
            </div>

            {/* SVG 일러스트 - URL 입력 → 분석 결과 변환 애니메이션 */}
            <svg
              viewBox="0 0 800 500"
              className="w-full max-w-3xl h-auto mx-auto"
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

            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
              <button
                onClick={() => goToSlide(TOTAL_SLIDES - 1)}
                className="btn-primary px-8 py-3 text-base"
              >
                지금 시작하기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Slide 2: Features */}
        <section className="relative w-screen h-full shrink-0 snap-start flex flex-col items-center justify-center px-6 bg-(--background-elevated)">
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                이런 것들을 알 수 있어요
              </h2>
              <p className="text-muted-foreground">
                YouTube 링크 하나로 영상의 모든 것을 파악하세요
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className={`bento-card p-6 cursor-default transition-all duration-300 ${
                      hoveredFeature === index
                        ? "border-accent/50 bg-accent/5 scale-[1.02] shadow-lg shadow-accent/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          hoveredFeature === index
                            ? "bg-accent text-background scale-110"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
              <button
                onClick={() => goToSlide(TOTAL_SLIDES - 1)}
                className="btn-primary px-8 py-3 text-base"
              >
                지금 시작하기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Slide 3: Steps */}
        <section className="relative w-screen h-full shrink-0 snap-start flex flex-col items-center justify-center px-6">
          <div className="max-w-4xl mx-auto w-full">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">사용 방법</h2>
              <p className="text-muted-foreground">3단계로 간단하게</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 md:gap-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-3xl mb-4 transition-transform hover:scale-110">
                      {step.number}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-37.5">
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden md:block w-6 h-6 text-muted-foreground shrink-0 mt-7" />
                  )}
                </div>
              ))}
            </div>

            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
              <button
                onClick={() => goToSlide(TOTAL_SLIDES - 1)}
                className="btn-primary px-8 py-3 text-base "
              >
                지금 시작하기
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Slide 4: URL Input */}
        <section className="w-screen h-full shrink-0 snap-start flex items-center px-6 bg-(--background-elevated)">
          <div className="max-w-2xl mx-auto w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold">
                YouTube URL을 입력하세요
              </h2>
              <p className="text-muted-foreground">
                링크를 붙여넣으면 AI가 자동으로 분석을 시작합니다
              </p>
            </div>

            <div className="bento-card p-6 transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
              <UrlInput
                onAnalyze={handleAnalyze}
                isLoading={mutation.isPending}
              />
            </div>
          </div>
        </section>
      </div>

      {/* 사이드 네비게이션 화살표 */}
      <button
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted hover:scale-110 transition-all disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
      </button>
      <button
        onClick={nextSlide}
        disabled={currentSlide === TOTAL_SLIDES - 1}
        className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 md:p-4 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted hover:scale-110 transition-all disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      {/* 하단 인디케이터 */}
      <div className="shrink-0 py-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
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
    </div>
  );
}
