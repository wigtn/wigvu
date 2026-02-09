# WIGVU v2 — URL 기반 학습 플랫폼 PRD

> **Version**: 2.0
> **Created**: 2026-02-10
> **Status**: Active
> **Supersedes**: PRD_news-reader-study.md, PRD_wigvu-v2-enhancement.md, PRD_wigvu-v2-hackathon.md (폐기)

---

## 1. Overview

### 1.1 Product Vision

WIGVU(윅뷰)는 **URL을 입력하면 학습 콘텐츠로 변환하는 플랫폼**입니다.

| 기능 | 입력 | 출력 | 우선순위 |
|------|------|------|---------|
| **News Reader** | 영어 뉴스 기사 URL/텍스트 | 문장별 번역, 숙어 추출, 구조 파싱, 팝오버 | **Primary** |
| **Video Analyzer** | YouTube URL | 자막 추출, 번역, AI 요약, 시청점수 | Secondary (기존) |

### 1.2 Goals

- **G1**: 영어 뉴스 기사를 문장 단위로 번역하고, 숙어/표현을 자동 추출
- **G2**: 어려운 문장의 구조를 분석하고, 한국어 읽는 순서를 안내
- **G3**: 텍스트 선택 시 팝오버로 즉시 뜻/문맥 해석 제공
- **G4**: 기존 Video Analyzer 기능 유지 (하위 호환)
- **G5**: Clean Architecture + 기능 단위 분리로 코드베이스 정비
- **G6**: Supabase 기반 Auth/DB 도입 준비 (Phase 3)

### 1.3 Non-Goals (Out of Scope)

- 기사 크롤링/큐레이션 서비스 (사용자가 직접 입력)
- 로그인/회원가입 (Phase 3에서 Supabase로 도입)
- 단어장/복습 기능 (Phase 3에서 Supabase DB와 함께)
- 유료 결제/프리미엄 기능
- 모바일 네이티브 앱
- YouTube 이외 영상 플랫폼 지원
- 다국어 UI (한국어 사용자 타겟)

### 1.4 Scope (Phase 1+2)

| 포함 | 제외 |
|------|------|
| URL 입력 → 서버사이드 기사 크롤링 (NestJS) | 클라이언트 사이드 fetch (CORS 문제) |
| 문장 단위 번역 (OpenAI, 서버 Key) | BYOK (사용자 API Key) |
| 숙어/표현 AI 추출 | 사전 DB 구축 |
| 문장 구조 파싱 (AI) | 문법 교정 |
| 하이라이트 팝오버 (단어/구문 조회) | 브라우저 확장 프로그램 |
| 표시 모드 토글 (양쪽/원문/번역) | PDF/이미지 OCR |
| SSE 스트리밍 진행률 | 실시간 음성 통역 |
| 텍스트 직접 붙여넣기 | |
| 폴더 구조 리팩토링 (Clean Architecture) | |

---

## 2. Architecture

### 2.1 System Architecture (Monorepo MSA)

```
┌──────────────────────────────────────────────────────────────┐
│                     Nginx (SSL/TLS)                          │
└──────────┬───────────────────────────────┬───────────────────┘
           │                               │
┌──────────▼──────────┐     ┌──────────────▼──────────────────┐
│     Web (Next.js)   │     │          API (NestJS)           │
│     Port 3000       │     │          Port 4000              │
│                     │     │                                  │
│  ┌───────────────┐  │     │  ┌────────────┐ ┌────────────┐  │
│  │ features/     │  │────▶│  │ article/   │ │ video/     │  │
│  │  article/     │  │     │  │ Module     │ │ Module     │  │
│  │  video/       │  │     │  └─────┬──────┘ └─────┬──────┘  │
│  │  shared/      │  │     │        │              │          │
│  └───────────────┘  │     │  ┌─────▼──────────────▼──────┐  │
│                     │     │  │    translate/ Module       │  │
└─────────────────────┘     │  └─────────────┬─────────────┘  │
                            └────────────────┼────────────────┘
                                             │
                            ┌────────────────▼────────────────┐
                            │          AI (FastAPI)            │
                            │          Port 5000               │
                            │                                  │
                            │  ┌────────────┐ ┌────────────┐  │
                            │  │ article/   │ │ video/     │  │
                            │  │ analyze    │ │ analyze    │  │
                            │  │ parse      │ │ translate  │  │
                            │  │ lookup     │ │ stt        │  │
                            │  └────────────┘ └────────────┘  │
                            │               │                  │
                            └───────────────┼──────────────────┘
                                            │
                                    ┌───────▼───────┐
                                    │   OpenAI API  │
                                    │   GPT-4o-mini │
                                    └───────────────┘

  [Phase 3]
  ┌─────────────────┐
  │  Supabase       │
  │  (Cloud)        │
  │  ├─ PostgreSQL  │
  │  ├─ Auth (SSO)  │
  │  └─ Storage     │
  └─────────────────┘
```

### 2.2 Clean Architecture (레이어 규칙)

```
Presentation → Application → Domain ← Infrastructure
(Controllers)  (Use Cases)  (Entities)  (External Services)

의존성 방향: 바깥 → 안쪽 (Domain은 아무것도 의존하지 않음)
```

**NestJS 모듈별 적용**:

```
modules/{feature}/
├── {feature}.module.ts          # NestJS Module 정의
├── presentation/
│   └── {feature}.controller.ts  # HTTP 엔드포인트 (입출력만 처리)
├── application/
│   ├── dto/                     # Request/Response DTO (유효성 검증)
│   └── use-cases/               # 비즈니스 로직 오케스트레이션
├── domain/
│   ├── entities/                # 핵심 엔티티 (외부 의존 없음)
│   └── interfaces/              # 포트 (추상 인터페이스)
└── infrastructure/
    └── services/                # 외부 서비스 어댑터 (AI Client, Crawler 등)
```

**FastAPI 서비스별 적용**:

```
app/
├── api/{feature}/               # Presentation (라우터/핸들러)
├── services/{feature}/          # Application + Domain (비즈니스 로직)
├── models/                      # Domain (Pydantic 스키마)
└── core/                        # Infrastructure (미들웨어, 에러처리)
```

**Next.js 기능 단위 적용**:

```
src/
├── app/                         # Pages (App Router, 라우팅만)
├── features/{feature}/          # 기능별 모듈
│   ├── components/              # 해당 기능 전용 UI
│   ├── hooks/                   # 해당 기능 전용 훅
│   ├── lib/                     # 해당 기능 전용 유틸/서비스
│   └── types/                   # 해당 기능 전용 타입
└── shared/                      # 공유 모듈 (UI 컴포넌트, 유틸)
```

### 2.3 Folder Structure — Current → Target

#### 2.3.1 Web (Next.js)

```
apps/web/src/
├── app/                                    # Pages (라우팅만)
│   ├── layout.tsx                          ← 유지
│   ├── page.tsx                            ← 리팩토링 (공통 랜딩)
│   ├── globals.css                         ← 유지
│   ├── read/[articleId]/
│   │   └── page.tsx                        ← 신규 (기사 학습 뷰)
│   ├── analyze/[videoId]/
│   │   └── page.tsx                        ← 유지
│   └── api/
│       ├── analyze/                        ← 유지 (Video)
│       │   ├── route.ts
│       │   └── stream/route.ts
│       └── article/                        ← 신규 (Article)
│           ├── route.ts
│           └── stream/route.ts
│
├── features/                               ← 신규 디렉토리
│   ├── article/                            ← 신규 (News Reader)
│   │   ├── components/
│   │   │   ├── article-panel.tsx           ← 신규 (ScriptPanel 기반)
│   │   │   ├── expression-bar.tsx          ← 신규 (KeyMomentsBar 기반)
│   │   │   ├── sentence-parser.tsx         ← 신규
│   │   │   └── selection-popover.tsx       ← 신규
│   │   ├── hooks/
│   │   │   ├── use-article-analysis.ts     ← 신규 (useAnalysisStream 기반)
│   │   │   └── use-text-selection.ts       ← 신규
│   │   ├── lib/
│   │   │   └── article-service.ts          ← 신규
│   │   └── types/
│   │       └── article.ts                  ← 신규
│   │
│   └── video/                              ← 기존 코드 이동
│       ├── components/
│       │   ├── script-panel.tsx            ← from components/
│       │   ├── analysis-result.tsx         ← from components/
│       │   ├── analysis-view.tsx           ← from components/
│       │   └── key-moments-bar.tsx         ← from components/
│       ├── hooks/
│       │   ├── use-analysis-stream.ts      ← from hooks/
│       │   └── use-video-sync.ts           ← from hooks/
│       ├── lib/
│       │   ├── ai-analysis.ts              ← from lib/services/
│       │   ├── transcript.ts               ← from lib/services/
│       │   ├── youtube-metadata.ts         ← from lib/services/
│       │   ├── youtube.ts                  ← from lib/
│       │   └── youtube-api-loader.ts       ← from lib/
│       ├── store/
│       │   └── analysis-store.ts           ← from store/
│       └── types/
│           ├── analysis.ts                 ← from types/
│           └── youtube.ts                  ← from types/
│
├── shared/                                 ← 신규 디렉토리
│   ├── components/
│   │   ├── ui/                             ← from components/ui/ (전체)
│   │   ├── error-boundary.tsx              ← from components/
│   │   ├── error-display.tsx               ← from components/
│   │   ├── floating-memo.tsx               ← from components/
│   │   ├── loading-state.tsx               ← from components/
│   │   ├── navigation.tsx                  ← from components/
│   │   ├── url-input.tsx                   ← from components/ (확장)
│   │   ├── theme-toggle.tsx                ← from components/
│   │   └── providers.tsx                   ← from components/
│   ├── hooks/                              ← (공유 훅 필요 시)
│   ├── lib/
│   │   ├── config/env.ts                   ← from lib/config/
│   │   ├── errors/                         ← from lib/errors/ (전체)
│   │   ├── services/translation.ts         ← from lib/services/
│   │   ├── logger.ts                       ← from lib/
│   │   ├── constants.ts                    ← from lib/
│   │   └── utils.ts                        ← from lib/
│   └── types/                              ← (공유 타입)
│       └── common.ts                       ← 신규
│
├── components/                             ← 삭제 (shared/로 이동)
├── hooks/                                  ← 삭제 (features/로 이동)
├── lib/                                    ← 삭제 (shared/로 이동)
├── store/                                  ← 삭제 (features/로 이동)
├── types/                                  ← 삭제 (features/로 이동)
└── mocks/                                  ← 유지 (개발용)
```

#### 2.3.2 API (NestJS)

```
apps/api/src/
├── main.ts                                 ← 유지
├── app.module.ts                           ← 업데이트 (ArticleModule 추가)
│
├── modules/
│   ├── article/                            ← 신규 (News Reader)
│   │   ├── article.module.ts
│   │   ├── presentation/
│   │   │   └── article.controller.ts
│   │   ├── application/
│   │   │   ├── dto/
│   │   │   │   └── article.dto.ts
│   │   │   └── use-cases/
│   │   │       ├── analyze-article.use-case.ts
│   │   │       ├── parse-sentence.use-case.ts
│   │   │       └── lookup-word.use-case.ts
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── article.entity.ts
│   │   │   └── interfaces/
│   │   │       ├── article-crawler.interface.ts
│   │   │       └── article-analyzer.interface.ts
│   │   └── infrastructure/
│   │       └── services/
│   │           └── web-crawler.service.ts  ← cheerio + readability
│   │
│   ├── analysis/                           ← 유지 (기존 Video)
│   │   ├── analysis.module.ts
│   │   ├── analysis.controller.ts
│   │   ├── analysis.service.ts
│   │   └── dto/
│   │
│   ├── youtube/                            ← 유지
│   ├── transcript/                         ← 유지
│   ├── translate/                          ← 유지 (article에서도 공유)
│   └── health/                             ← 유지
│
├── services/                               ← 유지 (공유 인프라)
│   ├── ai-client.service.ts
│   ├── ai-client.module.ts
│   └── audio-download.service.ts
│
└── common/                                 ← 유지
    ├── config/
    ├── dto/
    ├── exceptions/
    ├── filters/
    └── interceptors/
```

#### 2.3.3 AI (FastAPI)

```
apps/ai/app/
├── config.py                               ← 업데이트
├── api/
│   ├── router.py                           ← 업데이트 (article 라우터 추가)
│   ├── health.py                           ← 유지
│   ├── article/                            ← 신규
│   │   ├── __init__.py
│   │   ├── analyze.py                      ← 기사 번역 + 표현 추출
│   │   ├── parse_sentence.py               ← 문장 구조 파싱
│   │   └── word_lookup.py                  ← 단어/구문 조회
│   ├── video/                              ← 기존 코드 이동
│   │   ├── __init__.py
│   │   ├── analyze.py                      ← from api/analyze.py
│   │   └── translate.py                    ← from api/translate.py
│   └── stt/                                ← 기존 코드 이동
│       ├── __init__.py
│       └── stt.py                          ← from api/stt.py
│
├── services/
│   ├── article/                            ← 신규
│   │   ├── __init__.py
│   │   ├── article_analyzer.py             ← 번역 + 표현 추출 LLM 로직
│   │   ├── sentence_parser.py              ← 문장 구조 분석 LLM 로직
│   │   └── word_lookup.py                  ← 단어 조회 LLM 로직
│   ├── video/                              ← 기존 코드 이동
│   │   ├── __init__.py
│   │   ├── llm.py                          ← from services/llm.py
│   │   └── youtube_audio.py                ← from services/youtube_audio.py
│   └── shared/                             ← 공유 서비스
│       ├── __init__.py
│       ├── translation.py                  ← from services/translation.py
│       └── stt_client.py                   ← from services/stt_client.py
│
├── models/                                 ← 업데이트
│   ├── __init__.py
│   ├── schemas.py                          ← 기존 유지
│   └── article_schemas.py                  ← 신규
│
└── core/                                   ← 유지
    ├── middleware.py
    ├── exceptions.py
    ├── error_handlers.py
    └── rate_limiter.py
```

### 2.4 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 16 | App Router, SSR, API Routes |
| | React | 19 | UI |
| | TypeScript | 5 | 타입 안전성 |
| | Tailwind CSS | 4 | 스타일링 |
| | Radix UI | latest | 접근성 컴포넌트 |
| | TanStack Query | 5 | 서버 상태 관리 |
| **API** | NestJS | 10 | API Gateway |
| | Axios | 1.7 | HTTP 클라이언트 |
| | cheerio | 1.x | HTML 파싱 (신규) |
| | @mozilla/readability | 0.5 | 본문 추출 (신규) |
| | jsdom | 25.x | DOM 환경 (신규, readability 의존) |
| **AI** | FastAPI | 0.115+ | AI 서비스 |
| | Python | 3.11 | 런타임 |
| | OpenAI | 1.x | GPT-4o-mini |
| **Infra** | Docker | latest | 컨테이너화 |
| | Nginx | alpine | 리버스 프록시 |
| **[Phase 3]** | Supabase | Cloud | DB + Auth + Storage |

---

## 3. Feature 1: News Reader (Primary)

### 3.1 User Stories

#### US-001: 기사 입력 및 번역
**As a** 영어 학습자, **I want to** 뉴스 기사 URL이나 텍스트를 붙여넣으면 문장 단위로 번역을 볼 수 있도록 **so that** 원문과 번역을 대조하며 읽을 수 있다.

```gherkin
Scenario: URL로 기사 입력
  Given 사용자가 메인 페이지에서
  When 영어 뉴스 기사 URL을 붙여넣고 "분석" 버튼을 누르면
  Then NestJS API가 서버사이드에서 기사를 크롤링하고
  And 각 문장이 원문/한국어 번역 쌍으로 표시된다

Scenario: 텍스트 직접 붙여넣기
  Given 사용자가 메인 페이지에서
  When 영어 텍스트를 직접 붙여넣고 "분석" 버튼을 누르면
  Then 텍스트가 문장 단위로 분리되고
  And 각 문장이 원문/한국어 번역 쌍으로 표시된다
```

#### US-002: 숙어/표현 자동 추출
**As a** 영어 학습자, **I want to** 기사에 포함된 숙어와 핵심 표현을 자동으로 볼 수 있도록 **so that** 모르는 표현을 놓치지 않는다.

```gherkin
Scenario: 기사 분석 완료 후 표현 표시
  Given 기사 분석이 완료되면
  When 학습 뷰가 로드될 때
  Then 기사에서 추출된 숙어/표현 목록이 상단에 표시되고
  And 각 표현에 뜻, 원문 내 사용 예시가 포함된다
```

#### US-003: 문장 구조 파싱
**As a** 영어 학습자, **I want to** 어려운 문장의 구조를 분석받을 수 있도록 **so that** 문장을 어떻게 끊어 읽는지 배울 수 있다.

```gherkin
Scenario: 문장 구조 분석 요청
  Given 라인바이라인 뷰에서
  When 특정 문장의 "구조 분석" 버튼을 클릭하면
  Then AI가 해당 문장의 주어/동사/목적어/수식어를 파싱하고
  And 한국어 읽는 순서가 표시되고
  And 문법 포인트가 설명된다
```

#### US-004: 하이라이트 팝오버
**As a** 영어 학습자, **I want to** 모르는 단어나 구문을 드래그하면 즉시 뜻을 볼 수 있도록 **so that** 흐름을 끊지 않고 학습할 수 있다.

```gherkin
Scenario: 단어 선택 시 팝오버
  Given 기사 원문에서
  When 단어나 구문을 드래그/선택하면
  Then 팝오버가 표시되고
  And 선택한 텍스트의 뜻, 발음기호, 문맥 내 의미가 보인다
```

#### US-005: 표시 모드 전환
**As a** 영어 학습자, **I want to** 원문만/번역만/양쪽 보기를 전환할 수 있도록 **so that** 학습 단계에 맞게 조절할 수 있다.

```gherkin
Scenario: 표시 모드 토글
  Given 학습 뷰에서
  When "원문만" 버튼을 클릭하면
  Then 번역이 숨겨지고 원문만 표시된다
```

### 3.2 Functional Requirements

#### 3.2.1 기사 입력 & 처리

| ID | Requirement | Priority |
|----|------------|----------|
| FR-001 | URL 입력 시 NestJS API에서 서버사이드 크롤링 (cheerio + readability) | P0 |
| FR-002 | 텍스트 직접 붙여넣기 입력 | P0 |
| FR-003 | AI 기반 문장 단위 분리 (약어, 인용문, 숫자 내 마침표 처리) | P0 |
| FR-004 | 기사 메타데이터 추출 (제목, 출처, 날짜) | P1 |
| FR-005 | 크롤링 실패 시 텍스트 붙여넣기 안내 | P1 |

#### 3.2.2 번역 & 표시

| ID | Requirement | Priority |
|----|------------|----------|
| FR-010 | 문장 단위 한국어 번역 (OpenAI API, 서버 Key) | P0 |
| FR-011 | 라인바이라인 원문/번역 대조 뷰 | P0 |
| FR-012 | 표시 모드 토글 (양쪽/원문만/번역만) | P0 |
| FR-013 | SSE 스트리밍 진행률 (단계별 실시간 업데이트) | P1 |

#### 3.2.3 숙어/표현 추출

| ID | Requirement | Priority |
|----|------------|----------|
| FR-020 | AI 기반 숙어/관용표현 자동 추출 (기사당 5-15개) | P0 |
| FR-021 | 각 표현에 한국어 뜻 + 원문 내 사용 위치 표시 | P0 |
| FR-022 | 표현 클릭 시 원문에서 해당 위치 하이라이트 | P1 |

#### 3.2.4 문장 구조 파싱

| ID | Requirement | Priority |
|----|------------|----------|
| FR-030 | 문장별 "구조 분석" 버튼 | P0 |
| FR-031 | AI 문장 구조 파싱 (주어/동사/목적어/수식어 분해) | P0 |
| FR-032 | 한국어 읽는 순서 표시 | P0 |
| FR-033 | 문법 포인트 설명 (분사구문, 관계사절, 가정법 등) | P0 |
| FR-034 | 파싱 결과 접기/펼치기 | P1 |

#### 3.2.5 하이라이트 & 팝오버

| ID | Requirement | Priority |
|----|------------|----------|
| FR-040 | 텍스트 선택 시 팝오버 표시 (Selection API) | P0 |
| FR-041 | 팝오버 내 한국어 뜻 표시 | P0 |
| FR-042 | 팝오버 내 "이 문장에서의 뜻" (문맥 해석) | P0 |
| FR-043 | 발음 기호 표시 | P2 |

### 3.3 API Specification

#### 3.3.1 NestJS → 기사 크롤링 & 분석 요청

##### `POST /api/v1/article/analyze`

**Description**: URL 또는 텍스트를 받아 기사를 크롤링하고, AI 서비스에 분석 요청

**Request Body**:
```json
{
  "url": "string (optional) - 기사 URL",
  "text": "string (optional) - 직접 입력 텍스트 (url 또는 text 중 하나 필수)",
  "title": "string (optional) - 기사 제목 (텍스트 입력 시)"
}
```

**Response**: SSE Stream
```
event: progress
data: {"step": "crawling", "message": "기사 크롤링 중...", "progress": 10}

event: progress
data: {"step": "analyzing", "message": "번역 중... (3/15)", "progress": 40}

event: progress
data: {"step": "extracting", "message": "표현 추출 중...", "progress": 80}

event: result
data: {
  "article": {
    "title": "string",
    "source": "string",
    "author": "string | null",
    "publishedDate": "string | null",
    "url": "string | null"
  },
  "sentences": [
    {
      "id": 0,
      "original": "The Federal Reserve held interest rates steady.",
      "translated": "연방준비제도는 금리를 동결했다."
    }
  ],
  "expressions": [
    {
      "expression": "hold steady",
      "meaning": "동결하다, 안정을 유지하다",
      "category": "phrasal_verb",
      "sentenceId": 0,
      "context": "held interest rates steady"
    }
  ],
  "meta": {
    "sentenceCount": 15,
    "expressionCount": 8,
    "processingTime": 12500
  }
}

event: done
data: {}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INPUT_REQUIRED | URL 또는 텍스트를 입력해주세요 |
| 400 | TEXT_TOO_LONG | 텍스트가 너무 깁니다 (15000자 제한) |
| 403 | CRAWL_BLOCKED | 접근할 수 없는 콘텐츠입니다 (paywall) |
| 408 | CRAWL_TIMEOUT | 크롤링 시간 초과 |
| 422 | CONTENT_TOO_SHORT | 분석할 본문이 충분하지 않습니다 |
| 500 | ANALYSIS_FAILED | 분석에 실패했습니다 |

---

##### `POST /api/v1/article/parse-sentence`

**Description**: 단일 문장의 문법 구조 분석

**Request Body**:
```json
{
  "sentence": "string (required) - 분석할 영어 문장",
  "context": "string (optional) - 전후 문맥"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "components": [
      {
        "id": 0,
        "text": "The Federal Reserve",
        "role": "주어",
        "explanation": "연방준비제도",
        "parentId": null
      },
      {
        "id": 1,
        "text": "held",
        "role": "동사",
        "explanation": "유지했다 (hold의 과거형)",
        "parentId": null
      },
      {
        "id": 2,
        "text": "interest rates",
        "role": "목적어",
        "explanation": "금리를",
        "parentId": null
      },
      {
        "id": 3,
        "text": "steady",
        "role": "보어",
        "explanation": "안정적으로",
        "parentId": null
      },
      {
        "id": 4,
        "text": ", citing persistent inflation concerns",
        "role": "분사구문",
        "explanation": "지속적인 인플레이션 우려를 이유로 들며",
        "parentId": null
      }
    ],
    "readingOrder": "연준은 / 유지했다 / 금리를 / 안정적으로 / 이유를 들며 / 지속적인 인플레이션 우려를",
    "grammarPoints": [
      {
        "type": "분사구문",
        "explanation": "citing = because they cited. 주절의 이유를 보충 설명하는 구문입니다.",
        "highlight": ", citing persistent inflation concerns"
      }
    ]
  }
}
```

---

##### `POST /api/v1/article/word-lookup`

**Description**: 선택한 단어/구문의 뜻을 문맥과 함께 제공

**Request Body**:
```json
{
  "word": "string (required) - 조회할 단어/구문",
  "sentence": "string (required) - 해당 단어가 포함된 원문 문장"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "word": "interest rates",
    "pronunciation": "/ˈɪntrəst reɪts/",
    "meanings": [
      {"definition": "금리, 이자율", "partOfSpeech": "noun"}
    ],
    "contextMeaning": "이 문장에서는 '(중앙은행이 설정하는) 기준 금리'를 의미합니다.",
    "examples": [
      "The central bank raised interest rates.",
      "Low interest rates encourage borrowing."
    ]
  }
}
```

#### 3.3.2 FastAPI AI 서비스 엔드포인트

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/article/analyze` | 기사 번역 + 표현 추출 (OpenAI) |
| `POST /api/v1/article/parse-sentence` | 문장 구조 파싱 (OpenAI) |
| `POST /api/v1/article/word-lookup` | 단어/구문 문맥 해석 (OpenAI) |

NestJS API → FastAPI AI 호출 시 `X-Internal-API-Key` 헤더로 인증 (기존 패턴 동일).

### 3.4 AI Prompts

#### 번역 + 표현 추출 통합 프롬프트

```
System: 당신은 영어 뉴스 기사 학습 도우미입니다.

주어진 영어 기사를 다음 JSON 형식으로 분석해주세요:

1. sentences: 각 문장의 원문과 자연스러운 한국어 번역
2. expressions: 기사에 포함된 숙어, 관용표현, 핵심 어휘 (5-15개)
   - expression: 원문 표현
   - meaning: 한국어 뜻
   - category: "idiom" | "phrasal_verb" | "collocation" | "technical_term"
   - sentenceId: 해당 표현이 사용된 문장 번호 (0-indexed)
   - context: 원문에서 사용된 형태
```

**OpenAI 호출 시**: `response_format: { type: "json_object" }` 필수 사용.

#### 문장 구조 파싱 프롬프트

```
System: 당신은 영어 문장 구조 분석 전문가입니다.
한국인 영어 학습자가 긴 영어 문장을 이해할 수 있도록 도와주세요.

주어진 문장을 다음 JSON 형식으로 분석해주세요:

1. components: 문장 성분별 분해 (중첩 구조 시 parentId로 연결)
   - id: 고유 번호 (0부터)
   - text: 원문 텍스트 조각
   - role: 문법적 역할 (주어/동사/목적어/보어/부사구/관계사절/분사구문/전치사구/접속사/to부정사)
   - explanation: 한국어 뜻
   - parentId: 상위 성분 id (최상위는 null)

2. readingOrder: 한국어 어순으로 재배열한 읽기 순서 (/ 로 구분)

3. grammarPoints: 주요 문법 포인트 (해당 시)
   - type: 문법 항목명
   - explanation: 쉬운 한국어 설명
   - highlight: 해당 부분 원문
```

### 3.5 컴포넌트 재활용 계획

| 기존 컴포넌트 | 새 컴포넌트 | 재활용 방식 |
|--------------|-----------|-----------|
| `ScriptPanel` | `ArticlePanel` | 구조 기반 재작성: 타임스탬프 제거, 구조분석 버튼 추가 |
| `KeyMomentsBar` | `ExpressionBar` | 레이아웃 참고: 가로 스크롤 카드 → 표현 카드 |
| `useAnalysisStream` | `useArticleAnalysis` | SSE 패턴 동일, 이벤트 타입만 변경 |
| `UrlInput` | `UrlInput` (확장) | URL/텍스트 탭 추가, YouTube 검증 분기 |
| `FloatingMemo` | 그대로 사용 | 기사 학습 중 메모용 |
| `LoadingState` | 그대로 사용 | 단계명만 변경 |
| `ui/*` | 그대로 사용 | 변경 없음 |
| `ErrorBoundary`, `ErrorDisplay` | 그대로 사용 | 에러 코드만 추가 |
| `ThemeToggle`, `Providers` | 그대로 사용 | 변경 없음 |

### 3.6 UI Wireframe

#### 메인 페이지 (통합 URL 입력)

```
┌──────────────────────────────────────────────────┐
│  WIGVU                          [다크모드] [GitHub] │
├──────────────────────────────────────────────────┤
│                                                    │
│          URL로 배우는 영어 학습 플랫폼               │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  [📰 기사]  [🎬 영상]              탭 전환    │ │
│  │                                              │ │
│  │  https://bbc.com/news/article...              │ │
│  │                        또는                   │ │
│  │  영어 텍스트를 여기에 붙여넣으세요...          │ │
│  │                                              │ │
│  │                              [분석 시작 →]    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└──────────────────────────────────────────────────┘
```

#### 기사 학습 뷰 (`/read/[articleId]`)

```
┌──────────────────────────────────────────────────┐
│  WIGVU    [← 새 기사]                [다크모드]   │
├──────────────────────────────────────────────────┤
│  BBC News · 2026-02-09                           │
│  "Fed Holds Interest Rates Steady"                │
├──────────────────────────────────────────────────┤
│  📌 주요 표현 (8개)                               │
│  ┌──────┐ ┌──────────┐ ┌──────────┐             │
│  │hold  │ │in light  │ │going     │  ...         │
│  │steady│ │of        │ │forward   │              │
│  │동결   │ │~고려하여  │ │앞으로     │             │
│  └──────┘ └──────────┘ └──────────┘             │
├──────────────────────────────────────────────────┤
│  [양쪽] [원문만] [번역만]                         │
│                                                    │
│  The Federal Reserve held interest rates steady,  │
│  연방준비제도는 금리를 동결했다,              [🔍] │
│  ─────────────────────────────────────────────── │
│  citing persistent inflation concerns.            │
│  지속적인 인플레이션 우려를 이유로 들며.      [🔍] │
│  ─────────────────────────────────────────────── │
│  Chair Powell ████████ a cautious approach        │
│               ↑                                   │
│       ┌───────────────────┐                      │
│       │ signaled           │                      │
│       │ /ˈsɪɡnəld/        │                      │
│       │ 시사하다, 신호를 보내다│                    │
│       │ 이 문장에서:        │                      │
│       │ "(향후 방향을) 시사했다"│                   │
│       └───────────────────┘                      │
│                                                    │
│  ── 🔍 구조 분석 (펼침) ──────────────────────── │
│  │ [The Federal Reserve]  주어   연방준비제도      │
│  │ [held]                 동사   유지했다          │
│  │ [interest rates]       목적어 금리를            │
│  │ [steady]               보어   안정적으로        │
│  │ [, citing ...]         분사구문 ~이유로 들며    │
│  │                                                │
│  │ 읽는 순서:                                     │
│  │ 연준은 / 유지했다 / 금리를 / 안정적으로 /      │
│  │ 이유를 들며 / 지속적인 인플레이션 우려를        │
│  │                                                │
│  │ 💡 분사구문: citing = because they cited        │
│  └────────────────────────────────────────────── │
│                                                    │
└──────────────────────────────────────────────────┘
```

---

## 4. Feature 2: Video Analyzer (Secondary, Existing)

### 4.1 Current State (유지)

기존 구현 완료된 기능으로, Phase 1-2에서는 코드 구조 리팩토링만 진행.

| 기능 | 상태 |
|------|------|
| YouTube URL 입력 & 메타데이터 추출 | Done |
| 자막 추출 (YouTube Captions) | Done |
| STT 폴백 (WhisperX) | Done |
| 영어→한국어 번역 (GPT-4o-mini) | Done |
| AI 분석 (요약, 시청점수, 키워드, 하이라이트) | Done |
| 실시간 스크립트 동기화 | Done |
| SSE 스트리밍 진행률 | Done |
| 플로팅 메모 | Done |

### 4.2 리팩토링 사항

- `components/` → `features/video/components/` 이동
- `hooks/` → `features/video/hooks/` 이동
- `lib/services/` → `features/video/lib/` 이동
- 기능 변경 없음, 폴더 구조만 정리

---

## 5. Feature 3: Auth & Data Persistence (Phase 3 — Supabase)

> Phase 1-2 완료 후 진행. 여기서는 설계만 정의.

### 5.1 Supabase Integration

| Supabase 서비스 | 용도 |
|----------------|------|
| **PostgreSQL** | 사용자, 분석 결과, 단어장, 컬렉션 저장 |
| **Auth** | Google OAuth SSO, 세션 관리 |
| **Storage** | (향후) 내보내기 파일 등 |

### 5.2 SSO (Single Sign-On)

```
사용자 → WIGVU Web → Supabase Auth → Google OAuth 2.0
                                    ← JWT (access + refresh)

- Provider: Google OAuth 2.0 (Supabase Auth에서 설정)
- Token: Supabase가 JWT 발급/갱신/검증 관리
- Session: httpOnly cookie (Supabase SSR helper)
- 추가 Provider: GitHub (향후)
```

**SSO 원칙**:
- 사용자 비밀번호를 직접 관리하지 않음 (OAuth only)
- 세션 토큰은 httpOnly cookie에 저장 (XSS 방어)
- Supabase RLS (Row Level Security)로 데이터 접근 제어
- PKCE flow 사용 (Authorization Code with Proof Key)

### 5.3 Database Schema (Supabase PostgreSQL)

```sql
-- 사용자 (Supabase Auth가 자동 관리, 확장 테이블)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  avatar_url VARCHAR(500),
  tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 단어장
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(200) NOT NULL,
  meaning TEXT NOT NULL,
  context_meaning TEXT,
  pronunciation VARCHAR(100),
  category VARCHAR(20) NOT NULL, -- 'word' | 'expression' | 'idiom'
  source_title VARCHAR(300),
  source_sentence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocabulary_user_id ON public.vocabulary(user_id);

-- 분석 결과 캐시 (기사)
CREATE TABLE public.article_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_hash VARCHAR(64) UNIQUE, -- SHA-256 of URL
  url TEXT,
  title VARCHAR(300),
  source_name VARCHAR(100),
  content_original TEXT NOT NULL,
  analysis_result JSONB NOT NULL, -- sentences + expressions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- 7일 후
);

-- 분석 결과 캐시 (영상)
CREATE TABLE public.video_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id VARCHAR(11) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  channel_name VARCHAR(100),
  analysis_result JSONB NOT NULL,
  transcript_segments JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 사용자-분석 연결
CREATE TABLE public.user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(10) NOT NULL, -- 'article' | 'video'
  analysis_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, analysis_type, analysis_id)
);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own vocabulary" ON public.vocabulary
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analyses" ON public.user_analyses
  FOR ALL USING (auth.uid() = user_id);
```

### 5.4 Vocabulary (단어장) — Phase 3

| 기능 | 설명 |
|------|------|
| 팝오버/표현바에서 저장 | 버튼 클릭 시 Supabase DB에 저장 |
| 단어장 페이지 (`/vocabulary`) | 저장된 단어/표현 목록, 검색, 삭제 |
| JSON 내보내기/가져오기 | 백업/복원 |
| 학습 통계 | 총 저장 수, 오늘 추가 수 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|------------|--------|
| NFR-001 | 페이지 초기 로딩 (LCP) | < 2s |
| NFR-002 | 기사 분석 완료 (1000단어 기준) | < 30s |
| NFR-003 | 팝오버 표시 (단어 조회 응답) | < 2s |
| NFR-004 | 문장 구조 파싱 응답 | < 5s |
| NFR-005 | 기사 크롤링 | < 10s |

### 6.2 Security

| ID | Requirement |
|----|------------|
| NFR-010 | 서버사이드 크롤링 시 SSRF 방지 (private IP 차단) |
| NFR-011 | OpenAI API Key는 서버에만 존재 (클라이언트 노출 금지) |
| NFR-012 | XSS 방지: 크롤링된 HTML 렌더링 시 DOMPurify 사용 |
| NFR-013 | CSP 헤더 적용 (inline script 차단) |
| NFR-014 | Rate Limiting 유지 (기존 60 req/min) |
| NFR-015 | [Phase 3] Supabase RLS로 데이터 접근 제어 |
| NFR-016 | [Phase 3] SSO 토큰은 httpOnly cookie에 저장 |

### 6.3 Accessibility

| ID | Requirement |
|----|------------|
| NFR-020 | 키보드 내비게이션 (Tab, Enter, Escape) |
| NFR-021 | 팝오버 Escape로 닫기 |
| NFR-022 | 적절한 폰트 크기 (본문 16px 이상) |
| NFR-023 | 다크/라이트 모드 지원 |

---

## 7. Implementation Phases

### Phase 1: Architecture Refactoring + News Reader Core

**목표**: 폴더 구조 정비 + 기사 번역/표현 추출 동작

| Step | Task | Files |
|------|------|-------|
| 1.1 | Web: `features/video/`, `shared/` 디렉토리 생성 & 기존 코드 이동 | ~30 파일 이동 |
| 1.2 | Web: import 경로 전체 업데이트 | 영향받는 모든 파일 |
| 1.3 | API: `article/` 모듈 생성 (Clean Architecture 구조) | 신규 ~8 파일 |
| 1.4 | API: `web-crawler.service.ts` 구현 (cheerio + readability) | 신규 1 파일 |
| 1.5 | API: `analyze-article.use-case.ts` 구현 (AI 서비스 호출) | 신규 1 파일 |
| 1.6 | AI: `api/article/`, `services/article/` 디렉토리 생성 | 신규 ~6 파일 |
| 1.7 | AI: `article_analyzer.py` 구현 (번역 + 표현 추출 프롬프트) | 신규 1 파일 |
| 1.8 | AI: 기존 `api/analyze.py` → `api/video/analyze.py` 이동 | 파일 이동 |
| 1.9 | Web: `features/article/` 디렉토리 생성 | 신규 디렉토리 |
| 1.10 | Web: `ArticlePanel` 컴포넌트 (ScriptPanel 기반) | 신규 1 파일 |
| 1.11 | Web: `ExpressionBar` 컴포넌트 (KeyMomentsBar 기반) | 신규 1 파일 |
| 1.12 | Web: `useArticleAnalysis` 훅 (SSE 스트리밍) | 신규 1 파일 |
| 1.13 | Web: `UrlInput` 확장 (기사/영상 탭 전환) | 기존 수정 |
| 1.14 | Web: `/read/[articleId]` 페이지 | 신규 1 파일 |
| 1.15 | Web: 메인 페이지 리팩토링 (통합 랜딩) | 기존 수정 |

**Deliverable**: URL/텍스트 입력 → 문장별 번역 + 표현 추출 동작

### Phase 2: News Reader Deep Learning

**목표**: 문장 구조 분석 + 하이라이트 팝오버

| Step | Task |
|------|------|
| 2.1 | API: `parse-sentence.use-case.ts`, `lookup-word.use-case.ts` 구현 |
| 2.2 | AI: `sentence_parser.py`, `word_lookup.py` 구현 |
| 2.3 | Web: `SentenceParser` 컴포넌트 (구조 분석 결과 UI) |
| 2.4 | Web: `useTextSelection` 훅 (텍스트 선택 감지) |
| 2.5 | Web: `SelectionPopover` 컴포넌트 (팝오버 UI + API 호출) |
| 2.6 | Web: 표시 모드 토글 (양쪽/원문만/번역만) |
| 2.7 | 반응형 모바일 최적화 |
| 2.8 | 통합 테스트 (주요 영문 매체 5곳) |

**Deliverable**: 문장 구조 분석 + 하이라이트 팝오버 + 표시 모드 동작

### Phase 3: Auth & Data Persistence (Supabase)

> News Reader Phase 1-2 완료 후 착수.

| Step | Task |
|------|------|
| 3.1 | Supabase 프로젝트 생성 & Google OAuth 설정 |
| 3.2 | Web: Supabase Auth 연동 (로그인/로그아웃 UI) |
| 3.3 | Supabase DB 스키마 생성 (profiles, vocabulary, analyses) |
| 3.4 | RLS 정책 적용 |
| 3.5 | 단어장 기능 구현 (팝오버/표현바 → DB 저장) |
| 3.6 | `/vocabulary` 페이지 (목록, 검색, 삭제, 내보내기) |
| 3.7 | 분석 결과 DB 캐싱 (동일 URL 재분석 방지) |
| 3.8 | 히스토리 기능 (로그인 사용자의 분석 목록) |

**Deliverable**: SSO 로그인 + 단어장 + 분석 히스토리

### Phase 4: V2 Enhancement (Future)

> Phase 3 완료 후, 필요에 따라 진행.

- 공유 링크 기능
- 학습 컬렉션
- 다국어 번역 확장
- 프리미엄 티어 (사용량 제한)
- 영상 길이 확대 (청킹)

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 기사 크롤링 성공률 | 주요 영문 매체 80%+ | BBC, CNN, Reuters, NYT, Guardian 테스트 |
| 기사 분석 완료율 | 90%+ (에러 없이) | 에러 로그 |
| 팝오버 응답 시간 | < 2s (p95) | 클라이언트 측정 |
| 구조 분석 정확도 | 문법 요소 올바른 분류 80%+ | 수동 검증 |
| 표현 추출 유용성 | 기사당 5-15개 유의미한 표현 | 수동 검증 |

---

## 9. Risks & Mitigations

| Risk | 확률 | 영향 | Mitigation |
|------|------|------|------------|
| CORS/크롤링 차단 (일부 사이트) | 높음 | 중간 | 서버사이드 크롤링 + 텍스트 붙여넣기 fallback |
| OpenAI 프롬프트 일관성 | 중간 | 중간 | `response_format: json_object` 사용, 스키마 검증 |
| OpenAI API 비용 증가 | 중간 | 중간 | 분석 결과 캐싱 (Phase 3), Rate Limiting |
| 폴더 구조 리팩토링 시 회귀 버그 | 중간 | 중간 | 단계적 이동, 각 단계 후 빌드/테스트 확인 |
| Vercel/배포 timeout | 낮음 | 높음 | 자체 서버 배포 (Nginx + Docker, 기존 인프라) |
| 문장 분리 오류 (약어, 인용문) | 중간 | 낮음 | AI 기반 문장 분리를 1차, 규칙 기반 fallback |

---

## 10. Critical Files Reference

| File | Description |
|------|-------------|
| `.github/workflows/ci.yml` | CI: Build Web, Build API, Build AI |
| `docker-compose.yml` | 로컬 개발 환경 (web, api, ai) |
| `apps/api/src/common/config/configuration.ts` | API 환경 설정 |
| `apps/ai/app/config.py` | AI 서비스 환경 설정 |
| `apps/web/src/app/page.tsx` | 메인 랜딩 페이지 (리팩토링 대상) |
| `apps/web/src/components/script-panel.tsx` | ArticlePanel 참고 원본 |
| `apps/web/src/components/key-moments-bar.tsx` | ExpressionBar 참고 원본 |
| `apps/web/src/hooks/use-analysis-stream.ts` | SSE 스트리밍 패턴 참고 |
