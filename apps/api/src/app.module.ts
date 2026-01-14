import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import configuration from './common/config/configuration';
import { HealthModule } from './modules/health/health.module';
import { YoutubeModule } from './modules/youtube/youtube.module';
import { TranscriptModule } from './modules/transcript/transcript.module';
import { AnalysisModule } from './modules/analysis/analysis.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 60,
      },
    ]),

    // In-Memory Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000, // 1 hour default
      max: 100, // Max items in cache
    }),

    // Feature Modules
    HealthModule,
    YoutubeModule,
    TranscriptModule,
    AnalysisModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
