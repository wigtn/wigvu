"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "AI가 분석 중입니다...",
  "영상 내용을 파악하고 있어요",
  "핵심 장면을 찾고 있습니다",
  "키워드를 추출하는 중이에요",
  "자막을 분석하고 있습니다",
  "거의 다 됐어요!",
];

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 메시지 로테이션
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev: number) => (prev + 1) % MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // 경과 시간 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev: number) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시간 포맷 (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bento-card p-8 text-center max-w-md w-full">
      {/* Animated SVG */}
      <svg
        viewBox="0 0 200 200"
        className="w-32 h-32 mx-auto mb-6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>
            {`
              @keyframes pulse1 {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.15); opacity: 0.6; }
              }
              @keyframes pulse2 {
                0%, 100% { transform: scale(1); opacity: 0.4; }
                50% { transform: scale(1.1); opacity: 0.7; }
              }
              @keyframes pulse3 {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.05); opacity: 0.8; }
              }
              @keyframes rotateRing {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes dash {
                0% { stroke-dashoffset: 300; }
                50% { stroke-dashoffset: 100; }
                100% { stroke-dashoffset: 300; }
              }
              @keyframes barPulse1 {
                0%, 100% { height: 20px; opacity: 0.5; }
                50% { height: 40px; opacity: 1; }
              }
              @keyframes barPulse2 {
                0%, 100% { height: 30px; opacity: 0.6; }
                50% { height: 50px; opacity: 1; }
              }
              @keyframes barPulse3 {
                0%, 100% { height: 25px; opacity: 0.5; }
                50% { height: 45px; opacity: 1; }
              }
              @keyframes barPulse4 {
                0%, 100% { height: 35px; opacity: 0.7; }
                50% { height: 55px; opacity: 1; }
              }
              @keyframes barPulse5 {
                0%, 100% { height: 22px; opacity: 0.5; }
                50% { height: 42px; opacity: 1; }
              }
              .ring1 { animation: pulse1 2s ease-in-out infinite; transform-origin: center; }
              .ring2 { animation: pulse2 2s ease-in-out infinite 0.3s; transform-origin: center; }
              .ring3 { animation: pulse3 2s ease-in-out infinite 0.6s; transform-origin: center; }
              .rotating-ring { animation: rotateRing 3s linear infinite; transform-origin: center; }
              .dash-ring { animation: dash 2s ease-in-out infinite; }
              .bar1 { animation: barPulse1 1s ease-in-out infinite; }
              .bar2 { animation: barPulse2 1s ease-in-out infinite 0.1s; }
              .bar3 { animation: barPulse3 1s ease-in-out infinite 0.2s; }
              .bar4 { animation: barPulse4 1s ease-in-out infinite 0.3s; }
              .bar5 { animation: barPulse5 1s ease-in-out infinite 0.4s; }
            `}
          </style>
        </defs>

        {/* 배경 펄스 링 */}
        <circle className="ring1" cx="100" cy="100" r="70" fill="var(--accent)" opacity="0.3" />
        <circle className="ring2" cx="100" cy="100" r="55" fill="var(--accent)" opacity="0.4" />
        <circle className="ring3" cx="100" cy="100" r="40" fill="var(--accent)" opacity="0.5" />

        {/* 회전하는 대시 링 */}
        <g className="rotating-ring">
          <circle
            className="dash-ring"
            cx="100"
            cy="100"
            r="75"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeDasharray="50 30"
            strokeLinecap="round"
          />
        </g>

        {/* 중앙 오디오 파형 바 */}
        <g transform="translate(100, 100)">
          <rect className="bar1" x="-30" y="-20" width="6" height="20" rx="3" fill="var(--foreground)" style={{ transformOrigin: 'center bottom' }} />
          <rect className="bar2" x="-18" y="-30" width="6" height="30" rx="3" fill="var(--foreground)" style={{ transformOrigin: 'center bottom' }} />
          <rect className="bar3" x="-6" y="-25" width="6" height="25" rx="3" fill="var(--foreground)" style={{ transformOrigin: 'center bottom' }} />
          <rect className="bar4" x="6" y="-35" width="6" height="35" rx="3" fill="var(--foreground)" style={{ transformOrigin: 'center bottom' }} />
          <rect className="bar5" x="18" y="-22" width="6" height="22" rx="3" fill="var(--foreground)" style={{ transformOrigin: 'center bottom' }} />
        </g>
      </svg>

      {/* Rotating Message */}
      <p className="text-lg font-medium text-foreground mb-3">
        {MESSAGES[messageIndex]}
      </p>

      {/* 경과 시간 타이머 */}
      <p className="text-sm text-muted-foreground">
        경과 시간: <span className="font-mono text-accent">{formatTime(elapsedTime)}</span>
      </p>
    </div>
  );
}
