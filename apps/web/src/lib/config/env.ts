/**
 * 환경변수 검증 및 설정
 */

import { createLogger } from "../logger";
import { STT } from "../constants";

const logger = createLogger("Env");

interface EnvConfig {
  /** NestJS API Gateway URL (Required) */
  API_URL: string;
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
  return {
    API_URL: validateRequiredEnv("API_URL"),
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
