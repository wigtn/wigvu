/**
 * YouTube IFrame API 로더
 * 여러 컴포넌트에서 동시에 호출해도 한 번만 로드되고,
 * 모든 호출자에게 Promise로 완료를 알림
 */

let loadPromise: Promise<typeof window.YT> | null = null;

export function loadYouTubeAPI(): Promise<typeof window.YT> {
  // 이미 로드된 경우
  if (typeof window !== "undefined" && window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }

  // 이미 로딩 중인 경우 기존 Promise 반환
  if (loadPromise) {
    return loadPromise;
  }

  // 새로 로드 시작
  loadPromise = new Promise((resolve) => {
    // 이미 스크립트가 있는지 확인
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (existingScript) {
      // 스크립트는 있지만 아직 로드 안됨 - 콜백 대기
      const checkReady = () => {
        if (window.YT && window.YT.Player) {
          resolve(window.YT);
        } else {
          setTimeout(checkReady, 50);
        }
      };
      checkReady();
      return;
    }

    // 스크립트 삽입
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    // 기존 콜백 보존
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      // 기존 콜백 실행
      if (previousCallback) {
        previousCallback();
      }
      resolve(window.YT);
    };

    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  });

  return loadPromise;
}
