"use client";

import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
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

        {/* SVG 일러스트 - URL 입력 → 로딩 (4초 사이클) */}
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
               * 타임라인 (4초 사이클):
               * 0-45%: URL 입력 + 타이핑 (1.8초)
               * 45-50%: URL 사라짐
               * 50-95%: 로딩 스피너 (1.8초)
               * 95-100%: 로딩 사라짐 → 리셋
               */

              /* 기본 플로팅 애니메이션 */
              @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
              @keyframes floatCircle1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-5px, -10px); } }
              @keyframes floatCircle2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(5px, -8px); } }

              /* URL 입력창 (0-45% 보임, 45-50% 사라짐) */
              @keyframes urlShow {
                0%, 45% { opacity: 1; }
                50%, 100% { opacity: 0; }
              }

              /* 글자 타이핑 애니메이션 (4초 사이클, 1.8초 내 완료) */
              @keyframes charType {
                0% { opacity: 0; }
                1% { opacity: 1; }
                45% { opacity: 1; }
                50%, 100% { opacity: 0; }
              }
              .char { animation: charType 4s infinite; }
              .char-0 { animation-delay: 0s; }
              .char-1 { animation-delay: 0.05s; }
              .char-2 { animation-delay: 0.1s; }
              .char-3 { animation-delay: 0.15s; }
              .char-4 { animation-delay: 0.2s; }
              .char-5 { animation-delay: 0.25s; }
              .char-6 { animation-delay: 0.3s; }
              .char-7 { animation-delay: 0.35s; }
              .char-8 { animation-delay: 0.4s; }
              .char-9 { animation-delay: 0.45s; }
              .char-10 { animation-delay: 0.5s; }
              .char-11 { animation-delay: 0.55s; }
              .char-12 { animation-delay: 0.6s; }
              .char-13 { animation-delay: 0.65s; }
              .char-14 { animation-delay: 0.7s; }
              .char-15 { animation-delay: 0.75s; }
              .char-16 { animation-delay: 0.8s; }
              .char-17 { animation-delay: 0.85s; }
              .char-18 { animation-delay: 0.9s; }
              .char-19 { animation-delay: 0.95s; }
              .char-20 { animation-delay: 1.0s; }
              .char-21 { animation-delay: 1.05s; }
              .char-22 { animation-delay: 1.1s; }
              .char-23 { animation-delay: 1.15s; }
              .char-24 { animation-delay: 1.2s; }
              .char-25 { animation-delay: 1.25s; }
              .char-26 { animation-delay: 1.3s; }
              .char-27 { animation-delay: 1.35s; }
              .char-28 { animation-delay: 1.4s; }
              .char-29 { animation-delay: 1.45s; }
              .char-30 { animation-delay: 1.5s; }
              .char-31 { animation-delay: 1.55s; }
              .char-32 { animation-delay: 1.6s; }
              .char-33 { animation-delay: 1.65s; }
              .char-34 { animation-delay: 1.7s; }
              .char-35 { animation-delay: 1.75s; }

              /* 커서 깜빡임 + 이동 */
              @keyframes cursor {
                0%, 100% { opacity: 1; }
                50% { opacity: 0; }
              }
              @keyframes cursorMove {
                0% { transform: translateX(0); }
                44% { transform: translateX(295px); }
                45%, 100% { transform: translateX(295px); }
              }

              /* 로딩 스피너 (50-95% 보임) */
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes loaderShow {
                0%, 48% { opacity: 0; }
                52%, 93% { opacity: 1; }
                98%, 100% { opacity: 0; }
              }

              .monitor-group { animation: float 4s ease-in-out infinite; }
              .url-input-screen { animation: urlShow 4s ease-in-out infinite; }
              .url-cursor { animation: cursor 0.5s step-end infinite, cursorMove 4s linear infinite; }
              .loader { animation: spin 0.8s linear infinite, loaderShow 4s ease-in-out infinite; transform-origin: 400px 220px; }
              .float-c1 { animation: floatCircle1 5s ease-in-out infinite; }
              .float-c2 { animation: floatCircle2 6s ease-in-out infinite; }
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

            {/* URL 입력 화면 */}
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
                {"https://youtube.com/watch?v=abc123".split("").map((char, i) => (
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
  );
}
