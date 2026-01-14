# Service Separation Refactoring PRD

> **Version**: 1.1
> **Created**: 2026-01-14
> **Updated**: 2026-01-14
> **Status**: Draft

## 1. Overview

### 1.1 Problem Statement

현재 `apps/web`은 Next.js API Routes를 사용한 서버리스 모놀리식 구조로, 프론트엔드와 백엔드 로직이 혼재되어 있음:

**현재 문제점:**
- 프론트엔드 코드와 백엔드 서비스가 동일 패키지에 위치
- AI 관련 무거운 작업(STT, 번역)이 Next.js 서버리스 함수에서 실행
- 독립적인 스케일링 불가능
- 서비스 간 책임 경계 불명확
- 테스트 및 배포 복잡도 증가

### 1.2 Goals

- **서비스 분리**: Frontend / API Gateway / AI Backend 3-tier 아키텍처로 전환
- **책임 분리**: 각 서비스의 역할과 책임을 명확히 정의
- **독립 배포**: 각 서비스를 독립적으로 배포/스케일링 가능하게 구성
- **API 표준화**: 서비스 간 통신을 위한 명확한 API 계약 정의
- **장애 격리**: 서비스 간 장애가 전파되지 않도록 설계

### 1.3 Non-Goals (Out of Scope)

- 데이터베이스 도입 (Phase 2에서 검토)
- 사용자 인증/인가 시스템 (Phase 2에서 검토)
- Kubernetes 배포 (Docker Compose로 시작)

### 1.4 Scope

| 포함 | 제외 |
|------|------|
| 서비스 코드 분리 | DB 스키마 설계 |
| API 인터페이스 정의 | 사용자 인증/인가 구현 |
| Docker 설정 업데이트 | CI/CD 파이프라인 |
| 로컬 개발 환경 구성 | 프로덕션 인프라 |
| 서비스 간 통신 보안 | 외부 접근 인증 |

---

## 2. Current Architecture Analysis

### 2.1 현재 구조 (Serverless Monolith)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.ts    ← API 엔드포인트 (모든 로직 집중)
│   │   └── page.tsx                ← 프론트엔드
│   ├── components/                 ← React 컴포넌트
│   ├── hooks/                      ← Custom Hooks
│   ├── lib/
│   │   ├── services/
│   │   │   ├── ai-analysis.ts      ← OpenAI 분석 (AI)
│   │   │   ├── transcript.ts       ← 자막 추출 (API)
│   │   │   ├── translation.ts      ← OpenAI 번역 (AI)
│   │   │   └── youtube-metadata.ts ← YouTube API (API)
│   │   ├── stt.ts                  ← WhisperX 호출 (AI)
│   │   └── youtube-audio.ts        ← yt-dlp 오디오 (AI)
│   └── types/
```

### 2.2 현재 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                    apps/web (Monolith)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Browser] → [Next.js API Route: /api/analyze]              │
│                        │                                    │
│         ┌──────────────┼──────────────┐                     │
│         ▼              ▼              ▼                     │
│   [YouTube API]  [YouTube Caption] [WhisperX]               │
│         │              │              │                     │
│         ▼              ▼              ▼                     │
│   [Metadata]     [Transcript]    [STT Result]               │
│         │              │              │                     │
│         └──────────────┼──────────────┘                     │
│                        ▼                                    │
│              [OpenAI Translation]                           │
│                        │                                    │
│                        ▼                                    │
│              [OpenAI AI Analysis]                           │
│                        │                                    │
│                        ▼                                    │
│                   [Response]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 서비스별 책임 분류

| 서비스 | 현재 위치 | 대상 서비스 | 이유 |
|--------|----------|------------|------|
| YouTube Metadata | `lib/services/youtube-metadata.ts` | **apps/api** | 외부 API 호출, 캐싱 가능 |
| Transcript 추출 | `lib/services/transcript.ts` | **apps/api** | 외부 API 호출, 캐싱 가능 |
| OpenAI 번역 | `lib/services/translation.ts` | **apps/ai** | AI 작업, GPU 활용 가능 |
| OpenAI 분석 | `lib/services/ai-analysis.ts` | **apps/ai** | AI 작업, GPU 활용 가능 |
| WhisperX STT | `lib/stt.ts` | **apps/ai** | AI 작업, 무거운 연산 |
| Audio Download | `lib/youtube-audio.ts` | **apps/ai** | STT 전처리, 파일 I/O |

---

## 3. Target Architecture

### 3.1 목표 구조 (3-Tier Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                               │
│                      (Browser)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    apps/web (Frontend)                       │
│                      Port: 3000                              │
├─────────────────────────────────────────────────────────────┤
│  - React Components                                          │
│  - Custom Hooks                                              │
│  - UI State Management                                       │
│  - API Client (→ apps/api)                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   apps/api (API Gateway)                     │
│                      Port: 4000                              │
├─────────────────────────────────────────────────────────────┤
│  - REST API Endpoints                                        │
│  - Request Validation (Zod)                                  │
│  - Rate Limiting                                             │
│  - Response Caching (In-Memory)                              │
│  - YouTube Metadata Service                                  │
│  - Transcript Service                                        │
│  - Orchestration (→ apps/ai)                                 │
│  - Circuit Breaker Pattern                                   │
└────────────────────────┬────────────────────────────────────┘
                         │ (Internal API Key)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    apps/ai (AI Backend)                      │
│                      Port: 5000                              │
├─────────────────────────────────────────────────────────────┤
│  - Translation Service (OpenAI)                              │
│  - AI Analysis Service (OpenAI)                              │
│  - STT Service (WhisperX)                                    │
│  - Audio Download (yt-dlp)                                   │
│  - GPU Support (Optional)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 목표 폴더 구조

```
quickpreview/
├── apps/
│   ├── web/                        # Frontend (Next.js)
│   │   ├── src/
│   │   │   ├── app/                # Pages only (no API routes)
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts   # API Gateway 클라이언트
│   │   │   │   └── utils.ts
│   │   │   └── types/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── api/                        # API Gateway (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── analysis/       # /api/v1/analysis
│   │   │   │   ├── youtube/        # YouTube 메타데이터
│   │   │   │   └── transcript/     # 자막 서비스
│   │   │   ├── common/
│   │   │   │   ├── guards/         # API Key Guard
│   │   │   │   ├── interceptors/   # Logging, Timeout
│   │   │   │   └── filters/        # Exception Filter
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── ai/                         # AI Backend (FastAPI)
│       ├── app/
│       │   ├── api/
│       │   │   ├── translation.py  # /api/v1/translate
│       │   │   ├── analysis.py     # /api/v1/analyze
│       │   │   ├── stt.py          # /api/v1/stt
│       │   │   └── health.py       # /health
│       │   ├── services/
│       │   │   ├── openai_service.py
│       │   │   ├── whisperx_service.py
│       │   │   └── audio_service.py
│       │   ├── middleware/
│       │   │   └── api_key.py      # API Key 검증
│       │   └── main.py
│       ├── Dockerfile
│       └── requirements.txt
│
├── packages/                       # 공유 패키지 (선택적)
│   └── types/                      # 공통 타입 정의
│       ├── analysis.ts
│       └── package.json
│
├── docker-compose.yml
├── docker-compose.dev.yml          # 개발 환경용
└── docs/prd/
```

### 3.3 서비스 간 통신 장애 처리

| 시나리오 | 처리 방안 | 응답 |
|----------|----------|------|
| apps/ai 전체 장애 | 번역 없이 원본 자막 반환 | `transcriptSource: "youtube"`, `isTranslated: false` |
| apps/ai 타임아웃 | 30초 후 fallback 응답 | 부분 결과 + 에러 정보 |
| 번역만 실패 | 원본 자막으로 분석 진행 | `translationError: true` |
| STT 실패 | 메타데이터만으로 분석 | `transcriptSource: "none"` |

**Circuit Breaker 설정:**
```
- Failure Threshold: 5회 연속 실패
- Recovery Timeout: 30초
- Half-Open Requests: 3회
```

### 3.4 Docker 네트워크 구성

```yaml
networks:
  quickpreview-internal:
    driver: bridge
    internal: true    # 외부 접근 차단
  quickpreview-external:
    driver: bridge
```

| 서비스 | 네트워크 | 외부 노출 |
|--------|----------|----------|
| apps/web | external | O (3000) |
| apps/api | external, internal | O (4000) |
| apps/ai | internal | X |

---

## 4. API Specifications

### 4.1 공통 사항

#### 4.1.1 Health Check (모든 서비스)

```
GET /health

Response 200 OK:
{
  "status": "healthy",
  "service": "api | ai | web",
  "version": "1.0.0",
  "timestamp": "2026-01-14T00:00:00Z",
  "uptime": 3600
}

Response 503 Service Unavailable:
{
  "status": "unhealthy",
  "error": "Database connection failed"
}
```

#### 4.1.2 에러 응답 형식 (공통)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      {
        "field": "url",
        "message": "Invalid YouTube URL format"
      }
    ]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-14T00:00:00Z"
  }
}
```

#### 4.1.3 Rate Limiting 정책

| 엔드포인트 | 제한 | 윈도우 | 초과 시 |
|-----------|------|--------|---------|
| POST /api/v1/analysis | 10 req | 1분 | 429 Too Many Requests |
| GET /api/v1/youtube/* | 60 req | 1분 | 429 Too Many Requests |
| GET /api/v1/transcript/* | 30 req | 1분 | 429 Too Many Requests |
| POST /api/v1/translate | 20 req | 1분 | 429 Too Many Requests |
| POST /api/v1/stt | 5 req | 1분 | 429 Too Many Requests |

**Rate Limit 응답 헤더:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705190400
```

#### 4.1.4 요청 제한

| 서비스 | 항목 | 제한 |
|--------|------|------|
| Translation | segments 수 | 최대 500개 |
| Translation | segment text | 최대 1,000자 |
| STT | audio 파일 | 최대 50MB |
| STT | 영상 길이 | 최대 20분 |
| Analysis | transcript | 최대 50,000자 |
| All | 요청 타임아웃 | 120초 |

#### 4.1.5 내부 서비스 인증

**apps/api → apps/ai 통신:**
```
Header: X-Internal-API-Key: ${INTERNAL_API_KEY}
```

- apps/ai는 `X-Internal-API-Key` 헤더 필수
- 유효하지 않은 키: 401 Unauthorized
- 환경변수: `INTERNAL_API_KEY` (32자 이상 랜덤 문자열)

---

### 4.2 apps/api Endpoints

#### `POST /api/v1/analysis`

**Description**: 영상 분석 요청 (오케스트레이션)

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | application/json |
| X-Request-ID | No | 요청 추적 ID (자동 생성) |

**Request Body**:
```json
{
  "url": "string (required) - YouTube URL",
  "language": "string (optional) - 언어 코드, default: auto",
  "skipTranslation": "boolean (optional) - 번역 스킵, default: false"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "string - 분석 ID",
    "videoId": "string - YouTube 비디오 ID",
    "title": "string",
    "channelName": "string",
    "duration": "number - 초",
    "viewCount": "number",
    "summary": "string",
    "watchScore": "number (1-10)",
    "watchScoreReason": "string",
    "keywords": ["string"],
    "highlights": [
      {
        "timestamp": "number - 초",
        "title": "string",
        "description": "string"
      }
    ],
    "transcriptSegments": [
      {
        "start": "number",
        "end": "number",
        "text": "string",
        "originalText": "string",
        "translatedText": "string"
      }
    ],
    "transcriptSource": "youtube | stt | none",
    "isKorean": "boolean",
    "isTranslated": "boolean",
    "analyzedAt": "string (ISO 8601)"
  },
  "meta": {
    "requestId": "string",
    "processingTime": "number (ms)",
    "timestamp": "string (ISO 8601)"
  }
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_URL | 잘못된 YouTube URL |
| 400 | INVALID_REQUEST | 요청 본문 유효성 검사 실패 |
| 404 | VIDEO_NOT_FOUND | 영상을 찾을 수 없음 |
| 429 | RATE_LIMIT_EXCEEDED | Rate Limit 초과 |
| 500 | INTERNAL_ERROR | 서버 오류 |
| 502 | AI_SERVICE_ERROR | AI 서비스 통신 오류 |
| 504 | TIMEOUT | 요청 타임아웃 |

---

#### `GET /api/v1/youtube/metadata/:videoId`

**Description**: YouTube 영상 메타데이터 조회 (캐시 1시간)

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "videoId": "string",
    "title": "string",
    "channelName": "string",
    "channelId": "string",
    "publishedAt": "string (ISO 8601)",
    "duration": "number",
    "viewCount": "number",
    "likeCount": "number",
    "thumbnailUrl": "string",
    "description": "string"
  },
  "meta": {
    "cached": "boolean",
    "cacheExpires": "string (ISO 8601)"
  }
}
```

---

#### `GET /api/v1/transcript/:videoId`

**Description**: 영상 자막 조회 (캐시 24시간)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| language | string | No | auto | 언어 코드 |
| useStt | boolean | No | true | STT fallback 사용 여부 |

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "source": "youtube | stt | none",
    "language": "string",
    "isKorean": "boolean",
    "segments": [
      {
        "start": "number",
        "end": "number",
        "text": "string"
      }
    ]
  },
  "meta": {
    "cached": "boolean",
    "segmentCount": "number"
  }
}
```

---

### 4.3 apps/ai Endpoints

> **인증**: 모든 엔드포인트는 `X-Internal-API-Key` 헤더 필수

#### `POST /api/v1/translate`

**Description**: 텍스트 배치 번역

**Request Body**:
```json
{
  "segments": [
    {
      "start": "number",
      "end": "number",
      "text": "string (max 1000 chars)"
    }
  ],
  "sourceLanguage": "string (optional) - default: en",
  "targetLanguage": "string (optional) - default: ko"
}
```

**Constraints**:
- `segments`: 최대 500개
- `segments[].text`: 최대 1,000자
- 타임아웃: 60초

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "segments": [
      {
        "start": "number",
        "end": "number",
        "originalText": "string",
        "translatedText": "string"
      }
    ]
  },
  "meta": {
    "translatedCount": "number",
    "processingTime": "number (ms)"
  }
}
```

**Error Responses**:
| Status | Code | Description |
|--------|------|-------------|
| 400 | SEGMENTS_LIMIT_EXCEEDED | 500개 초과 |
| 400 | TEXT_TOO_LONG | 텍스트 1000자 초과 |
| 401 | UNAUTHORIZED | API Key 누락/유효하지 않음 |
| 500 | OPENAI_ERROR | OpenAI API 오류 |

---

#### `POST /api/v1/analyze`

**Description**: AI 영상 분석

**Request Body**:
```json
{
  "metadata": {
    "title": "string",
    "channelName": "string",
    "description": "string (max 2000 chars)"
  },
  "transcript": "string (optional, max 50000 chars)",
  "segments": [
    {
      "start": "number",
      "end": "number",
      "text": "string"
    }
  ]
}
```

**Constraints**:
- `transcript`: 최대 50,000자
- 타임아웃: 30초

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "summary": "string",
    "watchScore": "number (1-10)",
    "watchScoreReason": "string",
    "keywords": ["string"],
    "highlights": [
      {
        "timestamp": "number",
        "title": "string",
        "description": "string"
      }
    ]
  }
}
```

---

#### `POST /api/v1/stt`

**Description**: Speech-to-Text 변환

**Request**: `multipart/form-data`
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| audio | file | Yes | max 50MB | 오디오 파일 |
| language | string | No | - | 언어 코드 (default: auto) |

**Constraints**:
- 파일 크기: 최대 50MB
- 지원 형식: webm, mp3, wav, m4a
- 타임아웃: 120초

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "text": "string",
    "language": "string",
    "languageProbability": "number (0-1)",
    "segments": [
      {
        "start": "number",
        "end": "number",
        "text": "string"
      }
    ]
  },
  "meta": {
    "audioDuration": "number (seconds)",
    "processingTime": "number (ms)"
  }
}
```

---

#### `POST /api/v1/audio/download`

**Description**: YouTube 오디오 다운로드

**Request Body**:
```json
{
  "videoId": "string (required) - YouTube 비디오 ID"
}
```

**Constraints**:
- 영상 길이: 최대 20분
- 타임아웃: 60초

**Response 200 OK**:
```
Content-Type: audio/webm
Content-Length: {bytes}
X-Audio-Duration: {seconds}
```

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Target | Service | 측정 방법 |
|--------|--------|---------|----------|
| API Response Time (p95) | < 500ms | apps/api | k6 부하 테스트 |
| Translation (100 segments) | < 10s | apps/ai | 단위 테스트 |
| STT (10min audio) | < 60s | apps/ai | 단위 테스트 |
| Time to First Byte | < 100ms | apps/api | Lighthouse |

### 5.2 Reliability

- 각 서비스 독립적 재시작 가능
- 서비스 간 통신 실패 시 graceful degradation
- Circuit Breaker로 장애 전파 방지
- Health Check 실패 시 자동 재시작 (Docker restart policy)

### 5.3 Scalability

- 각 서비스 독립적 수평 확장 가능
- apps/ai는 GPU 노드에 배치 가능
- Stateless 설계로 인스턴스 추가 용이

### 5.4 Observability

#### 로깅 전략
```json
{
  "level": "info",
  "timestamp": "2026-01-14T00:00:00Z",
  "service": "api",
  "requestId": "req_abc123",
  "method": "POST",
  "path": "/api/v1/analysis",
  "statusCode": 200,
  "duration": 1234,
  "message": "Request completed"
}
```

- 로그 레벨: error, warn, info, debug
- 상관관계 ID: `X-Request-ID` 헤더 전파
- 로그 포맷: 구조화된 JSON

#### 메트릭 (선택적)
- Prometheus 엔드포인트: `GET /metrics`
- 주요 메트릭:
  - `http_requests_total`
  - `http_request_duration_seconds`
  - `ai_service_errors_total`

### 5.5 캐싱 전략

| 데이터 | TTL | 저장소 | 캐시 키 |
|--------|-----|--------|---------|
| YouTube 메타데이터 | 1시간 | In-Memory (LRU) | `yt:meta:{videoId}` |
| 자막 (YouTube) | 24시간 | In-Memory (LRU) | `yt:transcript:{videoId}:{lang}` |
| 분석 결과 | 7일 | Redis (Phase 2) | `analysis:{videoId}:{lang}` |

**캐시 무효화:**
- 메타데이터: 조회수 등 변경될 수 있으므로 1시간
- 자막: 거의 변경되지 않으므로 24시간
- 분석 결과: 동일 영상 재분석 방지

---

## 6. Environment Variables

### 6.1 apps/web
```env
# API Gateway 연결
API_BASE_URL=http://localhost:4000

# 개발 환경
NODE_ENV=development
```

### 6.2 apps/api
```env
# 서버 설정
PORT=4000
NODE_ENV=development

# AI 서비스 연결
AI_SERVICE_URL=http://ai:5000
INTERNAL_API_KEY=your-32-char-random-string-here

# 외부 API
YOUTUBE_API_KEY=your-youtube-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60

# 로깅
LOG_LEVEL=info
```

### 6.3 apps/ai
```env
# 서버 설정
PORT=5000

# 내부 인증
INTERNAL_API_KEY=your-32-char-random-string-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# WhisperX
WHISPERX_MODEL=large-v3
DEVICE=cpu  # or cuda

# 제한
MAX_AUDIO_SIZE_MB=50
MAX_SEGMENTS=500
STT_TIMEOUT_SECONDS=120
```

---

## 7. Implementation Phases

### Phase 1: API Gateway 구축 (apps/api)

**목표**: apps/api에 NestJS 기반 API Gateway 구축

**Tasks**:
- [ ] NestJS 프로젝트 초기화
- [ ] 공통 모듈 구현 (로깅, 에러 핸들링, Rate Limiting)
- [ ] Health Check 엔드포인트 구현
- [ ] YouTube 모듈 구현 (메타데이터 + 캐싱)
- [ ] Transcript 모듈 구현 (자막 추출 + 캐싱)
- [ ] Analysis 모듈 구현 (오케스트레이션)
- [ ] AI Service Client 구현 (Circuit Breaker 포함)
- [ ] Docker 설정 업데이트
- [ ] 단위 테스트 작성 (Coverage 70%+)

**완료 기준**:
- `npm run test` 통과
- `npm run build` 성공
- Docker 컨테이너 정상 실행
- Health Check 응답 정상

**Dependencies**: None

---

### Phase 2: AI Backend 구축 (apps/ai)

**목표**: apps/ai에 FastAPI 기반 AI 서비스 구축

**Tasks**:
- [ ] FastAPI 프로젝트 초기화
- [ ] API Key 미들웨어 구현
- [ ] Health Check 엔드포인트 구현
- [ ] Translation 엔드포인트 구현
- [ ] Analysis 엔드포인트 구현
- [ ] STT 엔드포인트 구현
- [ ] Audio Download 엔드포인트 구현
- [ ] 요청 제한 (크기, 타임아웃) 구현
- [ ] Docker 설정 업데이트
- [ ] 단위 테스트 작성

**완료 기준**:
- `pytest` 통과
- Docker 컨테이너 정상 실행
- apps/api → apps/ai 통신 정상

**Dependencies**: Phase 1 완료

---

### Phase 3: Frontend 분리 (apps/web)

**목표**: apps/web에서 백엔드 로직 제거, API Client로 대체

**Tasks**:
- [ ] API Client 구현 (`lib/api-client.ts`)
- [ ] TanStack Query 설정 (캐싱, 에러 처리)
- [ ] API Route 제거 (`app/api/` 삭제)
- [ ] 백엔드 서비스 코드 제거 (`lib/services/` 삭제)
- [ ] 환경변수 정리 (API_BASE_URL만 유지)
- [ ] 에러 UI 개선 (AI 서비스 장애 시)
- [ ] Docker 설정 업데이트

**완료 기준**:
- apps/web에 서버 사이드 로직 없음
- 모든 API 호출이 apps/api 경유
- 기존 기능 100% 동작

**Dependencies**: Phase 1, 2 완료

---

### Phase 4: 통합 테스트 및 최적화

**목표**: 전체 시스템 통합 검증

**Tasks**:
- [ ] E2E 테스트 작성 (Playwright)
- [ ] 성능 테스트 (k6)
- [ ] 장애 시나리오 테스트
- [ ] docker-compose 최적화
- [ ] 문서 업데이트
- [ ] README 작성

**완료 기준**:
- E2E 테스트 통과
- 성능 목표 달성 (p95 < 500ms)
- 장애 복구 정상 동작

**Dependencies**: Phase 3 완료

---

## 8. Migration Strategy

### 8.1 점진적 마이그레이션

```
Week 1-2: Phase 1 (API Gateway)
├── apps/api 구축
├── 기존 apps/web API Route 유지
└── Feature Flag: USE_NEW_API=false

Week 3-4: Phase 2 (AI Backend)
├── apps/ai 구축
├── apps/api → apps/ai 연동
└── 내부 테스트

Week 5: Phase 3 (Frontend 전환)
├── Feature Flag: USE_NEW_API=true
├── apps/web → apps/api 전환
└── 모니터링

Week 6: Phase 4 (정리)
├── 기존 API Route 제거
├── E2E 테스트
└── 문서화
```

### 8.2 Feature Flag 전환

```typescript
// apps/web/lib/api-client.ts
const USE_NEW_API = process.env.USE_NEW_API === 'true';

export async function analyzeVideo(url: string) {
  if (USE_NEW_API) {
    return fetch(`${API_BASE_URL}/api/v1/analysis`, { ... });
  } else {
    return fetch('/api/analyze', { ... });  // 기존 방식
  }
}
```

### 8.3 Rollback Plan

- 각 Phase 완료 시 git tag 생성: `v1.1.0-phase1`, `v1.1.0-phase2`, ...
- Feature Flag로 즉시 롤백 가능
- docker-compose로 빠른 서비스 교체 가능

---

## 9. Technical Stack

### apps/api (API Gateway)
| Category | Technology | Version |
|----------|------------|---------|
| Framework | NestJS | 10.x |
| Language | TypeScript | 5.x |
| Validation | class-validator, Zod | - |
| HTTP Client | axios | 1.x |
| Logging | nestjs-pino | - |
| Caching | @nestjs/cache-manager | - |
| Testing | Jest | - |

### apps/ai (AI Backend)
| Category | Technology | Version |
|----------|------------|---------|
| Framework | FastAPI | 0.100+ |
| Language | Python | 3.11 |
| AI/ML | OpenAI SDK | 1.x |
| STT | WhisperX | - |
| Audio | yt-dlp, ffmpeg | - |
| Validation | Pydantic | 2.x |
| Testing | pytest | - |

### apps/web (Frontend)
| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 16.x |
| Language | TypeScript | 5.x |
| UI | React, Tailwind CSS | 19.x, 4.x |
| HTTP Client | TanStack Query | 5.x |
| Testing | Playwright | - |

---

## 10. Local Development Guide

### 10.1 사전 요구사항

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- ffmpeg (STT용)

### 10.2 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/wigtn/wigtn-quickpreview.git
cd wigtn-quickpreview

# 2. 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 3. 서비스별 의존성 설치
cd apps/web && npm install
cd ../api && npm install
cd ../ai && pip install -r requirements.txt

# 4. 개발 서버 실행 (각각 별도 터미널)
# Terminal 1: Frontend
cd apps/web && npm run dev

# Terminal 2: API Gateway
cd apps/api && npm run start:dev

# Terminal 3: AI Backend
cd apps/ai && uvicorn app.main:app --reload --port 5000
```

### 10.3 Docker로 전체 실행

```bash
# 개발 환경
docker-compose -f docker-compose.dev.yml up

# 프로덕션 환경
docker-compose up -d
```

---

## 11. Functional Requirements

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-001 | apps/api는 NestJS 기반으로 구축 | P0 | 1 |
| FR-002 | apps/api는 YouTube 메타데이터 조회 기능 제공 (캐싱 포함) | P0 | 1 |
| FR-003 | apps/api는 자막 추출 기능 제공 (캐싱 포함) | P0 | 1 |
| FR-004 | apps/api는 apps/ai 호출하여 번역/분석 수행 | P0 | 1 |
| FR-005 | apps/api는 Circuit Breaker로 장애 격리 | P0 | 1 |
| FR-006 | apps/api는 Rate Limiting 적용 | P0 | 1 |
| FR-007 | apps/ai는 FastAPI 기반으로 구축 | P0 | 2 |
| FR-008 | apps/ai는 배치 번역 API 제공 | P0 | 2 |
| FR-009 | apps/ai는 AI 분석 API 제공 | P0 | 2 |
| FR-010 | apps/ai는 STT API 제공 | P1 | 2 |
| FR-011 | apps/ai는 내부 API Key 인증 적용 | P0 | 2 |
| FR-012 | apps/ai는 요청 크기/타임아웃 제한 적용 | P0 | 2 |
| FR-013 | apps/web은 API Client로 apps/api 호출 | P0 | 3 |
| FR-014 | apps/web에서 백엔드 코드 완전 제거 | P0 | 3 |
| FR-015 | 모든 서비스는 Health Check 엔드포인트 제공 | P0 | 1,2 |
| FR-016 | 모든 서비스는 구조화된 JSON 로깅 | P1 | 1,2 |
| FR-017 | 요청 추적을 위한 X-Request-ID 전파 | P1 | 1,2 |

---

## 12. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 서비스 분리 완료 | 3개 독립 서비스 | 코드 리뷰 |
| API 응답 시간 | < 500ms (p95) | k6 부하 테스트 |
| 독립 배포 가능 | 각 서비스 개별 배포 | 배포 테스트 |
| 기존 기능 유지 | 100% | E2E 테스트 |
| 테스트 커버리지 | 70%+ | Jest/pytest |
| 장애 격리 | AI 장애 시 부분 응답 | 장애 시뮬레이션 |

---

## 13. Risk Matrix

| 리스크 | 발생 확률 | 영향도 | 대응 방안 |
|--------|----------|--------|----------|
| apps/ai 장애로 전체 서비스 영향 | 중 | 고 | Circuit Breaker, Fallback 응답 |
| 내부 API 무단 접근 | 하 | 고 | API Key 인증, 내부 네트워크 분리 |
| 서비스 간 네트워크 지연 | 중 | 중 | 타임아웃 설정, 재시도 로직, 캐싱 |
| 대용량 요청으로 리소스 고갈 | 중 | 고 | 요청 크기 제한, Rate Limiting |
| 배포 중 다운타임 | 중 | 중 | Feature Flag, Rolling Update |
| OpenAI API 비용 급증 | 중 | 중 | 캐싱, 요청 제한, 모니터링 |

---

## 14. 다음 단계

✅ PRD v1.1 문서가 완성되었습니다.

```
┌─────────────────────────────────────────────────────────────┐
│  📋 PRD v1.1 업데이트 완료                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  반영된 이슈:                                                │
│  - Critical: 5건 (서비스 통신, 인증, Rate Limiting 등)       │
│  - Major: 8건 (로깅, 캐싱, 테스트 전략 등)                   │
│  - Minor: 4건 (폴더 구조, Docker 네트워크 등)                │
│                                                             │
│  구현을 시작하려면:                                          │
│  → "/implement Phase 1" (API Gateway 구축)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
