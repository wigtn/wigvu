"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TranscriptSegment } from "@/types/analysis";
import { YTPlayer, YT_PLAYER_STATE } from "@/types/youtube";

interface UseVideoSyncOptions {
  /** 동기화 간격 (ms) */
  syncInterval?: number;
  /** 자동 스크롤 활성화 */
  autoScroll?: boolean;
}

interface UseVideoSyncReturn {
  /** 현재 재생 시간 (초) */
  currentTime: number;
  /** 현재 활성 세그먼트 인덱스 */
  activeSegmentIndex: number;
  /** 재생 중 여부 */
  isPlaying: boolean;
  /** 특정 시간으로 이동 */
  seekTo: (seconds: number) => void;
  /** Player 참조 설정 */
  setPlayer: (player: YTPlayer | null) => void;
  /** 자동 스크롤 토글 */
  toggleAutoScroll: () => void;
  /** 자동 스크롤 상태 */
  autoScrollEnabled: boolean;
}

/**
 * 영상-자막 동기화 훅
 * YouTube IFrame Player와 자막 세그먼트를 동기화합니다.
 */
export function useVideoSync(
  segments: TranscriptSegment[] | undefined,
  options: UseVideoSyncOptions = {}
): UseVideoSyncReturn {
  const { syncInterval = 100, autoScroll = true } = options;

  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(autoScroll);
  const [isPlayerSet, setIsPlayerSet] = useState(false); // player 설정 여부 추적

  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 현재 시간에 해당하는 세그먼트 인덱스 찾기
   */
  const findActiveSegment = useCallback(
    (time: number): number => {
      if (!segments || segments.length === 0) return -1;

      // 이진 검색으로 최적화
      let left = 0;
      let right = segments.length - 1;
      let result = -1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const segment = segments[mid];

        if (time >= segment.start && time < segment.end) {
          return mid;
        } else if (time < segment.start) {
          right = mid - 1;
        } else {
          result = mid; // 이 세그먼트보다 뒤에 있지만, 아직 다음 세그먼트 시작 전
          left = mid + 1;
        }
      }

      // 정확히 일치하는 세그먼트가 없으면 가장 가까운 이전 세그먼트
      return result;
    },
    [segments]
  );

  /**
   * 동기화 업데이트 - activeSegmentIndex를 의존성에서 제거하여 안정화
   */
  const updateSync = useCallback(() => {
    if (!playerRef.current) return;

    try {
      const time = playerRef.current.getCurrentTime();
      const state = playerRef.current.getPlayerState();

      setCurrentTime(time);
      setIsPlaying(state === YT_PLAYER_STATE.PLAYING);

      const newIndex = findActiveSegment(time);
      setActiveSegmentIndex((prev) => (newIndex !== prev ? newIndex : prev));
    } catch {
      // Player가 아직 준비되지 않았을 수 있음
    }
  }, [findActiveSegment]);

  /**
   * 동기화 시작/중지 - isPlayerSet state로 player 설정 감지
   */
  useEffect(() => {
    if (isPlayerSet && playerRef.current) {
      // 기존 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 새 인터벌 시작
      intervalRef.current = setInterval(updateSync, syncInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [syncInterval, updateSync, isPlayerSet]);

  /**
   * 특정 시간으로 이동
   */
  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();
      setCurrentTime(seconds);
    }
  }, []);

  /**
   * Player 참조 설정 - 의존성을 비워서 안정화 (재생성 방지)
   */
  const setPlayer = useCallback((player: YTPlayer | null) => {
    playerRef.current = player;
    setIsPlayerSet(!!player); // state 업데이트로 interval 시작 트리거
  }, []);

  /**
   * 자동 스크롤 토글
   */
  const toggleAutoScroll = useCallback(() => {
    setAutoScrollEnabled((prev) => !prev);
  }, []);

  return {
    currentTime,
    activeSegmentIndex,
    isPlaying,
    seekTo,
    setPlayer,
    toggleAutoScroll,
    autoScrollEnabled,
  };
}
