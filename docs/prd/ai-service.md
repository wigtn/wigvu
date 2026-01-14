# QuickPreview AI Service PRD

> **Version**: 2.1
> **Created**: 2026-01-14
> **Updated**: 2026-01-15
> **Status**: Draft (Reviewed)
> **Project**: QuickPreview AI (apps/ai)

---

## 1. Overview

### 1.1 Problem Statement

현재 QuickPreview 웹 서비스는 다음과 같은 AI 관련 기능이 분산되어 있습니다:

- **STT**: 외부 WhisperX API를 웹에서 직접 호출
- **LLM 분석**: 웹 서버에서 OpenAI API 직접 호출 (`apps/web/src/lib/services/ai-analysis.ts`)

이로 인해:
- AI 관련 로직이 웹 서비스에 혼재
- AI 기능 확장 시 웹 서비스 수정 필요
- AI 서비스 독립적 스케일링 불가

### 1.2 Goals

| 목표 | 설명 |
|------|------|
| **AI 서비스 분리** | AI 관련 기능을 독립 서비스로 분리 |
| **STT 프록시** | 외부 WhisperX API 프록시 (하위 호환) |
| **LLM 분석** | OpenAI 기반 영상 분석 API 제공 |
| **확장 가능** | 향후 AI 기능 추가 용이한 구조 |
| **하위 호환** | 기존 Web 서비스 코드 수정 최소화 |

### 1.3 Non-Goals (Out of Scope)

- 자체 WhisperX 모델 호스팅 (외부 API 사용)
- 실시간 스트리밍 STT
- 자체 LLM 모델 호스팅 (OpenAI API 사용)
- 화자 분리 (Diarization)
- GPU 서버 운영

### 1.4 Scope

| 포함 | 제외 |
|------|------|
| 외부 STT API 프록시 | 자체 WhisperX 호스팅 |
| LLM 영상 분석 | 자체 LLM 호스팅 |
| 헬스체크 API | GPU/CUDA 설정 |
| 하위 호환 엔드포인트 | 실시간 스트리밍 |

---

## 2. User Stories

### 2.1 Primary User

**QuickPreview Web 서비스** - AI 서비스의 주요 소비자

### 2.2 User Stories

#### US-AI-001: 영상 분석
```
As a QuickPreview 웹 서비스
I want to 영상 메타데이터와 자막을 전송하면 AI 분석 결과를 받으면
So that 사용자에게 요약, 점수, 키워드, 하이라이트를 제공할 수 있다
```

#### US-AI-002: 오디오 STT 변환
```
As a QuickPreview 웹 서비스
I want to 오디오 파일을 전송하면 텍스트로 변환받으면
So that 자막이 없는 영상도 자막을 생성할 수 있다
```

#### US-AI-003: 헬스체크
```
As a 시스템 관리자
I want to 서비스 상태를 확인할 수 있으면
So that 장애를 빠르게 감지하고 대응할 수 있다
```

### 2.3 Acceptance Criteria (Gherkin)

#### Scenario: 영상 분석
```gherkin
Scenario: LLM 기반 영상 분석
  Given AI 서비스가 정상 동작 중이다
  When 영상 메타데이터와 자막을 /analyze 엔드포인트로 전송한다
  Then 요약, 시청 점수, 키워드, 하이라이트가 반환된다
  And 모든 응답은 한국어로 제공된다
```

#### Scenario: STT 프록시
```gherkin
Scenario: 외부 STT API 프록시
  Given AI 서비스가 정상 동작 중이다
  When 오디오 파일을 /whisperX/transcribe 엔드포인트로 전송한다
  Then 외부 STT API 결과가 그대로 반환된다
  And 응답 형식이 기존과 동일하다
```

#### Scenario: 에러 처리
```gherkin
Scenario: 외부 API 실패 시 에러 응답
  Given 외부 STT API가 응답하지 않는다
  When 오디오 파일을 /whisperX/transcribe로 전송한다
  Then 503 상태 코드와 에러 메시지가 반환된다
  And 에러 코드가 포함된다
```

---

## 3. Functional Requirements

### 3.1 Core Features

| ID | Requirement | Priority | Dependencies |
|----|-------------|----------|--------------|
| **FR-AI-001** | LLM 기반 영상 분석 | P0 (Must) | OpenAI API |
| **FR-AI-002** | STT 프록시 (외부 API) | P0 (Must) | 외부 STT API |
| **FR-AI-003** | 하위 호환 엔드포인트 | P0 (Must) | FR-AI-002 |
| **FR-AI-004** | 헬스체크 엔드포인트 | P0 (Must) | - |
| **FR-AI-005** | 구조화된 로깅 | P1 (Should) | - |
| **FR-AI-006** | 에러 핸들링 | P0 (Must) | - |
| **FR-AI-007** | 입력값 검증 | P0 (Must) | - |
| **FR-AI-008** | 재시도 로직 | P1 (Should) | - |

### 3.2 Feature Details

#### FR-AI-001: LLM 기반 영상 분석

**입력**:
- 영상 메타데이터 (제목, 채널명, 설명)
- 자막 텍스트 (optional)
- 타임스탬프 세그먼트 (optional)

**출력**:
- 3문장 요약
- 시청 가치 점수 (1-10)
- 점수 근거
- 핵심 키워드 (5-10개)
- 하이라이트 구간 (최대 5개)

**입력 검증**:
| Field | Required | Max Length | Description |
|-------|----------|------------|-------------|
| metadata.title | Yes | 200자 | 영상 제목 |
| metadata.channelName | Yes | 100자 | 채널명 |
| metadata.description | No | 2000자 | 영상 설명 |
| transcript | No | 50000자 | 자막 텍스트 |
| segments | No | 1000개 | 타임스탬프 세그먼트 |

#### FR-AI-002: STT 프록시

**목적**: 외부 WhisperX API (`http://work.soundmind.life:12321`)를 프록시

**제한사항**:
| 항목 | 제한 |
|------|------|
| 최대 오디오 길이 | 120분 |
| 최대 파일 크기 | 500MB |
| 지원 포맷 | webm, mp3, wav, m4a, ogg, flac |

**지원 기능**:
- 자동 언어 감지 (language: "auto")
- 타임스탬프 세그먼트 반환

#### FR-AI-003: 하위 호환 엔드포인트

**목적**: 기존 `apps/web/src/lib/stt.ts` 코드 수정 없이 연동

**구현**:
- `/whisperX/transcribe` → 외부 API 프록시
- 응답 형식 완전 호환 (플랫 구조)

#### FR-AI-007: 입력값 검증

**검증 항목**:
- 필수 필드 존재 여부
- 문자열 길이 제한
- 파일 크기 및 포맷 검증
- 잘못된 입력 시 400 에러 반환

#### FR-AI-008: 재시도 로직

**재시도 정책**:
| 항목 | 값 |
|------|-----|
| 최대 재시도 횟수 | 3회 |
| 백오프 방식 | 지수 백오프 |
| 백오프 간격 | 1초, 2초, 4초 |
| 재시도 대상 | 5xx 에러, 타임아웃 |
| 재시도 제외 | 4xx 에러 |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Notes |
|--------|--------|-------|
| 분석 응답 시간 | < 10초 | OpenAI API 의존 |
| STT 응답 시간 | 외부 API 의존 | 프록시만 수행 |
| 헬스체크 응답 | < 100ms | - |

**타임아웃 설정**:
| 엔드포인트 | 타임아웃 |
|-----------|---------|
| /analyze | 30초 |
| /stt/transcribe | 5분 (300초) |
| /health | 5초 |

### 4.2 Reliability

| 항목 | 목표 |
|------|------|
| 가용성 | 99% (월간) |
| 에러 복구 | 자동 재시작 (Docker) |
| 재시도 | 지수 백오프 (최대 3회) |

### 4.3 Security

| 항목 | 요구사항 |
|------|----------|
| API Key 보호 | 환경변수로 관리 |
| 내부망 전용 | 외부 직접 접근 차단 |
| 입력 검증 | 모든 입력 필드 검증 |
| 파일 검증 | 크기, 포맷 검증 |

### 4.4 Rate Limiting

| 항목 | 제한 |
|------|------|
| /analyze | IP당 분당 30회 |
| /stt/transcribe | IP당 분당 10회 |
| 동시 요청 | 최대 10개 |

---

## 5. Technical Design

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    QuickPreview Web (apps/web)                       │
│                         Next.js API Route                            │
│                              │                                       │
│                    ┌─────────▼─────────┐                            │
│                    │   /api/analyze    │                            │
│                    └─────────┬─────────┘                            │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTP (내부망)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    QuickPreview AI (apps/ai)                         │
│                         FastAPI Server                               │
│                                                                      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │  POST /analyze  │  │ POST /stt/      │  │  GET /health    │    │
│   │  (LLM 분석)     │  │  transcribe     │  │                 │    │
│   └────────┬────────┘  └────────┬────────┘  └─────────────────┘    │
│            │                    │                                    │
│            ▼                    ▼                                    │
│   ┌─────────────────┐  ┌─────────────────┐                         │
│   │   LLM Service   │  │   STT Client    │                         │
│   │   (OpenAI)      │  │   (Proxy)       │                         │
│   └────────┬────────┘  └────────┬────────┘                         │
│            │                    │                                    │
└────────────┼────────────────────┼────────────────────────────────────┘
             │                    │
             ▼                    ▼
      ┌──────────────┐    ┌──────────────────────┐
      │  OpenAI API  │    │  External STT API    │
      │ (gpt-4o-mini)│    │ (WhisperX)           │
      └──────────────┘    │ work.soundmind.life  │
                          └──────────────────────┘
```

### 5.2 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | FastAPI | 0.115.x |
| Python | Python | 3.11 |
| LLM | OpenAI API | Latest |
| HTTP Client | httpx | 0.27.x |
| Validation | Pydantic | 2.x |
| Logging | structlog | 24.x |
| Container | Docker | Latest |
| HTTP Server | Uvicorn | 0.34.x |

### 5.3 API Specification

---

#### `POST /analyze`

**Description**: LLM 기반 영상 분석

**Request Body (JSON)**:
```json
{
  "metadata": {
    "title": "string (required, max 200자)",
    "channelName": "string (required, max 100자)",
    "description": "string (optional, max 2000자)"
  },
  "transcript": "string (optional, max 50000자)",
  "segments": [
    {
      "start": "number (seconds)",
      "end": "number (seconds)",
      "text": "string"
    }
  ]
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "summary": "string - 3문장 요약",
    "watchScore": "number (1-10)",
    "watchScoreReason": "string - 점수 근거",
    "keywords": ["string"],
    "highlights": [
      {
        "timestamp": "number (seconds)",
        "title": "string",
        "description": "string"
      }
    ]
  }
}
```

**Error Responses**:
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_REQUEST | 잘못된 요청 형식입니다 |
| 400 | TITLE_REQUIRED | 영상 제목은 필수입니다 |
| 400 | TITLE_TOO_LONG | 제목은 200자 이내여야 합니다 |
| 400 | TRANSCRIPT_TOO_LONG | 자막은 50000자 이내여야 합니다 |
| 500 | LLM_ERROR | OpenAI API 호출에 실패했습니다 |
| 503 | SERVICE_UNAVAILABLE | 서비스를 일시적으로 사용할 수 없습니다 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 한도를 초과했습니다 |

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "LLM_ERROR",
    "message": "OpenAI API 호출에 실패했습니다",
    "details": {
      "retry_after": 5
    }
  }
}
```

---

#### `POST /stt/transcribe`

**Description**: 외부 STT API 프록시

**Alias**: `POST /whisperX/transcribe` (하위 호환)

**Request Body (multipart/form-data)**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| audio | file | Yes | Max 500MB, webm/mp3/wav/m4a/ogg/flac |
| language | string | No | "auto" 또는 ISO 639-1 언어 코드 |

**Response 200 OK** (플랫 구조 - 하위 호환):
```json
{
  "text": "string - 전체 텍스트",
  "language": "string - 감지된 언어 코드",
  "language_probability": "number (0-1)",
  "segments": [
    {
      "start": "number (seconds)",
      "end": "number (seconds)",
      "text": "string"
    }
  ]
}
```

**Error Responses**:
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_FILE | 지원하지 않는 파일 형식입니다 |
| 400 | FILE_TOO_LARGE | 파일 크기가 500MB를 초과합니다 |
| 422 | AUDIO_TOO_LONG | 120분 이하의 오디오만 지원합니다 |
| 500 | STT_ERROR | STT API 호출에 실패했습니다 |
| 503 | STT_UNAVAILABLE | STT 서비스를 사용할 수 없습니다 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 한도를 초과했습니다 |

**Error Response Format** (플랫 구조 - 하위 호환):
```json
{
  "error": "STT_ERROR",
  "message": "STT API 호출에 실패했습니다"
}
```

---

#### `GET /health`

**Description**: 서비스 상태 확인

**Response 200 OK**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "services": {
    "openai": true,
    "stt_api": true
  }
}
```

**Response 503 (외부 서비스 장애)**:
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "services": {
    "openai": true,
    "stt_api": false
  }
}
```

---

### 5.4 Project Structure

```
apps/ai/
├── main.py                 # FastAPI 엔트리포인트
├── requirements.txt        # Python 의존성
├── Dockerfile             # Docker 빌드 설정
├── .env.example           # 환경변수 예시
├── README.md              # 서비스 문서
│
└── app/
    ├── __init__.py
    ├── config.py          # 설정 관리
    │
    ├── api/
    │   ├── __init__.py
    │   ├── router.py      # API 라우터
    │   ├── analyze.py     # /analyze 엔드포인트
    │   ├── stt.py         # /stt/transcribe 엔드포인트
    │   └── health.py      # /health 엔드포인트
    │
    ├── services/
    │   ├── __init__.py
    │   ├── llm.py         # OpenAI LLM 서비스
    │   └── stt_client.py  # 외부 STT API 클라이언트
    │
    └── models/
        ├── __init__.py
        └── schemas.py     # Pydantic 모델
```

### 5.5 Logging Strategy

**로그 항목**:
| 이벤트 | 레벨 | 포함 정보 |
|--------|------|----------|
| 요청 수신 | INFO | request_id, endpoint, client_ip |
| 분석 시작 | INFO | request_id, title_length, has_transcript |
| 분석 완료 | INFO | request_id, duration_ms, watch_score |
| STT 요청 | INFO | request_id, file_size, language |
| STT 완료 | INFO | request_id, duration_ms, text_length |
| 에러 발생 | ERROR | request_id, error_code, error_message |
| 재시도 | WARNING | request_id, attempt, wait_seconds |

**로그 포맷 (JSON)**:
```json
{
  "timestamp": "2026-01-15T12:00:00.123Z",
  "level": "INFO",
  "request_id": "a1b2c3d4",
  "event": "analyze_complete",
  "data": {
    "duration_ms": 2500,
    "watch_score": 8
  }
}
```

---

## 6. Implementation Phases

### Phase 1: MVP (현재 완료)

**목표**: 기본 기능 구현

**Tasks:**
- [x] FastAPI 프로젝트 구조 설정
- [x] 환경변수 및 설정 관리
- [x] POST /analyze 엔드포인트 (LLM 분석)
- [x] POST /stt/transcribe 프록시 엔드포인트
- [x] POST /whisperX/transcribe 하위 호환
- [x] GET /health 엔드포인트
- [x] Docker 설정
- [x] docker-compose.yml 업데이트

**Deliverable**:
- LLM 분석 API 동작
- STT 프록시 동작
- 하위 호환 유지

### Phase 2: 고도화 (완료)

**목표**: 안정성 및 기능 확장

**Tasks:**
- [x] 에러 응답 형식 표준화
- [x] 입력값 검증 강화
- [x] 재시도 로직 구현 (지수 백오프)
- [x] Rate Limiting 구현
- [x] 상세 로깅 구현
- [x] 테스트 코드 작성

**Deliverable**:
- 표준화된 에러 응답 (ErrorCode enum)
- Pydantic 입력 검증 (필드 길이, 파일 크기)
- tenacity 기반 재시도 (최대 3회, 지수 백오프)
- slowapi 기반 Rate Limiting
- request_id 추적, JSON 로깅
- pytest 테스트 코드

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 분석 성공률 | > 99% | 성공 요청 / 전체 요청 |
| STT 프록시 성공률 | > 99% | 성공 요청 / 전체 요청 |
| 분석 응답 시간 | < 10초 | 평균 응답 시간 |
| 서비스 가용성 | > 99% | 업타임 |

---

## 8. Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...            # OpenAI API key

# Optional
OPENAI_MODEL=gpt-4o-mini         # LLM model (default: gpt-4o-mini)
STT_API_URL=http://work.soundmind.life:12321  # External STT API
STT_MAX_DURATION_MINUTES=120     # Max audio duration (minutes)
MAX_FILE_SIZE_MB=500             # Max file size (MB)
LOG_LEVEL=INFO                   # Log level

# Rate Limiting
RATE_LIMIT_ANALYZE=30            # /analyze requests per minute per IP
RATE_LIMIT_STT=10                # /stt requests per minute per IP
MAX_CONCURRENT_REQUESTS=10       # Max concurrent requests
```

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenAI API 장애 | High | Low | 에러 메시지 반환, 재시도 (3회) |
| 외부 STT API 장애 | High | Medium | 에러 메시지 반환, 재시도 (3회) |
| API 비용 증가 | Medium | Medium | Rate limiting, 사용량 모니터링 |
| 응답 지연 | Medium | Medium | 타임아웃 설정, 재시도 |
| 대용량 파일 공격 | Medium | Low | 파일 크기 제한 (500MB) |
| 요청 폭주 | Medium | Medium | Rate limiting, 동시 요청 제한 |

---

## 10. Dependencies

### Python Packages
```
fastapi>=0.115.0
uvicorn>=0.34.0
python-multipart>=0.0.18
openai>=1.0.0
httpx>=0.27.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
structlog>=24.0.0
python-dotenv>=1.0.0
```

### External Services
- OpenAI API (gpt-4o-mini)
- External WhisperX API (`http://work.soundmind.life:12321`)

---

## 11. Related Documents

| 문서 | 경로 | 관계 |
|------|------|------|
| QuickPreview Service PRD | `docs/prd/quickpreview-service.md` | 부모 서비스 |
| AI Service PRD | `docs/prd/ai-service.md` | 본 문서 |

### 11.1 API 연동

**Web Service 호출 코드** (`apps/web/src/lib/stt.ts`):
```typescript
const response = await fetch(`${config.STT_API_URL}/whisperX/transcribe`, {
  method: "POST",
  body: formData,  // audio, language
});
```

**AI Service 대응**:
- `/whisperX/transcribe` 엔드포인트 지원 (하위 호환)
- 플랫 응답 형식 유지

---

## Appendix

### A. 외부 STT API 스펙

**URL**: `http://work.soundmind.life:12321`
**Endpoint**: `POST /whisperX/transcribe`

**Request**:
| Field | Type | Description |
|-------|------|-------------|
| audio | file | 오디오 파일 (max 500MB) |
| language | string | "auto" 또는 언어 코드 |

**Response**:
```json
{
  "text": "전체 텍스트",
  "language": "ko",
  "language_probability": 0.95,
  "segments": [
    {"start": 0.0, "end": 5.0, "text": "세그먼트 텍스트"}
  ]
}
```

### B. Docker 설정

```yaml
# docker-compose.yml
services:
  ai:
    build:
      context: ./apps/ai
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}
      - STT_API_URL=${STT_API_URL:-http://work.soundmind.life:12321}
      - STT_MAX_DURATION_MINUTES=${STT_MAX_DURATION_MINUTES:-120}
      - MAX_FILE_SIZE_MB=${MAX_FILE_SIZE_MB:-500}
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### C. 에러 코드 표

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_REQUEST | 400 | 잘못된 요청 형식 |
| TITLE_REQUIRED | 400 | 필수 필드 누락 |
| TITLE_TOO_LONG | 400 | 필드 길이 초과 |
| TRANSCRIPT_TOO_LONG | 400 | 자막 길이 초과 |
| INVALID_FILE | 400 | 지원하지 않는 파일 |
| FILE_TOO_LARGE | 400 | 파일 크기 초과 |
| AUDIO_TOO_LONG | 422 | 오디오 길이 초과 |
| RATE_LIMIT_EXCEEDED | 429 | 요청 한도 초과 |
| LLM_ERROR | 500 | OpenAI API 오류 |
| STT_ERROR | 500 | STT API 오류 |
| SERVICE_UNAVAILABLE | 503 | 서비스 불가 |
| STT_UNAVAILABLE | 503 | STT 서비스 불가 |
