"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Newspaper,
  Youtube,
  ArrowRight,
  BookOpen,
  Languages,
  Sparkles,
  Search,
  Sun,
  Moon,
} from "lucide-react";

type InputMode = "article" | "video";

export default function Home() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>("article");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isTextMode, setIsTextMode] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === "article") {
      // TODO: Navigate to article analysis page
      console.log("Analyze article:", isTextMode ? text : url);
    } else {
      // TODO: Navigate to video analysis page
      console.log("Analyze video:", url);
    }
  };

  const features = [
    {
      icon: Languages,
      title: "문장별 번역",
      description: "원문과 한국어 번역을 나란히 보며 학습",
    },
    {
      icon: BookOpen,
      title: "숙어 추출",
      description: "기사에 포함된 핵심 표현을 자동으로 정리",
    },
    {
      icon: Search,
      title: "구조 분석",
      description: "어려운 문장의 문법 구조를 쉽게 파악",
    },
    {
      icon: Sparkles,
      title: "AI 요약",
      description: "긴 콘텐츠도 핵심만 빠르게 파악",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="swiss-container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">WIGVU</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="swiss-nav-item">
                기능
              </Link>
              <Link href="#how-it-works" className="swiss-nav-item">
                사용법
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="btn-ghost p-2"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost hidden sm:flex"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="swiss-container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <span className="swiss-badge">Beta</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              URL을 입력하면
              <br />
              <span className="text-[var(--foreground-secondary)]">
                학습 콘텐츠가 됩니다
              </span>
            </h1>
            <p className="text-lg text-[var(--foreground-secondary)] max-w-2xl mx-auto">
              영어 뉴스 기사나 YouTube 영상의 URL을 붙여넣으세요.
              <br className="hidden sm:block" />
              AI가 문장별 번역, 숙어 추출, 문법 분석까지 도와드립니다.
            </p>
          </div>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto mt-12">
            {/* Tab Switcher */}
            <div className="swiss-tabs mb-6">
              <button
                onClick={() => setInputMode("article")}
                className={`swiss-tab ${inputMode === "article" ? "active" : ""}`}
              >
                <Newspaper className="w-4 h-4 inline-block mr-2" />
                뉴스 기사
              </button>
              <button
                onClick={() => setInputMode("video")}
                className={`swiss-tab ${inputMode === "video" ? "active" : ""}`}
              >
                <Youtube className="w-4 h-4 inline-block mr-2" />
                영상
              </button>
            </div>

            {/* Input Card */}
            <div className="swiss-card">
              <form onSubmit={handleSubmit} className="space-y-4">
                {inputMode === "article" && (
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setIsTextMode(false)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        !isTextMode
                          ? "bg-[var(--muted)] text-[var(--foreground)]"
                          : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      URL 입력
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTextMode(true)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        isTextMode
                          ? "bg-[var(--muted)] text-[var(--foreground)]"
                          : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      텍스트 붙여넣기
                    </button>
                  </div>
                )}

                {isTextMode && inputMode === "article" ? (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="분석할 영어 텍스트를 여기에 붙여넣으세요..."
                    className="swiss-input min-h-[160px] resize-none"
                    rows={6}
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={
                        inputMode === "article"
                          ? "https://bbc.com/news/..."
                          : "https://youtube.com/watch?v=..."
                      }
                      className="swiss-input pr-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-tertiary)]">
                      {inputMode === "article" ? (
                        <Newspaper className="w-5 h-5" />
                      ) : (
                        <Youtube className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={
                    isTextMode && inputMode === "article"
                      ? !text.trim()
                      : !url.trim()
                  }
                >
                  분석 시작
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Demo Links */}
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--foreground-tertiary)] mb-3">
                  결과 화면 미리보기
                </p>
                <div className="flex gap-2 mb-4">
                  <Link
                    href="/demo/article"
                    className="text-sm px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    기사 분석 데모
                  </Link>
                  <Link
                    href="/demo/video"
                    className="text-sm px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    영상 분석 데모
                  </Link>
                </div>
                <p className="text-sm text-[var(--foreground-tertiary)] mb-3">
                  예시 URL로 시작해보세요
                </p>
                <div className="flex flex-wrap gap-2">
                  {inputMode === "article" ? (
                    <>
                      <button
                        onClick={() =>
                          setUrl("https://www.bbc.com/news/business-12345")
                        }
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--muted)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                      >
                        BBC News
                      </button>
                      <button
                        onClick={() =>
                          setUrl("https://www.reuters.com/world/us/article")
                        }
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--muted)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Reuters
                      </button>
                      <button
                        onClick={() =>
                          setUrl(
                            "https://www.theguardian.com/technology/article"
                          )
                        }
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--muted)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                      >
                        The Guardian
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
                        }
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--muted)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                      >
                        TED Talk
                      </button>
                      <button
                        onClick={() =>
                          setUrl("https://www.youtube.com/watch?v=abc123")
                        }
                        className="text-sm px-3 py-1.5 rounded-md bg-[var(--muted)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Tech Review
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[var(--muted)]">
        <div className="swiss-container">
          <div className="text-center mb-16">
            <span className="swiss-caption">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              학습에 필요한 모든 것
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="swiss-card swiss-card-interactive bg-[var(--background)]"
                >
                  <div className="w-12 h-12 rounded-lg bg-[var(--muted)] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[var(--foreground-secondary)] text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="swiss-container">
          <div className="text-center mb-16">
            <span className="swiss-caption">How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              3단계로 시작하세요
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: "01",
                  title: "URL 또는 텍스트 입력",
                  description:
                    "영어 뉴스 기사 URL을 붙여넣거나, 텍스트를 직접 입력하세요.",
                },
                {
                  step: "02",
                  title: "AI 분석",
                  description:
                    "AI가 문장별로 번역하고, 숙어를 추출하며, 문법 구조를 분석합니다.",
                },
                {
                  step: "03",
                  title: "학습 시작",
                  description:
                    "원문과 번역을 비교하며 학습하세요. 모르는 단어는 클릭 한 번으로 확인!",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex gap-6 items-start group"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-[var(--muted)] flex items-center justify-center text-2xl font-bold text-[var(--foreground-tertiary)] group-hover:bg-[var(--foreground)] group-hover:text-[var(--background)] transition-colors">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-[var(--foreground-secondary)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--foreground)] text-[var(--background)]">
        <div className="swiss-container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg opacity-80">
              회원가입 없이 URL만 붙여넣으면 됩니다.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--background)] text-[var(--foreground)] rounded-md font-medium hover:opacity-90 transition-opacity"
            >
              시작하기
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--border)]">
        <div className="swiss-container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold">WIGVU</span>
              <span className="text-[var(--foreground-tertiary)] text-sm">
                URL 기반 영어 학습 플랫폼
              </span>
            </div>
            <p className="text-sm text-[var(--foreground-tertiary)]">
              &copy; 2026 WIGVU. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
