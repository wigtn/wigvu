export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string;
  description: string;
}

export interface Highlight {
  timestamp: number;
  title: string;
  description: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;           // 원본 텍스트 (하위 호환성)
  originalText?: string;  // 원본 텍스트 (영어)
  translatedText?: string; // 번역 텍스트 (한국어)
}

export type TranscriptSource = "youtube" | "stt" | "none";

export interface LanguageInfo {
  code: string;
  probability: number;
}

export interface VideoAnalysis {
  id: string;
  videoId: string;
  url: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string;
  summary: string;
  watchScore: number;
  watchScoreReason: string;
  keywords: string[];
  highlights: Highlight[];
  language: string;
  transcriptSource: TranscriptSource;
  detectedLanguage?: LanguageInfo;
  transcript?: string;
  transcriptSegments?: TranscriptSegment[];
  /** 한국어 자막 여부 (번역 불필요했음) */
  isKorean?: boolean;
  analyzedAt: string;
}

export interface AnalyzeRequest {
  url: string;
  language?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: VideoAnalysis;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
