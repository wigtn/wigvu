import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(timeoutMs = 120000) {
    this.timeoutMs = timeoutMs;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const isAnalysisEndpoint = request.url?.includes('/analysis');

    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          const message = isAnalysisEndpoint
            ? '영상 분석 처리 시간이 초과되었습니다. 영상이 길거나 서버가 바쁠 수 있습니다. 잠시 후 다시 시도하거나 더 짧은 영상을 이용해주세요.'
            : `요청 처리 시간이 초과되었습니다. (${Math.round(this.timeoutMs / 1000)}초)`;

          return throwError(
            () =>
              new RequestTimeoutException({
                code: 'PROCESSING_TIMEOUT',
                message,
              }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
