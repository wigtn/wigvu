// Shared request/response types for AI service communication

export interface VideoMetadata {
  title: string;
  channelName: string;
  description: string;
}

export interface STTSegment {
  start: number;
  end: number;
  text: string;
}

export interface AnalyzeRequest {
  metadata: VideoMetadata;
  transcript?: string;
  segments?: STTSegment[];
}

export interface Highlight {
  timestamp: number;
  title: string;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  watchScore: number;
  watchScoreReason: string;
  keywords: string[];
  highlights: Highlight[];
}

export interface AIServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface TranslateRequest {
  segments: STTSegment[];
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslatedSegment {
  start: number;
  end: number;
  original_text: string;
  translated_text: string;
}

export interface TranslateResponseData {
  segments: TranslatedSegment[];
}

export interface ArticleAnalyzeRequest {
  text: string;
  title?: string;
  source?: string;
}

export interface ArticleSentence {
  id: number;
  original: string;
  translated: string;
}

export interface ArticleExpression {
  expression: string;
  meaning: string;
  category: string;
  sentenceId: number;
  context: string;
}

export interface ArticleAnalysisResult {
  sentences: ArticleSentence[];
  expressions: ArticleExpression[];
  meta: {
    sentenceCount: number;
    expressionCount: number;
    processingTime: number;
  };
}

export interface SentenceParseRequest {
  sentence: string;
  context?: string;
}

export interface SentenceParseResult {
  components: unknown[];
  readingOrder: string;
  grammarPoints: unknown[];
}

export interface WordLookupRequest {
  word: string;
  sentence: string;
}

export interface WordLookupResult {
  word: string;
  pronunciation?: string;
  meanings: unknown[];
  contextMeaning: string;
  examples: string[];
}

export interface STTVideoRequest {
  language: string;
}

export interface STTResponseData {
  text: string;
  language: string;
  language_probability: number;
  segments: STTSegment[];
}
