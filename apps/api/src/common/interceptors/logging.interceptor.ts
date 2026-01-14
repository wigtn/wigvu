import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate or use existing request ID
    const requestId =
      (request.headers['x-request-id'] as string) || `req_${uuidv4()}`;
    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-ID', requestId);

    const { method, url, body } = request;
    const startTime = Date.now();

    // Log request
    const logData = {
      level: 'info',
      timestamp: new Date().toISOString(),
      service: 'api',
      requestId,
      method,
      path: url,
      body: this.sanitizeBody(body),
    };

    this.logger.log(JSON.stringify({ ...logData, message: 'Request started' }));

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            JSON.stringify({
              ...logData,
              statusCode,
              duration,
              message: 'Request completed',
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            JSON.stringify({
              ...logData,
              level: 'error',
              statusCode,
              duration,
              error: error.message,
              message: 'Request failed',
            }),
          );
        },
      }),
    );
  }

  private sanitizeBody(
    body: Record<string, unknown>,
  ): Record<string, unknown> | string {
    if (!body || Object.keys(body).length === 0) {
      return {};
    }

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Truncate large bodies
    const stringified = JSON.stringify(sanitized);
    if (stringified.length > 1000) {
      return '[BODY TOO LARGE]';
    }

    return sanitized;
  }
}
