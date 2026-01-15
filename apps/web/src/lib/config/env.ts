/**
 * 환경변수 검증 및 설정
 */

import { createLogger } from "../logger";
import { STT } from "../constants";

const logger = createLogger("Env");

interface EnvConfig {
  YOUTUBE_API_KEY: string;
  /** NestJS API Gateway URL */
  API_URL: string;
  /** @deprecated use API_URL instead - AI 서버 직접 호출용 (fallback) */
  AI_SERVICE_URL: string;
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
  // API_URL: NestJS API Gateway (권장)
  // AI_SERVICE_URL: AI 서버 직접 호출 (deprecated, fallback용)
  const apiUrl = process.env.API_URL || "";
  const aiServiceUrl = process.env.AI_SERVICE_URL || "";

  return {
    YOUTUBE_API_KEY: validateRequiredEnv("YOUTUBE_API_KEY"),
    API_URL: apiUrl,
    AI_SERVICE_URL: aiServiceUrl,
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
