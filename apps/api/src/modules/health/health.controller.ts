import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
}

@Controller()
export class HealthController {
  private readonly startTime = Date.now();

  @Get('/health')
  @SkipThrottle()
  getHealth(): HealthResponse {
    return {
      status: 'healthy',
      service: 'api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
