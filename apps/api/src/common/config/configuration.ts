export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  environment: process.env.NODE_ENV || 'development',

  // AI Service
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',
  internalApiKey: process.env.INTERNAL_API_KEY || '',

  // YouTube
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS || '',

  // STT
  sttMaxDurationMinutes: parseInt(
    process.env.STT_MAX_DURATION_MINUTES || '120',
    10,
  ),
});
