"use client";

import { useState } from "react";
import { isValidYouTubeUrl } from "@/lib/youtube";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  compact?: boolean;
}

export function UrlInput({ onAnalyze, isLoading, compact = false }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("URL을 입력해주세요");
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setError("올바른 유튜브 URL을 입력해주세요");
      return;
    }

    setError("");
    onAnalyze(url);
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="YouTube URL 붙여넣기..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
            className="input-dark flex-1 h-9 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary h-9 px-4"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="YouTube URL을 붙여넣으세요..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          disabled={isLoading}
          className="input-dark flex-1 h-12"
        />
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "btn-primary h-12 px-6",
            !isLoading && "pulse-glow"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>분석 중</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>분석하기</span>
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </form>
  );
}
