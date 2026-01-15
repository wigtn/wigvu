export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',
    internalApiKey: process.env.INTERNAL_API_KEY || '',
    timeout: parseInt(process.env.AI_TIMEOUT || '30000', 10),
  },

  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
  },

  stt: {
    enabled: process.env.STT_ENABLED !== 'false', // default: true
    maxDurationMinutes: parseInt(process.env.STT_MAX_DURATION_MINUTES || '30', 10),
    audioDownloadTimeout: parseInt(process.env.STT_AUDIO_TIMEOUT || '60000', 10),
    transcribeTimeout: parseInt(process.env.STT_TRANSCRIBE_TIMEOUT || '120000', 10),
  },

  analysis: {
    // 절대 최대 영상 길이 (분). 이를 초과하면 분석 거부
    maxVideoDurationMinutes: parseInt(process.env.MAX_VIDEO_DURATION_MINUTES || '60', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
  },

  cache: {
    metadataTtl: 3600000, // 1 hour
    transcriptTtl: 86400000, // 24 hours
  },

  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 30000,
    halfOpenRequests: 3,
  },
});
