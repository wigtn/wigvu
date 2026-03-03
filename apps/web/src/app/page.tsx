"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link as LinkIcon } from "lucide-react";
import { CURATED_ARTICLES } from "@/features/article/data/curated-articles";
import { ArticleCard } from "@/features/article/components/article-card";

const URL_PATTERN = /^https?:\/\//;

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");

  const isUrl = URL_PATTERN.test(text.trim());
  const isEmpty = text.trim().length === 0;

  const handleSubmit = () => {
    if (isEmpty) return;
    if (isUrl) {
      router.push(`/read?url=${encodeURIComponent(text.trim())}`);
    } else {
      sessionStorage.setItem("readText", text.trim());
      router.push("/read");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 pb-12">
      {/* Hero Section */}
      <div className="w-full max-w-[640px] text-center space-y-6 pt-[10vh]">
        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Learn Korean Your Way
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Read real Korean articles with AI-powered translations
          </p>
        </div>

        {/* Input Card */}
        <div className="relative text-left rounded-xl border border-border bg-[var(--surface)] focus-within:border-accent transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste Korean text or URL..."
            className="w-full min-h-[80px] px-5 pt-4 pb-12 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/50 resize-none"
            rows={3}
          />

          {/* URL indicator */}
          {isUrl && (
            <div className="flex items-center gap-1.5 px-5 pb-2 text-xs text-[var(--accent)]">
              <LinkIcon size={12} />
              <span>Text will be fetched from URL</span>
            </div>
          )}

          {/* Submit button */}
          <div className="absolute bottom-3 right-3">
            <button
              onClick={handleSubmit}
              disabled={isEmpty}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Start
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Grid Section */}
      <div className="w-full max-w-[960px] mt-10">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Recommended for you
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURATED_ARTICLES.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}
