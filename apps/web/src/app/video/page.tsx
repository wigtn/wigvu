"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Target, Globe } from "lucide-react";
import { extractVideoId } from "@/features/video/lib/youtube";

const FEATURES = [
  {
    icon: FileText,
    title: "AI Summary",
    description: "Summarize key points",
  },
  {
    icon: Target,
    title: "Key Moments",
    description: "Important moments on a timeline",
  },
  {
    icon: Globe,
    title: "Subtitle Translation",
    description: "Foreign videos translated to Korean",
  },
];

export default function VideoPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  const handleAnalyze = () => {
    const videoId = extractVideoId(url.trim());
    if (videoId) {
      sessionStorage.setItem("pendingAnalysisUrl", url.trim());
      router.push(`/analyze/${videoId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6">
      <div className="w-full max-w-[640px] text-center space-y-6">
        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            YouTube Videos, Key Points Fast
          </h1>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Paste a URL and AI will summarize and find key moments
          </p>
        </div>

        {/* Input */}
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste a YouTube URL..."
            className="input-field pr-28"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              onClick={handleAnalyze}
              disabled={!url.trim()}
              className="btn-primary px-4 py-2 text-sm"
            >
              Analyze
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mt-12">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="bento-card p-4 text-center space-y-2"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="text-xs text-[var(--foreground-secondary)]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
