"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UrlInput } from "@/components/url-input";
import { LoadingState } from "@/components/loading-state";
import { ErrorModal } from "@/components/error-display";
import { HeroSection } from "@/components/hero-section";
import { VideoAnalysis, AnalyzeResponse } from "@/types/analysis";
import { analysisStore } from "@/store/analysis-store";
import { ApiError } from "@/lib/errors";
import {
  Zap,
  Languages,
  Sparkles,
  Play,
  Mic,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react";

const TOTAL_SLIDES = 3;

const features = [
  {
    icon: Languages,
    title: "원문·번역 동시 학습",
    description:
      "영어 원문과 한국어 번역이 문장 단위로 매핑되어 동시에 표시됩니다. 맥락이 끊기지 않고 원문의 뉘앙스를 놓치지 않습니다.",
    keywords: ["문장 매핑", "10개국어+", "맥락 유지"],
  },
  {
    icon: Mic,
    title: "자동 스크립트 생성",
    description:
      "자막이 없는 영상도 STT로 스크립트를 자동 생성합니다. 어떤 영상이든 학습 가능합니다.",
    keywords: ["STT", "자막 없어도 OK", "자동 생성"],
  },
  {
    icon: Sparkles,
    title: "AI 요약 & 복습",
    description:
      "LLM이 영상 내용을 요약하고 핵심 포인트를 정리합니다. 빠른 복습과 내용 파악에 최적화되었습니다.",
    keywords: ["LLM 요약", "핵심 정리", "빠른 복습"],
  },
  {
    icon: Play,
    title: "구간 탐색 & 핵심 장면",
    description:
      "중요한 부분을 골라 바로 해당 타임스탬프로 이동합니다. 필요한 구간을 빠르게 찾아 학습하세요.",
    keywords: ["타임스탬프", "구간 이동", "핵심 장면"],
  },
];

const steps = [
  {
    number: "1",
    icon: LinkIcon,
    title: "URL 붙여넣기",
    description: "YouTube 영상 링크를 입력하면 자동으로 분석이 시작됩니다",
  },
  {
    number: "2",
    icon: Sparkles,
    title: "AI 분석",
    description: "오디오를 추출하고 한국어로 번역을 진행합니다",
  },
  {
    number: "3",
    icon: CheckCircle,
    title: "결과 확인",
    description: "원문·번역 스크립트, 주제별 구간 분리, AI 요약을 한눈에 확인하세요",
  },
];

async function analyzeVideo(url: string): Promise<VideoAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data: AnalyzeResponse = await response.json();

  if (!data.success || !data.data) {
    // ApiError로 변환하여 사용자 친화적 메시지 사용
    throw ApiError.fromResponse(data, response.status);
  }

  return data.data;
}

export default function Home() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [enableTransition, setEnableTransition] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Transform 기반 무한 캐러셀
  // 슬라이드 구조: [마지막복제(-1), 0, 1, 2, 첫번째복제(3)]
  // 실제 위치: translateIndex 1이 slide 0
  const SLIDE_DURATION = 500;
  const [translateIndex, setTranslateIndex] = useState(1); // 시작: 실제 slide 0 위치

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setEnableTransition(true);
      setCurrentSlide(index);
      setTranslateIndex(index + 1); // +1 because of prepended clone

      setTimeout(() => {
        setIsTransitioning(false);
      }, SLIDE_DURATION);
    },
    [isTransitioning]
  );

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setEnableTransition(true);

    const nextTranslateIndex = translateIndex + 1;
    setTranslateIndex(nextTranslateIndex);

    // 다음 실제 슬라이드 계산
    const nextRealSlide = (currentSlide + 1) % TOTAL_SLIDES;
    setCurrentSlide(nextRealSlide);

    // 복제본(index 4)에 도달하면 즉시 실제 첫 번째(index 1)로 점프
    if (nextTranslateIndex === TOTAL_SLIDES + 1) {
      setTimeout(() => {
        setEnableTransition(false);
        setTranslateIndex(1);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, SLIDE_DURATION);
    } else {
      setTimeout(() => {
        setIsTransitioning(false);
      }, SLIDE_DURATION);
    }
  }, [currentSlide, isTransitioning, translateIndex]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setEnableTransition(true);

    const prevTranslateIndex = translateIndex - 1;
    setTranslateIndex(prevTranslateIndex);

    // 이전 실제 슬라이드 계산
    const prevRealSlide = (currentSlide - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
    setCurrentSlide(prevRealSlide);

    // 복제본(index 0)에 도달하면 즉시 실제 마지막(index 3)으로 점프
    if (prevTranslateIndex === 0) {
      setTimeout(() => {
        setEnableTransition(false);
        setTranslateIndex(TOTAL_SLIDES);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, SLIDE_DURATION);
    } else {
      setTimeout(() => {
        setIsTransitioning(false);
      }, SLIDE_DURATION);
    }
  }, [currentSlide, isTransitioning, translateIndex]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // 자동 슬라이드 (4초)
  useEffect(() => {
    if (isTransitioning) return;

    const timer = setTimeout(() => {
      nextSlide();
    }, 4000);

    return () => clearTimeout(timer);
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

  // 에러 상태 - ErrorModal로 표시
  const errorForModal = mutation.isError
    ? (mutation.error instanceof ApiError
        ? mutation.error
        : ApiError.fromFetchError(mutation.error))
    : null;

  // 초기 상태: 랜딩 페이지 (가로 캐러셀 + 스크롤 URL 입력)
  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto"
      style={{
        background:
          "linear-gradient(to bottom, var(--background) 0%, #2a2a2a 50%, #3a3a3a 100%)",
      }}
    >
      {/* Header - 고정 */}
      <header className="fixed top-0 left-0 right-0 shrink-0 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="font-bold text-lg">WIGTN</span>
          </div>
          {/* 테스트 버튼 (개발용) */}
          {/* <button
            onClick={() => setTestLoading(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:border-accent transition-colors"
            title="로딩 테스트"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">로딩 테스트</span>
          </button> */}
        </div>
      </header>

      {/* 캐러셀 컨테이너 */}
      <div className="h-screen w-full shrink-0 relative pt-16 overflow-hidden">
        <div
          ref={carouselRef}
          className="h-full flex"
          style={{
            transform: `translateX(-${translateIndex * 100}vw)`,
            transition: enableTransition
              ? `transform ${SLIDE_DURATION}ms ease-in-out`
              : "none",
          }}
        >
          {/* Slide 0: Steps Clone (마지막 복제 - 무한루프용) */}
          <section className="relative w-screen h-full shrink-0 flex flex-col items-center justify-center px-4 md:px-6 -mt-16">
            <div className="max-w-4xl mx-auto w-full">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-3">
                  시작은 간단해요
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  URL 하나면 충분합니다
                </p>
              </div>

              {/* 타임라인 컨테이너 */}
              <div className="relative">
                {/* 세로 연결선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block" />

                <div className="flex flex-col gap-8 md:gap-12">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isEven = index % 2 === 0;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 md:gap-8 ${
                          isEven ? "md:flex-row" : "md:flex-row-reverse"
                        }`}
                      >
                        {/* 콘텐츠 */}
                        <div
                          className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"}`}
                        >
                          <h3 className="font-semibold text-lg md:text-xl mb-1">
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>

                        {/* 중앙 아이콘 */}
                        <div className="relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/30">
                          <Icon className="w-6 h-6 md:w-7 md:h-7 text-accent-foreground" />
                          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                            {step.number}
                          </span>
                        </div>

                        {/* 빈 공간 (정렬용) */}
                        <div className="flex-1 hidden md:block" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
          {/* Slide 1: Hero */}
          <HeroSection />

          {/* Slide 2: Features */}
          <section className="relative w-screen h-full shrink-0 flex flex-col items-center justify-center px-4 md:px-6 -mt-16">
            <div className="max-w-5xl mx-auto w-full">
              <div className="text-center mb-4 md:mb-8">
                <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-3">
                  외국어 영상, 이제 이해하면서 보세요
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  원문과 번역을 동시에 보며 맥락을 놓치지 않는 학습
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="bento-card p-3 md:p-6"
                    >
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 bg-accent/10 text-accent">
                          <Icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2 md:line-clamp-none">
                            {feature.description}
                          </p>
                          <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                            {feature.keywords.map((keyword, i) => (
                              <span
                                key={i}
                                className="text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
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
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-3">
                  시작은 간단해요
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  URL 하나면 충분합니다
                </p>
              </div>

              {/* 타임라인 컨테이너 */}
              <div className="relative">
                {/* 세로 연결선 */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block" />

                <div className="flex flex-col gap-8 md:gap-12">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isEven = index % 2 === 0;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 md:gap-8 ${
                          isEven ? "md:flex-row" : "md:flex-row-reverse"
                        }`}
                      >
                        {/* 콘텐츠 */}
                        <div
                          className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"}`}
                        >
                          <h3 className="font-semibold text-lg md:text-xl mb-1">
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>

                        {/* 중앙 아이콘 */}
                        <div className="relative z-10 w-14 h-14 md:w-16 md:h-16 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/30">
                          <Icon className="w-6 h-6 md:w-7 md:h-7 text-accent-foreground" />
                          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                            {step.number}
                          </span>
                        </div>

                        {/* 빈 공간 (정렬용) */}
                        <div className="flex-1 hidden md:block" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Slide 4: Hero Clone (첫번째 복제 - 무한루프용) */}
          <HeroSection />
        </div>

        {/* 고정 CTA 버튼 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={scrollToInput}
            className="btn-primary px-6 py-2.5 md:px-8 md:py-3 text-sm md:text-base shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 transition-all"
          >
            지금 시작하기
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* 사이드 네비게이션 화살표 */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 p-2 hover:scale-110 transition-all"
        >
          <ChevronLeft
            className="w-8 h-8 md:w-10 md:h-10 text-white/80 hover:text-white"
            strokeWidth={3}
            style={{
              filter:
                "drop-shadow(1px 1px 0px rgba(0,0,0,0.5)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.2))",
            }}
          />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-2 hover:scale-110 transition-all"
        >
          <ChevronRight
            className="w-8 h-8 md:w-10 md:h-10 text-white/80 hover:text-white"
            strokeWidth={3}
            style={{
              filter:
                "drop-shadow(1px 1px 0px rgba(0,0,0,0.5)) drop-shadow(-1px -1px 0px rgba(255,255,255,0.2))",
            }}
          />
        </button>

        {/* 하단 인디케이터 */}
        <div className="absolute bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2">
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
        className="min-h-screen flex items-center px-4 md:px-6 py-12"
      >
        <div className="max-w-2xl mx-auto w-full space-y-6 md:space-y-8">
          <div className="text-center space-y-2 md:space-y-3">
            <h2 className="text-xl md:text-3xl font-bold">
              보고 싶은 영상의 링크를 입력해보세요!
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              WIGTN AI가 내용을 분석하여 최고의 학습 도우미가 됩니다 ✨
            </p>
          </div>

          <UrlInput
            onAnalyze={handleAnalyze}
            isLoading={mutation.isPending}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-gray-300">
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
        <div className="py-8 text-center text-sm">
          <p>&copy; 2026 WIGTN. All rights reserved.</p>
        </div>
        {/* </div> */}
      </footer>

      {/* 에러 모달 */}
      {errorForModal && (
        <ErrorModal
          isOpen={mutation.isError}
          onClose={() => mutation.reset()}
          error={errorForModal}
          onReset={handleReset}
          autoRedirectDelay={5}
        />
      )}
    </div>
  );
}
