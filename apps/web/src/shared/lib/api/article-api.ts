import { apiClient, apiClientJson } from './client';

export function analyzeArticleStream(params: { url?: string; text?: string; title?: string }, signal?: AbortSignal) {
  return apiClient('/api/v1/article/analyze', {
    method: 'POST',
    body: JSON.stringify(params),
    signal,
  });
}

export function parseSentence(sentence: string, context?: string) {
  return apiClientJson('/api/v1/article/parse-sentence', {
    method: 'POST',
    body: JSON.stringify({ sentence, context }),
  });
}

export function lookupWord(word: string, sentence: string) {
  return apiClientJson('/api/v1/article/word-lookup', {
    method: 'POST',
    body: JSON.stringify({ word, sentence }),
  });
}
