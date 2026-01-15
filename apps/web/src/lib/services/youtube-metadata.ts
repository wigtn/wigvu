/**
 * YouTube 비디오 메타데이터 조회 (NestJS API Gateway 경유)
 */

import { getEnvConfig } from "@/lib/config/env";
import { createLogger } from "@/lib/logger";

const logger = createLogger("YouTubeMetadata");

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

interface MetadataApiResponse {
  success: boolean;
  data?: VideoMetadata;
  meta?: {
    cached: boolean;
    cacheExpires?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * NestJS API Gateway를 통해 YouTube 메타데이터 조회
 */
export async function fetchVideoMetadata(
  videoId: string
): Promise<VideoMetadata> {
  const config = getEnvConfig();

  if (!config.API_URL) {
    throw new Error("API_URL is not configured");
  }

  logger.debug("메타데이터 요청", { videoId });

  const response = await fetch(
    `${config.API_URL}/api/v1/youtube/metadata/${videoId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const result: MetadataApiResponse = await response.json();

  if (!response.ok || !result.success || !result.data) {
    const errorCode = result.error?.code || "UNKNOWN_ERROR";
    const errorMsg = result.error?.message || `API error: ${response.status}`;

    logger.error("메타데이터 조회 실패", {
      videoId,
      status: response.status,
      error: result.error,
    });

    if (errorCode === "VIDEO_NOT_FOUND") {
      throw new Error("VIDEO_NOT_FOUND");
    }
    throw new Error(errorMsg);
  }

  logger.debug("메타데이터 조회 성공", {
    videoId,
    cached: result.meta?.cached,
  });

  return result.data;
}
