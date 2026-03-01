import { apiClient } from './client';

export function analyzeVideoStream(url: string, language = 'auto', signal?: AbortSignal) {
  return apiClient('/api/v1/video/analyze', {
    method: 'POST',
    body: JSON.stringify({ url, language }),
    signal,
  });
}
