"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink,
} from "lucide-react";

type DisplayMode = "both" | "original" | "translated";

// Mock data for demo
const mockArticle = {
  title: "Fed Holds Interest Rates Steady Amid Inflation Concerns",
  source: "BBC News",
  author: "John Smith",
  publishedDate: "2026-02-09",
  url: "https://www.bbc.com/news/business-12345",
};

const mockSentences = [
  {
    id: 0,
    original: "The Federal Reserve held interest rates steady on Wednesday.",
    translated: "연방준비제도는 수요일 금리를 동결했다.",
  },
  {
    id: 1,
    original:
      "The decision was widely expected by economists and market analysts.",
    translated: "이 결정은 경제학자들과 시장 분석가들에게 널리 예상되었다.",
  },
  {
    id: 2,
    original:
      "Chair Jerome Powell cited persistent inflation concerns as a key factor in the decision.",
    translated:
      "제롬 파월 의장은 지속적인 인플레이션 우려를 결정의 핵심 요인으로 언급했다.",
  },
  {
    id: 3,
    original:
      "The central bank signaled a cautious approach going forward, emphasizing data dependency.",
    translated:
      "중앙은행은 앞으로 신중한 접근 방식을 시사하며 데이터 의존성을 강조했다.",
  },
  {
    id: 4,
    original:
      "Markets reacted positively to the announcement, with major indices closing higher.",
    translated:
      "시장은 이 발표에 긍정적으로 반응했으며, 주요 지수들은 상승 마감했다.",
  },
];

const mockExpressions = [
  {
    expression: "hold steady",
    meaning: "동결하다, 안정을 유지하다",
    category: "phrasal_verb",
    sentenceId: 0,
  },
  {
    expression: "widely expected",
    meaning: "널리 예상된",
    category: "collocation",
    sentenceId: 1,
  },
  {
    expression: "cite as",
    meaning: "~을 ~로 언급하다",
    category: "phrasal_verb",
    sentenceId: 2,
  },
  {
    expression: "going forward",
    meaning: "앞으로, 향후",
    category: "idiom",
    sentenceId: 3,
  },
  {
    expression: "react positively",
    meaning: "긍정적으로 반응하다",
    category: "collocation",
    sentenceId: 4,
  },
  {
    expression: "close higher",
    meaning: "(주가가) 상승 마감하다",
    category: "technical_term",
    sentenceId: 4,
  },
];

const mockParsedSentence = {
  components: [
    { id: 0, text: "The Federal Reserve", role: "주어", explanation: "연방준비제도" },
    { id: 1, text: "held", role: "동사", explanation: "유지했다" },
    { id: 2, text: "interest rates", role: "목적어", explanation: "금리를" },
    { id: 3, text: "steady", role: "보어", explanation: "안정적으로" },
    { id: 4, text: "on Wednesday", role: "부사구", explanation: "수요일에" },
  ],
  readingOrder: "연준은 / 유지했다 / 금리를 / 안정적으로 / 수요일에",
  grammarPoints: [
    {
      type: "5형식 문장",
      explanation: "hold + 목적어 + 목적보어 형태로, '~을 ~한 상태로 유지하다'라는 의미입니다.",
    },
  ],
};

const roleColors: Record<string, string> = {
  주어: "bg-blue-500",
  동사: "bg-red-500",
  목적어: "bg-green-500",
  보어: "bg-purple-500",
  부사구: "bg-orange-500",
};

export default function ArticleDemoPage() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>("both");
  const [isDark, setIsDark] = useState(true);
  const [expandedSentence, setExpandedSentence] = useState<number | null>(null);
  const [highlightedExpression, setHighlightedExpression] = useState<number | null>(null);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      phrasal_verb: "구동사",
      idiom: "숙어",
      collocation: "연어",
      technical_term: "전문용어",
    };
    return labels[category] || category;
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

      <div className="swiss-container py-8">
        {/* Article Meta */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] mb-2">
            <span>{mockArticle.source}</span>
            <span>·</span>
            <span>{mockArticle.publishedDate}</span>
            <a
              href={mockArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline ml-2"
            >
              원문 보기
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            {mockArticle.title}
          </h1>
        </div>

        {/* Expression Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-medium">
              주요 표현 ({mockExpressions.length}개)
            </span>
          </div>
          <div className="horizontal-scroll pb-2">
            {mockExpressions.map((expr, index) => (
              <button
                key={index}
                onClick={() => setHighlightedExpression(expr.sentenceId)}
                className={`expression-card ${
                  highlightedExpression === expr.sentenceId
                    ? "border-[var(--accent)]"
                    : ""
                }`}
              >
                <div className="text-sm font-medium mb-1">{expr.expression}</div>
                <div className="text-xs text-[var(--foreground-secondary)] mb-2">
                  {expr.meaning}
                </div>
                <span className="swiss-badge text-[10px]">
                  {getCategoryLabel(expr.category)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Display Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="swiss-tabs w-auto inline-flex">
            <button
              onClick={() => setDisplayMode("both")}
              className={`swiss-tab ${displayMode === "both" ? "active" : ""}`}
            >
              양쪽
            </button>
            <button
              onClick={() => setDisplayMode("original")}
              className={`swiss-tab ${displayMode === "original" ? "active" : ""}`}
            >
              원문
            </button>
            <button
              onClick={() => setDisplayMode("translated")}
              className={`swiss-tab ${displayMode === "translated" ? "active" : ""}`}
            >
              번역
            </button>
          </div>
          <span className="text-sm text-[var(--foreground-tertiary)]">
            {mockSentences.length}개 문장
          </span>
        </div>

        {/* Sentences */}
        <div className="space-y-0">
          {mockSentences.map((sentence) => {
            const isExpanded = expandedSentence === sentence.id;
            const isHighlighted = highlightedExpression === sentence.id;

            return (
              <div
                key={sentence.id}
                className={`py-5 border-b border-[var(--border)] ${
                  isHighlighted ? "swiss-highlight" : ""
                }`}
              >
                {/* Sentence Content */}
                <div
                  className={`${
                    displayMode === "both"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : ""
                  }`}
                >
                  {(displayMode === "both" || displayMode === "original") && (
                    <p className="text-base leading-relaxed">
                      {sentence.original}
                    </p>
                  )}
                  {(displayMode === "both" || displayMode === "translated") && (
                    <p
                      className={`text-base leading-relaxed ${
                        displayMode === "both"
                          ? "text-[var(--foreground-secondary)]"
                          : ""
                      }`}
                    >
                      {sentence.translated}
                    </p>
                  )}
                </div>

                {/* Parse Button */}
                <div className="mt-3">
                  <button
                    onClick={() =>
                      setExpandedSentence(isExpanded ? null : sentence.id)
                    }
                    className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        구조 분석 접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        구조 분석
                      </>
                    )}
                  </button>
                </div>

                {/* Parsed Structure (only for first sentence demo) */}
                {isExpanded && sentence.id === 0 && (
                  <div className="mt-4 p-6 bg-[var(--muted)] rounded-lg animate-fade-in">
                    {/* Components - Clean Table Style */}
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            <th className="text-left py-2 pr-4 font-medium text-[var(--foreground-tertiary)] w-20">역할</th>
                            <th className="text-left py-2 pr-4 font-medium text-[var(--foreground-tertiary)]">원문</th>
                            <th className="text-left py-2 font-medium text-[var(--foreground-tertiary)]">해석</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockParsedSentence.components.map((comp) => (
                            <tr key={comp.id} className="border-b border-[var(--border)]/50">
                              <td className="py-3 pr-4">
                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium text-white ${roleColors[comp.role] || "bg-gray-500"}`}>
                                  {comp.role}
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-medium">{comp.text}</td>
                              <td className="py-3 text-[var(--foreground-secondary)]">{comp.explanation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Reading Order */}
                    <div className="p-4 bg-[var(--background)] rounded-lg mb-4">
                      <div className="text-xs font-medium text-[var(--foreground-tertiary)] mb-2">읽는 순서</div>
                      <div className="flex flex-wrap items-center gap-2">
                        {mockParsedSentence.readingOrder.split(" / ").map((part, idx, arr) => (
                          <span key={idx} className="flex items-center gap-2">
                            <span className="text-sm font-medium">{part}</span>
                            {idx < arr.length - 1 && (
                              <span className="text-[var(--foreground-tertiary)]">→</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Grammar Points */}
                    {mockParsedSentence.grammarPoints.map((point, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[var(--accent)]/10 rounded-lg border-l-4 border-[var(--accent)]"
                      >
                        <div className="text-xs font-medium text-[var(--accent)] mb-1">
                          {point.type}
                        </div>
                        <div className="text-sm text-[var(--foreground-secondary)]">
                          {point.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && sentence.id !== 0 && (
                  <div className="mt-4 p-4 bg-[var(--muted)] rounded-lg text-sm text-[var(--foreground-secondary)] text-center">
                    데모: 첫 번째 문장만 구조 분석 결과가 표시됩니다
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[var(--border)] text-center">
          <p className="text-sm text-[var(--foreground-tertiary)] mb-4">
            이것은 WIGVU v2 기사 학습 뷰의 디자인 목업입니다.
          </p>
          <Link href="/" className="btn-secondary">
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
