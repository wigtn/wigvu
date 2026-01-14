/**
 * 환경변수 검증 및 설정
 */

import path from "path";
import { createLogger } from "../logger";
import { STT } from "../constants";

const logger = createLogger("Env");

interface EnvConfig {
  OPENAI_API_KEY: string;
  YOUTUBE_API_KEY: string;
  AI_SERVICE_URL: string;
  STT_API_URL: string;  // deprecated: use AI_SERVICE_URL
  YT_DLP_PATH: string;
  STT_MAX_DURATION_MINUTES: number;
}

/**
 * 필수 환경변수 검증
 */
function validateRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * 환경변수 검증 및 기본값 설정
 */
export function getEnvConfig(): EnvConfig {
  // AI_SERVICE_URL이 없으면 STT_API_URL을 fallback으로 사용
  const aiServiceUrl = process.env.AI_SERVICE_URL || process.env.STT_API_URL || "";

  return {
    OPENAI_API_KEY: validateRequiredEnv("OPENAI_API_KEY"),
    YOUTUBE_API_KEY: validateRequiredEnv("YOUTUBE_API_KEY"),
    AI_SERVICE_URL: aiServiceUrl,
    STT_API_URL: aiServiceUrl,  // backward compatibility
    YT_DLP_PATH:
      process.env.YT_DLP_PATH ||
      path.join(process.cwd(), "bin", "yt-dlp"),
    STT_MAX_DURATION_MINUTES: parseInt(
      process.env.STT_MAX_DURATION_MINUTES ||
        STT.DEFAULT_MAX_DURATION_MINUTES.toString()
    ),
  };
}

/**
 * 서버 시작 시 환경변수 검증
 */
export function validateEnv(): void {
  try {
    getEnvConfig();
    logger.info("Environment variables validated successfully");
  } catch (error) {
    logger.error("Environment validation failed", error);
    throw error;
  }
}
