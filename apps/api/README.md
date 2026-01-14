# QuickPreview API Gateway

NestJS 기반 API Gateway 서비스

## 기술 스택

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Validation**: class-validator, class-transformer
- **HTTP Client**: Axios
- **Caching**: @nestjs/cache-manager (In-Memory LRU)
- **Rate Limiting**: @nestjs/throttler

## 주요 기능

- YouTube 메타데이터 조회 (캐싱 1시간)
- 자막 추출 (캐싱 24시간)
- AI 서비스 오케스트레이션 (Circuit Breaker)
- Rate Limiting
- 구조화된 JSON 로깅

## API 엔드포인트

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | /api/v1/health | 헬스체크 | - |
| GET | /api/v1/youtube/metadata/:videoId | 메타데이터 조회 | 60/min |
| GET | /api/v1/transcript/:videoId | 자막 조회 | 30/min |
| POST | /api/v1/analysis | 영상 분석 요청 | 10/min |

## 개발 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 개발 서버
npm run start:dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start:prod
```

## 환경변수

```env
# 서버 설정
PORT=4000
NODE_ENV=development

# AI 서비스 연결
AI_SERVICE_URL=http://localhost:5000
INTERNAL_API_KEY=your-32-char-random-string-here

# 외부 API
YOUTUBE_API_KEY=your-youtube-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60

# 로깅
LOG_LEVEL=info
```

## 프로젝트 구조

```
src/
├── main.ts                 # 앱 엔트리포인트
├── app.module.ts           # 루트 모듈
├── common/
│   ├── config/             # 환경설정
│   ├── dto/                # 공통 DTO
│   ├── filters/            # Exception Filters
│   └── interceptors/       # Interceptors (로깅, 타임아웃)
├── modules/
│   ├── health/             # 헬스체크
│   ├── youtube/            # YouTube 메타데이터
│   ├── transcript/         # 자막 서비스
│   └── analysis/           # 분석 오케스트레이션
└── services/
    └── ai-client.service.ts  # AI 서비스 클라이언트 (Circuit Breaker)
```

## Circuit Breaker

AI 서비스 장애 시 자동으로 Fallback:

| 설정 | 값 |
|------|-----|
| Failure Threshold | 5회 연속 실패 |
| Recovery Timeout | 30초 |
| Half-Open Requests | 3회 |

## Docker

```bash
# 빌드
docker build -t quickpreview-api .

# 실행
docker run -p 4000:4000 --env-file .env quickpreview-api
```
