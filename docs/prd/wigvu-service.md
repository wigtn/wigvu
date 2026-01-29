# WIGVU (윅뷰) - 영어 영상 실시간 한글 자막 서비스 PRD

> **Version**: 1.1
> **Created**: 2026-01-14
> **Updated**: 2026-01-14
> **Status**: Draft (Reviewed)
> **Project**: WIGVU (WIGTN View)

---

## 1. Overview

### 1.1 Problem Statement

영어로 된 YouTube 영상을 시청할 때, 영어를 이해하지 못하는 사용자들은 콘텐츠에 접근할 수 없는 **정보 불평등** 문제가 발생합니다.

- YouTube 자동 번역 기능은 정확도가 낮고, 모든 영상에서 지원되지 않음
- 자막이 없는 영상은 영어를 모르면 내용 파악이 불가능
- 기존 번역 서비스들은 영상과 동기화된 실시간 자막을 제공하지 않음

### 1.2 Goals

| 목표 | 설명 |
|------|------|
| **언어 장벽 해소** | 영어 영상 콘텐츠를 한국어로 실시간 제공 |
| **동기화된 자막** | 영상 재생 시간에 맞춰 자막을 자동 스크롤하여 표시 |
| **자막 없는 영상 지원** | STT(Speech-to-Text)를 통해 자막이 없는 영상도 처리 |
| **직관적인 UX** | 영상 우측에 스크립트 패널로 편리한 시청 경험 제공 |

### 1.3 Non-Goals (Out of Scope)

- 영어 외 다른 언어 영상의 번역 (v1.0에서는 영어→한국어만 지원)
- 실시간 스트리밍 영상 지원
- 모바일 앱 개발 (웹 브라우저만 지원)
- 번역된 자막 파일(.srt) 다운로드 기능
- 사용자 계정 및 시청 기록 저장

### 1.4 Scope

| 포함 | 제외 |
|------|------|
| YouTube 영상 URL 분석 | 다른 플랫폼 (Vimeo, TikTok 등) |
| 영어→한국어 번역 | 다국어 지원 |
| 웹 브라우저 지원 | 모바일 앱 |
| 영상 길이 20분 이내 (STT) | 장시간 영상 (1시간+) |
| 동시 사용자 20명 | 대규모 트래픽 |

---

## 2. User Stories

### 2.1 Primary User Persona

**김영희 (28세, 직장인)**
- 해외 테크 유튜버의 리뷰 영상을 즐겨 보지만 영어 청취력이 부족
- 번역 자막을 기다리기엔 시간이 오래 걸림
- 영상을 보면서 동시에 한글로 내용을 파악하고 싶음

### 2.2 User Stories

#### US-001: YouTube URL 입력
```
As a 영어를 못하는 사용자
I want to YouTube URL을 입력하면
So that 해당 영상의 한글 번역 자막을 볼 수 있다
```

#### US-002: 자막 추출 및 번역
```
As a 사용자
I want to 영상의 영어 자막을 자동으로 추출하고 번역하면
So that 별도의 작업 없이 한글 자막을 얻을 수 있다
```

#### US-003: 실시간 동기화 자막
```
As a 사용자
I want to 영상을 재생하면 현재 시간에 맞는 자막이 하이라이트되면
So that 어떤 부분을 말하고 있는지 쉽게 따라갈 수 있다
```

#### US-004: 자막 클릭 시 시간 이동
```
As a 사용자
I want to 특정 자막 구간을 클릭하면
So that 해당 시간으로 영상이 이동한다
```

#### US-005: 자막 없는 영상 처리
```
As a 사용자
I want to 자막이 없는 영상도 URL을 입력하면
So that STT를 통해 자막을 생성하고 번역받을 수 있다
```

### 2.3 Acceptance Criteria (Gherkin)

#### Scenario: 자막 있는 영상 분석
```gherkin
Scenario: 자막이 있는 YouTube 영상 번역
  Given 사용자가 WIGVU 웹사이트에 접속했다
  When YouTube URL "https://youtube.com/watch?v=xxx"를 입력하고 분석 버튼을 클릭한다
  Then 영상의 영어 자막이 추출된다
  And 자막이 한국어로 번역된다
  And 번역된 자막이 타임스탬프와 함께 우측 패널에 표시된다
```

#### Scenario: 자막 없는 영상 분석
```gherkin
Scenario: 자막이 없는 YouTube 영상 번역
  Given 사용자가 자막이 없는 영상 URL을 입력했다
  When 분석이 시작되면
  Then 영상의 오디오가 추출된다
  And STT를 통해 영어 텍스트가 생성된다
  And 텍스트가 한국어로 번역된다
  And 번역된 자막이 타임스탬프와 함께 표시된다
```

#### Scenario: 실시간 자막 동기화
```gherkin
Scenario: 영상 재생 시 자막 동기화
  Given 영상 분석이 완료되어 번역 자막이 표시된 상태다
  When 사용자가 영상을 재생한다
  Then 현재 재생 시간에 해당하는 자막이 하이라이트된다
  And 자막 패널이 자동으로 스크롤되어 현재 자막이 보인다
```

---

## 3. Functional Requirements

### 3.1 Core Features

| ID | Requirement | Priority | Dependencies |
|----|-------------|----------|--------------|
| **FR-001** | YouTube URL 입력 및 검증 | P0 (Must) | - |
| **FR-002** | YouTube 영상 메타데이터 조회 (제목, 채널, 길이 등) | P0 (Must) | FR-001 |
| **FR-003** | YouTube 자막 추출 (영어) | P0 (Must) | FR-002 |
| **FR-004** | 오디오 추출 (자막 없는 경우) | P0 (Must) | FR-003 실패 시 |
| **FR-005** | STT(Speech-to-Text) 변환 | P0 (Must) | FR-004 |
| **FR-006** | 영어→한국어 번역 (OpenAI API) | P0 (Must) | FR-003 또는 FR-005 |
| **FR-007** | 타임스탬프 기반 자막 세그먼트 생성 | P0 (Must) | FR-006 |
| **FR-008** | 영상 플레이어 표시 (YouTube IFrame) | P0 (Must) | FR-002 |
| **FR-009** | 우측 스크립트 패널 표시 | P0 (Must) | FR-007, FR-008 |
| **FR-010** | 영상 재생 시간과 자막 동기화 | P0 (Must) | FR-008, FR-009 |
| **FR-011** | 현재 재생 중인 자막 하이라이트 | P0 (Must) | FR-010 |
| **FR-012** | 자막 자동 스크롤 | P1 (Should) | FR-010, FR-011 |
| **FR-013** | 자막 클릭 시 해당 시간으로 이동 | P1 (Should) | FR-008, FR-009 |
| **FR-014** | 원본 영어 자막 / 번역 자막 토글 | P1 (Should) | FR-009 |
| **FR-015** | 분석 진행 상태 표시 (로딩) | P1 (Should) | - |
| **FR-016** | 영상 요약 및 키워드 표시 | P2 (Could) | FR-006 |
| **FR-017** | 시청 추천 점수 표시 | P2 (Could) | FR-006 |
| **FR-018** | 다크모드 지원 | P2 (Could) | - |
| **FR-019** | 언어 검증 및 경고 (비영어 영상) | P0 (Must) | FR-003, FR-005 |
| **FR-020** | 자막 언어 선택 로직 (영어 우선) | P0 (Must) | FR-003 |
| **FR-021** | 진행 상태 단계 표시 | P1 (Should) | FR-015 |
| **FR-022** | 번역 배치 처리 | P0 (Must) | FR-006 |
| **FR-023** | 결과 캐싱 | P1 (Should) | - |

### 3.2 Feature Details

#### FR-001: YouTube URL 입력 및 검증

**지원 URL 형식:**
```
- https://www.youtube.com/watch?v={videoId}
- https://youtu.be/{videoId}
- https://youtube.com/watch?v={videoId}&t=123
- https://m.youtube.com/watch?v={videoId}
```

**검증 규칙:**
- Video ID는 11자리 영숫자 및 특수문자(_-)
- 정규식: `^[a-zA-Z0-9_-]{11}$`

#### FR-006: 영어→한국어 번역

**번역 요구사항:**
- 자막 세그먼트 단위로 번역 (문맥 유지)
- 기술 용어는 원어 병기 고려
- 번역 품질: 자연스러운 한국어 문장

#### FR-010: 영상-자막 동기화

**동기화 로직:**
```
1. YouTube IFrame API로 현재 재생 시간(currentTime) 조회
2. currentTime에 해당하는 자막 세그먼트 찾기
3. 해당 세그먼트 하이라이트 및 스크롤
4. 100ms 간격으로 폴링
```

#### FR-019: 언어 검증 및 경고 (NEW)

**영어 영상 확인 프로세스:**
1. YouTube 자막 언어 코드 확인 (`languageCode === 'en'`)
2. STT 사용 시 WhisperX 언어 감지 결과 확인
3. 영어가 아닌 경우 처리:
   - `languageConfidence < 0.7` 또는 `language !== 'en'`
   - 사용자에게 경고 표시: "영어가 아닌 영상으로 감지되었습니다"
   - 옵션: 그래도 번역 진행 / 취소

**언어 코드 분류:**
| 분류 | 언어 코드 | 처리 |
|------|----------|------|
| 영어 | en, en-US, en-GB, en-AU | 정상 번역 |
| 한국어 | ko, ko-KR | 번역 불필요, 바로 표시 |
| 기타 | ja, es, fr, zh 등 | 경고 후 사용자 선택 |

#### FR-020: 자막 언어 선택 로직 (NEW)

**YouTube 자막 선택 우선순위:**
1. 영어 수동 자막 (en, en-US, en-GB)
2. 영어 자동 생성 자막 (a.en)
3. 한국어 자막 → 번역 불필요, 바로 사용
4. 기타 언어 → 사용자 경고 후 번역 시도

#### FR-021: 진행 상태 단계 표시 (NEW)

| 단계 | 상태 코드 | 메시지 | 예상 시간 |
|------|----------|--------|----------|
| 1 | `fetching_metadata` | 영상 정보 확인 중... | 1-2초 |
| 2 | `extracting_captions` | 자막 추출 중... | 2-3초 |
| 3 | `downloading_audio` | 오디오 다운로드 중... | 10-20초 (STT 시) |
| 4 | `transcribing` | 음성 인식 중... | 20-30초 (STT 시) |
| 5 | `translating` | 번역 중... | 5-10초 |
| 6 | `analyzing` | 분석 중... | 2-3초 |
| 7 | `completed` | 분석 완료! | - |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Metric | Target | Notes |
|--------|--------|-------|
| 분석 완료 시간 (자막 있는 영상) | < 15초 | 10분 영상 기준 |
| 분석 완료 시간 (STT 필요) | < 60초 | 10분 영상 기준 |
| 자막 동기화 지연 | < 200ms | 실시간 하이라이트 |
| 동시 사용자 | 20명 | 소규모 서비스 |

#### 4.1.1 영상 길이 제한 (명확화)

| 시나리오 | 최대 길이 | 이유 |
|----------|----------|------|
| YouTube 자막 있음 | **60분** | 자막 추출/번역만 수행, STT 불필요 |
| STT 필요 (자막 없음) | **20분** | WhisperX 처리 시간 및 비용 제한 |
| 캐시 히트 | 제한 없음 | 이미 처리된 결과 반환 |

#### 4.1.2 동시 처리 제한

**Vercel Function 환경:**
| 항목 | 설정값 | 비고 |
|------|--------|------|
| 동시 실행 | 10개 | Vercel Pro 플랜 기준 |
| 함수 타임아웃 | 60초 | STT 처리 고려 |
| 메모리 | 1024MB | 오디오 처리 고려 |

**대기열 처리 (Phase 2 고려):**
- STT 요청이 동시에 10개 초과 시 429 반환
- 클라이언트에서 자동 재시도 (3초 후)

### 4.2 Security

| 항목 | 요구사항 |
|------|----------|
| API Key 보호 | 환경변수로 관리, 클라이언트 노출 금지 |
| 입력 검증 | URL 형식 검증, XSS 방지 |
| Rate Limiting | IP당 분당 10회 요청 제한 |
| HTTPS | 모든 통신 암호화 |

### 4.3 Reliability

| 항목 | 목표 |
|------|------|
| 가용성 | 99% (월간) |
| 에러 처리 | 사용자 친화적 에러 메시지 |
| Fallback | STT 실패 시 메타데이터 기반 분석 |

#### 4.3.1 STT 실패 시 사용자 경험

**시나리오**: 자막 없는 영상 + STT API 장애

| 상황 | 사용자 메시지 | 대안 |
|------|-------------|------|
| STT API 타임아웃 | "음성 인식에 시간이 오래 걸리고 있습니다" | 재시도 버튼 |
| STT API 오류 | "현재 음성 인식 서비스를 이용할 수 없습니다" | 나중에 다시 시도 안내 |
| 오디오 추출 실패 | "영상 오디오를 가져올 수 없습니다" | 다른 영상 시도 안내 |

**Fallback 동작:**
1. 메타데이터 기반 요약 제공 (선택적)
2. "자막이 있는 다른 영상을 시도해보세요" 안내
3. 에러 로깅 및 모니터링 알림

### 4.4 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 최신 2개 버전 |
| Firefox | 최신 2개 버전 |
| Safari | 최신 2개 버전 |
| Edge | 최신 2개 버전 |

### 4.5 비용 관리 (NEW)

#### 4.5.1 사용량 제한

| 항목 | 제한 | 근거 |
|------|------|------|
| 전체 일일 분석 | 100회/일 | OpenAI/STT 비용 제한 |
| IP당 일일 제한 | 10회/일 | 남용 방지 |
| IP당 분당 제한 | 10회/분 | Rate Limiting |
| 영상 길이 (STT) | 20분 | STT 비용 제한 |

#### 4.5.2 비용 추정 (10분 영상 기준)

| 서비스 | 비용 | 비고 |
|--------|------|------|
| STT (WhisperX) | ~$0.01 | 자체 호스팅 시 서버 비용만 |
| 번역 (GPT-4o-mini) | ~$0.02 | 15회 배치 호출 기준 |
| 분석 (GPT-4o-mini) | ~$0.005 | 요약/키워드 생성 |
| **총계** | **~$0.035/영상** | |

#### 4.5.3 월간 예산

| 항목 | 예산 | 처리 가능 건수 |
|------|------|---------------|
| OpenAI API | $50 | ~2,000건 |
| STT (서버 비용) | $30 | 상시 운영 |
| YouTube API | 무료 | 10,000회/일 |
| **총계** | **$80/월** | ~2,000건/월 |

---

## 5. Technical Design

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  URL Input   │  │YouTube Player│  │   Script Panel           │  │
│  │  Component   │  │  (IFrame)    │  │   (Sync Subtitles)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    POST /api/analyze                          │  │
│  │  1. URL 검증                                                  │  │
│  │  2. 메타데이터 조회 (YouTube Data API)                        │  │
│  │  3. 자막 추출 시도 (YouTube 페이지 파싱)                      │  │
│  │  4. [자막 없음] 오디오 추출 (yt-dlp)                          │  │
│  │  5. [자막 없음] STT 변환 (WhisperX API)                       │  │
│  │  6. 번역 (OpenAI API)                                         │  │
│  │  7. 분석 결과 반환                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
    │   YouTube    │    │  WhisperX    │    │   OpenAI     │
    │   Data API   │    │  STT API     │    │     API      │
    └──────────────┘    └──────────────┘    └──────────────┘
```

### 5.2 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 16.x |
| Frontend | React | 19.x |
| Frontend | TypeScript | 5.x |
| Frontend | Tailwind CSS | 4.x |
| Frontend | TanStack Query | 5.x |
| Frontend | Radix UI | Latest |
| Backend | Next.js API Routes | 16.x |
| Backend | Zod (Validation) | 4.x |
| STT | WhisperX API | - |
| Translation | OpenAI API (gpt-4o-mini) | Latest |
| YouTube | YouTube Data API v3 | v3 |
| Audio Extract | yt-dlp | Latest |

### 5.3 API Specification

---

#### `POST /api/analyze`

**Description**: YouTube 영상 URL을 받아 자막 추출, 번역, 분석을 수행합니다.

**Authentication**: None (Rate Limiting 적용)

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | application/json |

**Request Body**:
```json
{
  "url": "string (required) - YouTube 영상 URL",
  "language": "string (optional) - 원본 언어 힌트, default: 'auto'",
  "translateTo": "string (optional) - 번역 대상 언어, default: 'ko'"
}
```

**Request Example**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "language": "en",
  "translateTo": "ko"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "string - 분석 결과 고유 ID (UUID)",
    "videoId": "string - YouTube Video ID",
    "url": "string - 원본 URL",
    "metadata": {
      "title": "string - 영상 제목",
      "channelName": "string - 채널명",
      "channelId": "string - 채널 ID",
      "publishedAt": "string (ISO 8601) - 게시일",
      "duration": "number - 영상 길이 (초)",
      "viewCount": "number - 조회수",
      "likeCount": "number - 좋아요 수",
      "thumbnailUrl": "string - 썸네일 URL",
      "description": "string - 영상 설명"
    },
    "transcript": {
      "source": "string - 'youtube' | 'stt' | 'none'",
      "originalLanguage": "string - 감지된 원본 언어 코드",
      "languageConfidence": "number - 언어 감지 신뢰도 (0-1)",
      "segments": [
        {
          "start": "number - 시작 시간 (초)",
          "end": "number - 종료 시간 (초)",
          "originalText": "string - 원본 텍스트 (영어)",
          "translatedText": "string - 번역 텍스트 (한국어)"
        }
      ]
    },
    "analysis": {
      "summary": "string - 영상 요약 (한국어)",
      "keywords": ["string - 키워드 배열"],
      "watchScore": "number - 시청 추천 점수 (1-10)",
      "watchScoreReason": "string - 점수 근거"
    },
    "analyzedAt": "string (ISO 8601) - 분석 완료 시간"
  }
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "videoId": "dQw4w9WgXcQ",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "metadata": {
      "title": "Rick Astley - Never Gonna Give You Up",
      "channelName": "Rick Astley",
      "channelId": "UCuAXFkgsw1L7xaCfnd5JJOw",
      "publishedAt": "2009-10-25T06:57:33Z",
      "duration": 212,
      "viewCount": 1500000000,
      "likeCount": 15000000,
      "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "description": "The official video for Rick Astley..."
    },
    "transcript": {
      "source": "youtube",
      "originalLanguage": "en",
      "languageConfidence": 0.98,
      "segments": [
        {
          "start": 0,
          "end": 4.5,
          "originalText": "We're no strangers to love",
          "translatedText": "우리는 사랑에 낯선 사이가 아니야"
        },
        {
          "start": 4.5,
          "end": 8.2,
          "originalText": "You know the rules and so do I",
          "translatedText": "넌 규칙을 알고 있고 나도 알아"
        }
      ]
    },
    "analysis": {
      "summary": "1980년대 팝 음악의 대표적인 곡으로...",
      "keywords": ["팝송", "80년대", "뮤직비디오", "밈"],
      "watchScore": 8,
      "watchScoreReason": "전 세계적으로 유명한 클래식 팝송"
    },
    "analyzedAt": "2026-01-14T12:00:00Z"
  }
}
```

**Error Responses**:
| Status | Code | Message | Description |
|--------|------|---------|-------------|
| 400 | INVALID_URL | 올바른 YouTube URL을 입력해주세요 | URL 형식 오류 |
| 400 | INVALID_REQUEST | 요청 형식이 올바르지 않습니다 | Request Body 검증 실패 |
| 404 | VIDEO_NOT_FOUND | 영상을 찾을 수 없습니다 | 존재하지 않는 영상 |
| 422 | VIDEO_TOO_LONG | 20분 이하의 영상만 지원합니다 | 영상 길이 초과 |
| 429 | RATE_LIMITED | 요청이 너무 많습니다. 잠시 후 다시 시도해주세요 | Rate Limit 초과 |
| 500 | STT_FAILED | 음성 인식에 실패했습니다 | STT API 오류 |
| 500 | TRANSLATION_FAILED | 번역에 실패했습니다 | OpenAI API 오류 |
| 500 | INTERNAL_ERROR | 분석 중 오류가 발생했습니다 | 서버 내부 오류 |

**Error Response Format**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_URL",
    "message": "올바른 YouTube URL을 입력해주세요",
    "details": [
      {
        "field": "url",
        "message": "지원하지 않는 URL 형식입니다"
      }
    ]
  }
}
```

**Rate Limiting**:
- Limit: 10 requests per minute per IP
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

---

#### `GET /api/health`

**Description**: 서비스 상태 확인

**Response 200 OK**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-14T12:00:00Z",
  "services": {
    "youtube": "ok",
    "stt": "ok",
    "openai": "ok"
  }
}
```

---

### 5.4 Data Models

#### TranscriptSegment
```typescript
interface TranscriptSegment {
  start: number;        // 시작 시간 (초)
  end: number;          // 종료 시간 (초)
  originalText: string; // 원본 텍스트 (영어)
  translatedText: string; // 번역 텍스트 (한국어)
}
```

#### VideoAnalysis
```typescript
interface VideoAnalysis {
  id: string;
  videoId: string;
  url: string;
  metadata: VideoMetadata;
  transcript: {
    source: 'youtube' | 'stt' | 'none';
    originalLanguage: string;
    languageConfidence: number;
    segments: TranscriptSegment[];
  };
  analysis: {
    summary: string;
    keywords: string[];
    watchScore: number;
    watchScoreReason: string;
  };
  analyzedAt: string;
}
```

### 5.5 UI Components

#### 메인 레이아웃 (결과 화면)
```
┌─────────────────────────────────────────────────────────────┐
│  [Header: WIGVU]                               [새 분석]    │
├────────────────────────────────┬────────────────────────────┤
│                                │                            │
│                                │   번역 스크립트             │
│     YouTube Player             │   ─────────────────────    │
│     (IFrame)                   │   [00:00] 우리는 사랑에...  │
│                                │   [00:04] 넌 규칙을 알고... │ ← 현재 재생 중 (하이라이트)
│                                │   [00:08] 완전한 헌신을...  │
│                                │   [00:12] 다른 남자한테...  │
│                                │                            │
│────────────────────────────────│   [원본 보기] 토글          │
│  제목: Never Gonna Give You Up │                            │
│  채널: Rick Astley             │                            │
│  조회수: 15억회 | 길이: 3:32   │                            │
├────────────────────────────────┴────────────────────────────┤
│  [요약] 1980년대 팝 음악의 대표적인 곡으로...               │
│  [키워드] #팝송 #80년대 #밈                                  │
└─────────────────────────────────────────────────────────────┘
```

#### 스크립트 패널 동작
1. 영상 재생 시 현재 시간에 맞는 자막 하이라이트
2. 하이라이트된 자막이 항상 보이도록 자동 스크롤
3. 자막 클릭 시 해당 시간으로 영상 이동
4. 원본/번역 토글 버튼

### 5.6 번역 전략 (NEW)

#### 5.6.1 배치 번역 방식

**문제**: 10분 영상 = 약 150개 자막 세그먼트 → 개별 API 호출 시 비용/시간 폭증

**해결**: 세그먼트를 배치로 묶어 단일 API 호출

| 설정 | 값 | 이유 |
|------|---|------|
| 배치 크기 | 10개 세그먼트 | 토큰 제한 내 최적 |
| 컨텍스트 | 이전 2개 세그먼트 | 문맥 유지 |
| 병렬 처리 | 3개 배치 동시 | 속도 최적화 |

#### 5.6.2 번역 프롬프트

```
시스템: 당신은 영어→한국어 자막 번역가입니다.
자연스러운 한국어로 번역하되, 기술 용어는 원어를 괄호 안에 병기하세요.

입력 형식:
{
  "context": "이전 자막 (문맥 참고용)",
  "segments": [
    {"id": 1, "text": "Hello everyone"},
    {"id": 2, "text": "Today we will learn about APIs"}
  ]
}

출력 형식:
{
  "translations": [
    {"id": 1, "text": "안녕하세요 여러분"},
    {"id": 2, "text": "오늘은 API에 대해 배워보겠습니다"}
  ]
}
```

#### 5.6.3 예상 성능

| 영상 길이 | 세그먼트 수 | API 호출 | 예상 시간 |
|----------|-----------|---------|----------|
| 5분 | 75개 | 8회 | 3-4초 |
| 10분 | 150개 | 15회 | 5-8초 |
| 20분 | 300개 | 30회 | 10-15초 |

### 5.7 캐싱 전략 (NEW)

#### 5.7.1 캐시 구조

**캐시 키**: `wigvu:${videoId}:${translateTo}`
**예시**: `wigvu:dQw4w9WgXcQ:ko`

| 항목 | 값 |
|------|---|
| 캐시 저장소 | Phase 1: 메모리 (LRU) / Phase 2: Vercel KV |
| 최대 항목 수 | 100개 (메모리) / 1000개 (KV) |
| TTL | 24시간 |
| 캐시 대상 | 전체 분석 결과 (JSON) |

#### 5.7.2 캐시 동작

```
요청 → 캐시 확인
        ├─ HIT → 즉시 반환 (< 100ms)
        └─ MISS → 분석 수행 → 캐시 저장 → 반환
```

**캐시 무효화:**
- TTL 만료 시 자동 삭제
- 수동 무효화 API 없음 (필요 시 Phase 2에서 추가)

---

## 6. Implementation Phases

### Phase 1: MVP - 핵심 기능 (기존 코드 확장)

**목표**: 영상 분석 + 번역 자막 + 동기화 기본 기능

**Backend:**
- [ ] 자막 언어 선택 로직 수정 (영어 우선) - FR-020
- [ ] 언어 감지 및 경고 로직 추가 - FR-019
- [ ] 번역 배치 처리 구현 (10개 세그먼트/배치) - FR-022
- [ ] TranscriptSegment에 translatedText 필드 추가
- [ ] 번역 API 호출 로직 구현 (OpenAI 배치)
- [ ] 진행 상태 반환 구조 추가 - FR-021

**Frontend:**
- [ ] 우측 스크립트 패널 UI 컴포넌트 구현 - FR-009
- [ ] 영상-자막 동기화 로직 구현 - FR-010
- [ ] 현재 자막 하이라이트 기능 - FR-011
- [ ] 언어 경고 모달/배너 UI
- [ ] 단계별 로딩 상태 표시

**Deliverable**:
- 영상 URL 입력 → 언어 확인 → 번역 자막 표시 → 실시간 동기화

### Phase 2: UX 개선 + 캐싱

**목표**: 사용자 경험 향상 및 비용 최적화

**UX:**
- [ ] 자막 자동 스크롤 기능 - FR-012
- [ ] 원본/번역 토글 - FR-014
- [ ] 에러 처리 개선 (STT 실패 시 안내)
- [ ] 다크모드 지원 - FR-018
- [ ] 모바일 반응형 레이아웃

**최적화:**
- [ ] 결과 캐싱 구현 (메모리 LRU) - FR-023
- [ ] 캐시 히트 시 즉시 반환

**Deliverable**:
- 완성도 높은 사용자 경험
- 동일 영상 재요청 시 즉시 응답

### Phase 3: 안정화 및 배포

**목표**: 프로덕션 배포 준비

**보안/제한:**
- [ ] Rate Limiting 구현 (IP당 10회/분, 10회/일)
- [ ] 일일 전체 사용량 제한 (100회/일)
- [ ] CORS 설정

**모니터링:**
- [ ] 에러 모니터링 (Sentry 등)
- [ ] 자막 추출 실패율 추적
- [ ] API 비용 모니터링

**배포:**
- [ ] 환경변수 설정 (Vercel)
- [ ] 브라우저 호환성 테스트
- [ ] 배포 및 도메인 연결

**Deliverable**:
- 프로덕션 서비스 런칭

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 분석 성공률 | > 95% | 성공 요청 / 전체 요청 |
| 평균 분석 시간 | < 30초 | 요청 ~ 결과 응답 시간 |
| 사용자 만족도 | > 4.0/5.0 | 피드백 설문 |
| 번역 품질 | 자연스러운 한국어 | 샘플 검토 |
| 동기화 정확도 | ±0.5초 이내 | 실제 시간 vs 자막 시간 |

---

## 8. Environment Variables

```env
# Required
OPENAI_API_KEY=sk-xxx          # OpenAI API 키
YOUTUBE_API_KEY=AIzaSyxxx      # YouTube Data API 키

# Optional
STT_API_URL=http://localhost:8000  # WhisperX STT API URL
STT_MAX_DURATION_MINUTES=20        # STT 최대 영상 길이 (분)
YT_DLP_PATH=/usr/local/bin/yt-dlp  # yt-dlp 실행 파일 경로
```

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| YouTube API 제한 | High | Medium | Rate Limiting, 캐싱 |
| STT 정확도 저하 | Medium | Medium | WhisperX Large 모델 사용 |
| 번역 품질 이슈 | Medium | Low | GPT-4o-mini 사용, 프롬프트 개선 |
| 긴 영상 타임아웃 | Medium | High | 20분 제한, 청크 처리 |
| 비용 초과 | Medium | Medium | 사용량 모니터링, 제한 |
| **YouTube 자막 파싱 실패** | **High** | **Medium** | **다중 Fallback (아래 참조)** |
| **비영어 영상 오번역** | **Medium** | **High** | **언어 감지 및 경고** |

### 9.1 YouTube 자막 추출 리스크 대응 (NEW)

**현재 방식**: HTML 페이지에서 `captionTracks` 파싱 (비공식)

**리스크**: YouTube 프론트엔드 변경 시 파싱 실패 가능

**대응 전략:**

| 순서 | 방법 | 설명 |
|------|------|------|
| 1차 | HTML 파싱 | 현재 구현된 방식 |
| 2차 | youtube-transcript 라이브러리 | npm 패키지 사용 |
| 3차 | STT Fallback | 오디오 추출 후 음성 인식 |

**모니터링:**
- 자막 추출 실패율 추적
- 10% 초과 시 Slack/Discord 알림
- 주간 리포트로 추이 확인

### 9.2 비영어 영상 리스크 대응 (NEW)

**시나리오**: 사용자가 일본어/스페인어 영상 URL 입력

**감지 방법:**
1. YouTube 자막 언어 코드 확인
2. STT 언어 감지 결과 확인 (`languageProbability`)

**대응:**
| 신뢰도 | 언어 | 처리 |
|--------|------|------|
| > 0.8 | 영어 | 정상 번역 |
| > 0.8 | 한국어 | 번역 없이 바로 표시 |
| > 0.8 | 기타 | 경고 표시 + 사용자 선택 |
| < 0.8 | 모든 언어 | "다국어 혼합 영상" 경고 |

---

## 10. Dependencies

### External Services
- **YouTube Data API v3**: 영상 메타데이터
- **YouTube 자막 서비스**: 자막 데이터 (비공식)
- **WhisperX API**: Speech-to-Text
- **OpenAI API**: 번역 및 분석

### Internal Dependencies
- **yt-dlp**: YouTube 오디오 다운로드
- **Next.js**: 프레임워크
- **Vercel**: 배포 플랫폼

---

## Appendix

### A. 기존 구현 현황 (wigvu-web)

| 기능 | 구현 상태 | 파일 |
|------|----------|------|
| URL 입력 UI | ✅ 완료 | `src/components/url-input.tsx` |
| YouTube 메타데이터 | ✅ 완료 | `src/lib/services/youtube-metadata.ts` |
| YouTube 자막 추출 | ✅ 완료 | `src/lib/services/transcript.ts` |
| STT (WhisperX) | ✅ 완료 | `src/lib/stt.ts` |
| AI 분석 | ✅ 완료 | `src/lib/services/ai-analysis.ts` |
| 결과 표시 UI | ✅ 완료 | `src/components/analysis-result.tsx` |
| YouTube Player | ✅ 완료 | `src/components/analysis-result.tsx` |
| 시간 이동 기능 | ✅ 완료 | `src/components/analysis-result.tsx` |
| **번역 기능** | ❌ 미구현 | 추가 필요 |
| **실시간 동기화** | ❌ 미구현 | 추가 필요 |
| **스크립트 패널** | ❌ 미구현 | 추가 필요 |

### B. 참고 자료

- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [WhisperX GitHub](https://github.com/m-bain/whisperX)
- [Next.js 16 Documentation](https://nextjs.org/docs)
