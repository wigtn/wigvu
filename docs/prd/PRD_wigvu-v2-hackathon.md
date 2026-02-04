# WigVu v2 - Hackathon Upgrade PRD

> **Version**: 1.0
> **Created**: 2026-02-04
> **Status**: Draft
> **Context**: Cursor Hackathon (개발시간 약 5시간)
> **Project**: wigtn-quickpreview (WigVu)

---

## 1. Overview

### 1.1 Problem Statement

WigVu는 현재 YouTube 영상을 AI로 분석/번역/요약하는 플랫폼이지만, 다음과 같은 제약이 있다:

1. **영상 길이 제한**: 프로덕션 기준 최대 25분, STT 최대 20~30분으로 대학 강의(1~2시간), 컨퍼런스 발표, 다큐멘터리 등 긴 영상을 처리할 수 없다.
2. **콘텐츠 유형 제한**: YouTube 영상만 지원하며, 신문기사/블로그 등 텍스트 기반 웹 콘텐츠는 지원하지 않는다.
3. **학습 도구 부재**: 기존 플로팅 메모는 비영속적(새로고침 시 소실)이고, 중요 단어 추출/정리 등 능동적 학습 기능이 없다.
4. **플랫폼 한계**: 웹만 지원하며 모바일 환경에서의 접근성이 떨어진다.

### 1.2 Goals

- **G1**: 영상 처리 한도를 2시간(120분)까지 확대하여 장시간 콘텐츠 지원
- **G2**: URL 기반 웹 콘텐츠(신문기사, 블로그) 크롤링 → 번역 → 요약 기능 추가
- **G3**: 영속적 메모 기능 + AI 기반 핵심 단어/내용 자동 정리 기능 추가
- **G4**: Expo 기반 모바일 앱으로 웹 기능 확장 (MVP)

### 1.3 Non-Goals (Out of Scope)

- 사용자 인증/계정 시스템 (해커톤 범위 밖)
- PDF, eBook 등 파일 업로드 기반 콘텐츠 지원
- 오프라인 모드
- 다국어 지원 확대 (현재 EN→KO 유지)
- 앱 스토어 배포

### 1.4 Scope

| 포함 | 제외 |
|------|------|
| 영상 길이 제한 확대 (2시간) | 실시간 스트리밍 영상 지원 |
| 긴 트랜스크립트 청킹 처리 | 자체 STT 서버 구축 |
| 웹 URL 크롤링 + 번역/요약 | 로그인 기반 크롤링 (paywall) |
| 메모 영속화 + AI 키워드 추출 | 클라우드 동기화 |
| Expo 모바일 앱 MVP | 네이티브 모듈, 앱 스토어 배포 |

### 1.5 Hackathon Priority (5시간 기준)

| 우선순위 | 기능 | 예상 비중 |
|---------|------|----------|
| **P0 (Must)** | 영상 길이 확대 + 청킹 | ~30% |
| **P0 (Must)** | 웹 URL 크롤링/번역/요약 | ~30% |
| **P1 (Should)** | 메모 기능 강화 | ~20% |
| **P2 (Could)** | Expo 모바일 앱 MVP | ~20% |

---

## 2. User Stories

### 2.1 영상 길이 확대

**US-001**: As a 학습자, I want to 2시간짜리 대학 강의 영상을 분석할 수 있도록 so that 긴 강의도 번역/요약을 통해 효율적으로 학습할 수 있다.

**Acceptance Criteria**:
```gherkin
Scenario: 2시간 영상 분석
  Given 사용자가 120분짜리 YouTube 영상 URL을 입력했을 때
  When 분석 요청을 보내면
  Then 트랜스크립트가 청크 단위로 분할 처리되고
  And 각 청크별 번역/분석 결과가 스트리밍으로 점진적 표시되며
  And 전체 요약이 최종 생성된다

Scenario: 긴 트랜스크립트 청킹
  Given 트랜스크립트가 50,000자를 초과하는 경우
  When AI 분석을 수행하면
  Then 트랜스크립트를 적절한 크기의 청크로 분할하고
  And 각 청크별로 분석한 후 결과를 병합한다
```

### 2.2 웹 URL 콘텐츠 번역/요약

**US-002**: As a 사용자, I want to 영어 신문기사 URL을 입력하면 번역/요약을 볼 수 있도록 so that 외국 뉴스를 빠르게 파악할 수 있다.

**Acceptance Criteria**:
```gherkin
Scenario: 신문기사 URL 분석
  Given 사용자가 영어 신문기사 URL을 입력했을 때
  When 분석 요청을 보내면
  Then 기사 본문을 크롤링하여 추출하고
  And 한국어로 번역하여 표시하고
  And AI 요약, 키워드, 하이라이트를 생성한다

Scenario: 지원하지 않는 URL
  Given 사용자가 로그인이 필요한 URL을 입력했을 때
  When 크롤링이 실패하면
  Then "접근할 수 없는 콘텐츠입니다" 오류 메시지를 표시한다
```

### 2.3 메모/노트 기능

**US-003**: As a 학습자, I want to 영상 스크립트에서 중요 단어를 자동 추출하고 메모를 저장할 수 있도록 so that 학습 내용을 체계적으로 정리할 수 있다.

**Acceptance Criteria**:
```gherkin
Scenario: AI 키워드 자동 추출
  Given 영상 분석이 완료된 상태에서
  When 사용자가 "핵심 정리" 버튼을 클릭하면
  Then 중요 단어 목록(영어-한국어)이 자동 생성되고
  And 주요 내용이 bullet point로 요약된다

Scenario: 메모 영속화
  Given 사용자가 메모를 작성한 상태에서
  When 페이지를 새로고침하면
  Then 이전에 작성한 메모가 localStorage에서 복원된다

Scenario: 메모 내보내기
  Given 메모와 AI 키워드가 모두 존재할 때
  When 사용자가 내보내기를 클릭하면
  Then 메모 + 키워드 + 요약이 하나의 파일로 다운로드된다
```

### 2.4 모바일 앱 (Expo)

**US-004**: As a 모바일 사용자, I want to 스마트폰에서도 영상 분석과 URL 번역을 사용할 수 있도록 so that 이동 중에도 학습할 수 있다.

**Acceptance Criteria**:
```gherkin
Scenario: 모바일에서 영상 분석
  Given 사용자가 Expo 앱을 열었을 때
  When YouTube URL을 입력하고 분석을 요청하면
  Then 웹과 동일한 분석 결과(번역, 요약, 키워드)를 표시한다

Scenario: 모바일에서 URL 분석
  Given 사용자가 Expo 앱에서 신문기사 URL을 입력하면
  When 분석이 완료되면
  Then 번역된 기사와 요약을 모바일 최적화된 레이아웃으로 표시한다
```

---

## 3. Functional Requirements

### 3.1 영상 길이 확대 (P0)

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-001 | `MAX_VIDEO_DURATION_MINUTES`를 120으로 확대 | P0 | - |
| FR-002 | `MAX_TRANSCRIPT_LENGTH`를 200,000자로 확대 | P0 | - |
| FR-003 | `MAX_SEGMENTS_COUNT`를 5,000으로 확대 | P0 | - |
| FR-004 | 트랜스크립트 청킹: 긴 텍스트를 LLM 컨텍스트 윈도우에 맞게 분할 | P0 | FR-002 |
| FR-005 | 청크별 번역 처리 후 결과 병합 | P0 | FR-004 |
| FR-006 | 청크별 분석(요약/키워드) 후 최종 통합 요약 생성 | P0 | FR-004 |
| FR-007 | STT 타임아웃을 긴 영상에 맞게 확대 (600초) | P0 | FR-001 |
| FR-008 | 프론트엔드 프로그레스 표시 (청크 진행률) | P1 | FR-004 |

### 3.2 웹 URL 크롤링/번역/요약 (P0)

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-101 | URL 입력 시 YouTube vs 일반 웹 URL 자동 판별 | P0 | - |
| FR-102 | 웹 페이지 크롤링 (본문 추출, 불필요 요소 제거) | P0 | - |
| FR-103 | 크롤링된 기사 본문 한국어 번역 | P0 | FR-102 |
| FR-104 | 기사 AI 분석 (요약, 키워드, 핵심 포인트) | P0 | FR-102 |
| FR-105 | 기사 분석 결과 전용 UI (원문/번역 토글) | P0 | FR-103, FR-104 |
| FR-106 | 크롤링 실패 시 에러 핸들링 (paywall, 404 등) | P1 | FR-102 |
| FR-107 | 크롤링 결과 캐싱 (URL 기반, 1시간 TTL) | P1 | FR-102 |

### 3.3 메모/노트 기능 강화 (P1)

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-201 | 기존 플로팅 메모에 localStorage 영속화 추가 | P1 | - |
| FR-202 | AI 핵심 단어 추출 (영어-한국어 쌍, 정의 포함) | P1 | - |
| FR-203 | AI 내용 정리 (bullet point 요약) | P1 | - |
| FR-204 | 메모 + AI 정리 통합 내보내기 (Markdown 파일) | P1 | FR-201, FR-202, FR-203 |
| FR-205 | 콘텐츠 유형별(영상/기사) 메모 분리 저장 | P2 | FR-201 |
| FR-206 | 메모 목록 관리 (이전 메모 열람/삭제) | P2 | FR-201 |

### 3.4 모바일 앱 - Expo (P2)

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-301 | Expo 프로젝트 초기 설정 (React Native) | P2 | - |
| FR-302 | URL 입력 화면 (YouTube + 웹 URL) | P2 | FR-301 |
| FR-303 | 분석 결과 화면 (번역, 요약, 키워드) | P2 | FR-301 |
| FR-304 | 기존 NestJS API와 연동 | P2 | FR-301 |
| FR-305 | 메모 기능 (AsyncStorage 영속화) | P2 | FR-301 |
| FR-306 | 공유 기능 (시스템 공유 시트) | P3 | FR-303 |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| 항목 | 현재 | 목표 |
|------|------|------|
| 최대 영상 길이 | 25분 | 120분 |
| 트랜스크립트 처리 | 50,000자 | 200,000자 |
| 세그먼트 수 | 1,000 | 5,000 |
| 분석 응답 (30분 영상) | ~30초 | ~30초 (유지) |
| 분석 응답 (120분 영상) | N/A | ~120초 (청킹 포함) |
| 기사 크롤링 + 번역 | N/A | < 15초 |

### 4.2 Security

- 웹 크롤링 시 SSRF 방지 (private IP 차단)
- 크롤링 대상 URL 화이트리스트/블랙리스트 없음 (공개 URL만 대상)
- Rate limiting 유지 (기존 설정)

### 4.3 Reliability

- 청크 처리 중 일부 실패 시 나머지 결과만 반환 (graceful degradation)
- 크롤링 실패 시 명확한 에러 메시지 제공
- 기존 YouTube 분석 기능에 영향 없음 (하위 호환)

---

## 5. Technical Design

### 5.1 Architecture Changes

```
현재 Flow:
  YouTube URL → NestJS API → FastAPI AI → OpenAI

추가 Flow:
  Web URL → NestJS API → [크롤링] → FastAPI AI → OpenAI
                            ↓
                       본문 추출 (readability)
```

### 5.2 영상 길이 확대 - 청킹 전략

```
긴 트랜스크립트 (> 15,000 토큰)
       ↓
  청크 분할 (시간 기반, ~15분 단위)
       ↓
  ┌────────────────────────┐
  │ Chunk 1: 0~15분        │→ 번역 + 분석
  │ Chunk 2: 15~30분       │→ 번역 + 분석
  │ ...                    │→ ...
  │ Chunk N: 105~120분     │→ 번역 + 분석
  └────────────────────────┘
       ↓
  통합 요약 (모든 청크 분석 결과 기반)
       ↓
  최종 결과: 전체 요약 + 청크별 번역 + 통합 키워드
```

**청킹 규칙**:
- 청크 크기: 약 12,000자 (LLM 컨텍스트 여유 확보)
- 분할 기준: 타임스탬프 기반으로 자연스러운 구간 분할
- 오버랩: 청크 간 500자 오버랩으로 문맥 유지

### 5.3 웹 크롤링 아키텍처

```
NestJS API (새 모듈: ArticleModule)
  ├── ArticleController
  │     └── POST /api/v1/article/analyze
  ├── ArticleService
  │     ├── fetchAndParse(url) → 본문 추출
  │     └── 캐싱 (URL 기반)
  └── 사용 라이브러리:
        ├── axios (HTTP fetch)
        ├── cheerio (HTML 파싱)
        └── @mozilla/readability (본문 추출)
```

### 5.4 메모 기능 강화

```
현재: React useState (비영속)
  ↓
변경: localStorage 기반 영속화
  ├── Key: wigvu_memo_{contentId}
  ├── Value: { text, keywords, summary, updatedAt }
  └── 자동 저장: debounce 1초

AI 키워드 추출:
  POST /api/v1/analyze 응답에 vocabulary 필드 추가
  └── { word: string, translation: string, definition: string }[]
```

### 5.5 API Specification

---

#### API: Article Analysis (새로 추가)

#### `POST /api/v1/article/analyze`

**Description**: 웹 URL 콘텐츠를 크롤링하여 번역/요약/키워드 분석

**Authentication**: None (기존 패턴 유지)

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | application/json |

**Request Body**:
```json
{
  "url": "string (required) - 분석할 웹 페이지 URL",
  "language": "string (optional) - 원문 언어, default: 'auto'"
}
```

**Request Example**:
```json
{
  "url": "https://www.nytimes.com/2026/02/04/technology/ai-news.html",
  "language": "en"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "metadata": {
      "title": "string - 기사 제목",
      "siteName": "string - 사이트명",
      "author": "string | null - 저자",
      "publishedDate": "string | null - 발행일 (ISO 8601)",
      "url": "string - 원본 URL",
      "language": "string - 감지된 언어"
    },
    "content": {
      "original": "string - 원문 텍스트",
      "translated": "string - 번역된 텍스트",
      "length": "number - 원문 글자 수"
    },
    "analysis": {
      "summary": "string - AI 요약 (한국어)",
      "keywords": [
        {
          "word": "string - 영어 키워드",
          "translation": "string - 한국어 번역",
          "importance": "number (1-10) - 중요도"
        }
      ],
      "keyPoints": [
        "string - 핵심 포인트 (한국어)"
      ],
      "difficulty": "string - 난이도 (easy | medium | hard)"
    },
    "vocabulary": [
      {
        "word": "string - 영어 단어",
        "translation": "string - 한국어 뜻",
        "definition": "string - 영어 정의",
        "example": "string - 기사 내 사용 예문"
      }
    ]
  },
  "meta": {
    "timestamp": "string (ISO 8601)",
    "processingTime": "number - 처리 시간 (ms)"
  }
}
```

**Error Responses**:
| Status | Code | Message | Description |
|--------|------|---------|-------------|
| 400 | INVALID_URL | Invalid URL format | URL 형식 오류 |
| 400 | UNSUPPORTED_URL | URL is not accessible | 접근 불가 URL |
| 403 | CRAWL_BLOCKED | Content is behind a paywall | 페이월/로그인 필요 |
| 404 | PAGE_NOT_FOUND | Page not found | 페이지 없음 |
| 408 | CRAWL_TIMEOUT | Crawling timed out | 크롤링 타임아웃 |
| 422 | CONTENT_TOO_SHORT | Not enough content to analyze | 본문 너무 짧음 |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests | 요청 제한 초과 |
| 500 | CRAWL_ERROR | Failed to crawl content | 크롤링 실패 |

---

#### API: Vocabulary/Keyword Extraction (기존 분석에 추가)

#### `POST /api/v1/analyze` (기존 엔드포인트 확장)

**변경사항**: 기존 응답에 `vocabulary` 필드 추가

**추가 응답 필드**:
```json
{
  "vocabulary": [
    {
      "word": "string - 중요 영어 단어/표현",
      "translation": "string - 한국어 뜻",
      "definition": "string - 영어 정의",
      "example": "string - 스크립트 내 사용 예문"
    }
  ]
}
```

---

#### API: Chunked Analysis (긴 영상용, 내부 처리)

긴 트랜스크립트는 기존 `/api/v1/analyze` 엔드포인트 내부에서 자동 청킹 처리.
외부 API 변경 없음 (하위 호환 유지).

**내부 처리 로직**:
```
1. 트랜스크립트 길이 확인
2. 15,000자 초과 시 청크 분할
3. 각 청크 병렬 분석 (Promise.allSettled)
4. 결과 병합:
   - 번역: 청크 순서대로 연결
   - 요약: 모든 청크 요약을 통합 요약으로 재생성
   - 키워드: 중복 제거 후 병합
   - 하이라이트: 타임스탬프 유지하며 병합
5. 단일 응답으로 반환
```

---

### 5.6 Database Schema

데이터베이스 없음 (기존 아키텍처 유지). 메모는 클라이언트 localStorage에 저장.

```typescript
// localStorage schema
interface MemoData {
  contentId: string;        // videoId 또는 URL hash
  contentType: 'video' | 'article';
  title: string;
  text: string;             // 사용자 메모 텍스트
  vocabulary: VocabItem[];  // AI 추출 단어
  keyPoints: string[];      // AI 핵심 정리
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}
```

---

## 6. Implementation Phases

### Phase 1: 영상 길이 확대 + 청킹 (P0)

- [ ] 환경변수 업데이트 (`MAX_VIDEO_DURATION_MINUTES=120`, `MAX_TRANSCRIPT_LENGTH=200000`, `MAX_SEGMENTS_COUNT=5000`)
- [ ] AI 서비스: 트랜스크립트 청킹 로직 구현 (`apps/ai/app/services/`)
- [ ] AI 서비스: 청크별 번역 + 분석 → 결과 병합 로직
- [ ] API: 타임아웃 확대 (`TIMEOUT_STT=600`, `TIMEOUT_ANALYZE=120`)
- [ ] 프론트엔드: 청킹 진행률 표시 UI
- [ ] 프론트엔드: 상수 업데이트 (`apps/web/src/lib/constants.ts`)

**Deliverable**: 2시간 영상 분석 가능

### Phase 2: 웹 URL 크롤링/번역/요약 (P0)

- [ ] API: ArticleModule 생성 (`apps/api/src/modules/article/`)
- [ ] API: 웹 크롤링 서비스 (cheerio + @mozilla/readability)
- [ ] API: URL 판별 로직 (YouTube vs 일반 URL)
- [ ] AI 서비스: 기사 분석 엔드포인트 (번역 + 요약 + 키워드)
- [ ] 프론트엔드: URL 입력 UI 통합 (YouTube/웹 자동 판별)
- [ ] 프론트엔드: 기사 분석 결과 뷰 (원문/번역 토글)

**Deliverable**: 신문기사 URL 입력 → 번역/요약 결과 표시

### Phase 3: 메모 기능 강화 (P1)

- [ ] 플로팅 메모 localStorage 영속화
- [ ] AI vocabulary 추출 (분석 응답에 추가)
- [ ] "핵심 정리" 버튼 + AI 정리 UI
- [ ] 통합 내보내기 (메모 + 키워드 + 요약 → Markdown)

**Deliverable**: 영속적 메모 + AI 키워드 자동 정리

### Phase 4: Expo 모바일 앱 MVP (P2)

- [ ] Expo 프로젝트 초기화 (`apps/mobile/`)
- [ ] URL 입력 화면
- [ ] 분석 결과 화면 (WebView 또는 Native)
- [ ] API 연동 서비스
- [ ] 메모 기능 (AsyncStorage)

**Deliverable**: 모바일에서 기본 분석 기능 사용 가능

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 2시간 영상 분석 성공 | 100% | 120분 영상 테스트 |
| 청킹 분석 결과 품질 | 단일 분석 대비 90% 이상 | 수동 비교 |
| 기사 크롤링 성공률 | 주요 영문 매체 90%+ | NYT, BBC, CNN 등 테스트 |
| 기사 분석 응답 시간 | < 15초 | 성능 측정 |
| 메모 데이터 영속성 | 새로고침 후 100% 복원 | 기능 테스트 |
| 모바일 앱 핵심 기능 | 영상+기사 분석 동작 | Expo Go 테스트 |

---

## 8. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 긴 영상 STT 타임아웃 | High | Medium | YouTube 자막 fallback, 타임아웃 확대 |
| 청킹 분석 결과 품질 저하 | Medium | Medium | 오버랩 구간 설정, 통합 요약 2차 처리 |
| 웹 크롤링 차단 | Medium | High | User-Agent 설정, 에러 핸들링 |
| OpenAI API 비용 증가 | Medium | High | 청크 수 제한, 캐싱 적극 활용 |
| 5시간 내 P2 미완성 | Low | High | P0/P1 우선 완료, P2는 bonus |

---

## 9. Technical Dependencies

### 새로 추가할 패키지

**API (NestJS)**:
```json
{
  "cheerio": "^1.0.0",
  "@mozilla/readability": "^0.5.0",
  "jsdom": "^25.0.0"
}
```

**Mobile (Expo)**:
```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "react-native": "0.76.x",
  "@react-native-async-storage/async-storage": "^2.0.0",
  "expo-clipboard": "~7.0.0",
  "expo-sharing": "~13.0.0"
}
```
