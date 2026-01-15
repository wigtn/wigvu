import { getEnvConfig } from "./config/env";
import { createLogger } from "./logger";

const logger = createLogger("STT");

export interface STTSegment {
  start: number;
  end: number;
  text: string;
}

export interface STTResult {
  text: string;
  language: string;
  languageProbability: number;
  segments: STTSegment[];
}

/**
 * @deprecated NestJS Gateway의 /api/v1/transcript/:videoId 사용 권장
 * 직접 STT 호출이 필요한 경우에만 사용
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language: string = "auto"
): Promise<STTResult> {
  const config = getEnvConfig();

  // API_URL (NestJS Gateway) 또는 AI_SERVICE_URL (직접 호출)
  const baseUrl = config.API_URL || config.AI_SERVICE_URL;
  if (!baseUrl) {
    throw new Error("API_URL or AI_SERVICE_URL is not configured");
  }

  const formData = new FormData();

  const uint8Array = new Uint8Array(audioBuffer);
  const blob = new Blob([uint8Array], { type: "audio/webm" });
  formData.append("audio", blob, "audio.webm");
  formData.append("language", language);

  // AI 서버 직접 호출 (NestJS Gateway는 STT 직접 호출 미지원)
  const sttUrl = config.AI_SERVICE_URL || baseUrl;
  const response = await fetch(`${sttUrl}/stt/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`STT API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  logger.debug("STT API 응답", {
    text_length: result.text?.length || 0,
    language: result.language,
    language_probability: result.language_probability,
    segments_count: result.segments?.length || 0,
    segments_sample: result.segments?.slice(0, 3) || [],
  });

  return {
    text: result.text || "",
    language: result.language || language,
    languageProbability: result.language_probability ?? 1.0,
    segments: result.segments || [],
  };
}

export function isWithinSTTLimit(durationSeconds: number): boolean {
  const config = getEnvConfig();
  return durationSeconds <= config.STT_MAX_DURATION_MINUTES * 60;
}
