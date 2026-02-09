# WIGVU News Reader - 영어 뉴스 읽기 학습 도구 PRD

> **Version**: 1.0
> **Created**: 2026-02-09
> **Status**: Draft
> **Product Type**: 비영리 재능기부 (무료 배포)

## 1. Overview

### 1.1 Problem Statement

영어 뉴스 기사를 읽고 싶지만:
- 번역기로 전체를 돌리면 **학습 효과가 없음** (수동적 소비)
- 모르는 단어를 일일이 사전에서 찾는 건 **흐름이 끊김**
- 숙어/관용표현은 단어를 다 알아도 **의미를 모름**
- 긴 문장의 **구조를 파악하는 법**을 아무도 안 알려줌
- 학습한 표현을 **정리/복습할 방법**이 없음

### 1.2 Solution

영어 뉴스 기사를 붙여넣으면:
1. **문장 단위 번역** - 원문과 한국어를 라인바이라인으로 대조
2. **숙어/표현 자동 추출** - AI가 기사 맥락에서 중요 표현을 찾아줌
3. **문장 구조 파싱** - 긴 문장을 어떻게 읽어야 하는지 분석
4. **하이라이트 팝오버** - 텍스트 선택 시 즉시 뜻/설명 제공
5. **단어장 수집** - 학습한 표현을 모아서 복습

### 1.3 Goals

- **G1**: URL 또는 텍스트 붙여넣기로 기사 입력
- **G2**: 문장 단위 원문/번역 대조 뷰 제공
- **G3**: AI 기반 숙어/핵심 표현 자동 추출
- **G4**: 문장 구조 분석 (주어/동사/목적어 + 읽는 순서)
- **G5**: 텍스트 선택 시 팝오버로 뜻/저장 기능
- **G6**: 단어장 수집 & localStorage 저장
- **G7**: 서버 비용 $0 (Vercel 무료 + BYOK OpenAI)

### 1.4 Non-Goals (Out of Scope)

- 기사 크롤링/큐레이션 (사용자가 직접 입력)
- 기사 원문 서버 저장 (클라이언트만)
- 로그인/회원가입
- 유료 결제/프리미엄 기능
- 모바일 앱 (반응형 웹으로 대응)
- YouTube 영상 분석 (기존 WIGVU에서 유지)
- 다국어 UI (한국어 사용자 타겟)

### 1.5 Scope

| 포함 | 제외 |
|------|------|
| URL 입력 → 기사 텍스트 추출 (클라이언트) | 서버사이드 크롤링 |
| 텍스트 직접 붙여넣기 | PDF/이미지 OCR |
| 문장 단위 번역 (OpenAI) | Google/Papago 번역 |
| 숙어/표현 AI 추출 | 사전 DB 구축 |
| 문장 구조 파싱 (AI) | 문법 교정 |
| 하이라이트 팝오버 | 브라우저 확장 프로그램 |
| localStorage 단어장 | DB/클라우드 동기화 |
| JSON 내보내기/가져오기 | 계정 기반 동기화 |

### 1.6 Architecture

```
┌──────────────────────────────────────────────────┐
│            Next.js (Vercel 무료 호스팅)            │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │              Pages (App Router)               │ │
│  │  /              → 랜딩 + 입력                 │ │
│  │  /read/[id]     → 기사 학습 뷰               │ │
│  │  /vocabulary    → 단어장                      │ │
│  ├──────────────────────────────────────────────┤ │
│  │           API Routes (서버리스)                │ │
│  │  POST /api/analyze-article                    │ │
│  │  POST /api/parse-sentence                     │ │
│  │  POST /api/word-lookup                        │ │
│  ├──────────────────────────────────────────────┤ │
│  │           Client Storage                      │ │
│  │  localStorage: 단어장, 학습기록, 설정          │ │
│  │  sessionStorage: 현재 기사 데이터             │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────┘
                         │ (BYOK API Key)
                    ┌────▼────┐
                    │ OpenAI  │
                    │ API     │
                    └─────────┘
```

**핵심**: API 서버 없이 Next.js API Routes + OpenAI API로만 동작. NestJS, FastAPI, PostgreSQL 불필요.

### 1.7 Cost Structure

| 항목 | 비용 | 비고 |
|------|------|------|
| Vercel 호스팅 | $0 | Hobby Plan (무료) |
| 도메인 | $0-12/년 | 선택사항 (Vercel 기본 도메인 가능) |
| OpenAI API | 사용자 부담 (BYOK) | 기사 1건 ≈ $0.01-0.03 |
| DB | $0 | localStorage만 사용 |
| **합계** | **$0/월** | |

---

## 2. User Stories

### 2.1 Primary User

**페르소나: 영어 학습자 (민지, 25세)**
- 영어 뉴스로 실력을 키우고 싶음
- 단어는 어느 정도 아는데, 긴 문장 독해가 어려움
- 숙어/관용표현이 나오면 막힘
- 학습한 표현을 정리하고 싶지만 방법이 번거로움

### 2.2 User Stories & Acceptance Criteria

#### US-001: 기사 입력 및 번역
**As a** 영어 학습자, **I want to** 뉴스 기사 URL이나 텍스트를 붙여넣으면 문장 단위로 번역을 볼 수 있도록 **so that** 원문과 번역을 대조하며 읽을 수 있다.

```gherkin
Scenario: URL로 기사 입력
  Given 사용자가 메인 페이지에서
  When 영어 뉴스 기사 URL을 붙여넣고 "분석" 버튼을 누르면
  Then 기사 제목, 출처, 본문이 추출되고
  And 각 문장이 원문/한국어 번역 쌍으로 표시된다

Scenario: 텍스트 직접 붙여넣기
  Given 사용자가 메인 페이지에서
  When 영어 텍스트를 직접 붙여넣고 "분석" 버튼을 누르면
  Then 텍스트가 문장 단위로 분리되고
  And 각 문장이 원문/한국어 번역 쌍으로 표시된다

Scenario: 이미 분석된 기사 재방문
  Given 이전에 분석한 기사가 sessionStorage에 있을 때
  When 같은 페이지에 돌아오면
  Then 캐시된 분석 결과가 즉시 표시된다
```

#### US-002: 숙어/표현 자동 추출
**As a** 영어 학습자, **I want to** 기사에 포함된 숙어와 핵심 표현을 자동으로 볼 수 있도록 **so that** 모르는 표현을 놓치지 않는다.

```gherkin
Scenario: 기사 분석 완료 후 표현 표시
  Given 기사 분석이 완료되면
  When 학습 뷰가 로드될 때
  Then 기사에서 추출된 숙어/표현 목록이 상단에 표시되고
  And 각 표현에 뜻, 원문 내 사용 예시가 포함된다

Scenario: 표현을 단어장에 저장
  Given 추출된 표현 목록에서
  When 특정 표현의 "저장" 버튼을 클릭하면
  Then 해당 표현이 단어장(localStorage)에 추가된다
```

#### US-003: 문장 구조 파싱
**As a** 영어 학습자, **I want to** 어려운 문장의 구조를 분석받을 수 있도록 **so that** 문장을 어떻게 끊어 읽는지 배울 수 있다.

```gherkin
Scenario: 문장 구조 분석 요청
  Given 라인바이라인 뷰에서
  When 특정 문장의 "구조 분석" 버튼을 클릭하면
  Then AI가 해당 문장의 주어/동사/목적어/수식어를 파싱하고
  And 한국어 읽는 순서가 표시되고
  And 문법 포인트(분사구문, 관계사절 등)가 설명된다
```

#### US-004: 하이라이트 팝오버
**As a** 영어 학습자, **I want to** 모르는 단어나 구문을 드래그하면 즉시 뜻을 볼 수 있도록 **so that** 흐름을 끊지 않고 학습할 수 있다.

```gherkin
Scenario: 단어 선택 시 팝오버
  Given 기사 원문에서
  When 단어나 구문을 드래그/선택하면
  Then 팝오버가 표시되고
  And 선택한 텍스트의 뜻, 발음기호, 문맥 내 의미가 보이고
  And "단어장에 저장" 버튼이 있다

Scenario: 팝오버에서 단어장 저장
  Given 팝오버가 열린 상태에서
  When "저장" 버튼을 클릭하면
  Then 선택한 단어/구문이 단어장에 추가되고
  And 팝오버에 "저장됨" 확인이 표시된다
```

#### US-005: 단어장 관리
**As a** 영어 학습자, **I want to** 저장한 단어/표현을 모아보고 관리할 수 있도록 **so that** 복습할 수 있다.

```gherkin
Scenario: 단어장 조회
  Given 단어장 페이지에서
  When 저장된 단어/표현이 있을 때
  Then 저장순(최신순)으로 목록이 표시되고
  And 각 항목에 원문, 뜻, 출처 기사가 보인다

Scenario: 단어장 내보내기
  Given 단어장에 항목이 있을 때
  When "내보내기" 버튼을 클릭하면
  Then JSON 파일로 다운로드된다

Scenario: 단어장 가져오기
  Given 단어장 페이지에서
  When JSON 파일을 업로드하면
  Then 기존 단어장에 병합된다
```

#### US-006: BYOK (API Key 입력)
**As a** 사용자, **I want to** 내 OpenAI API Key를 입력하여 서비스를 이용할 수 있도록 **so that** 무료로 사용할 수 있다.

```gherkin
Scenario: API Key 설정
  Given 설정에서
  When OpenAI API Key를 입력하고 저장하면
  Then localStorage에 암호화 저장되고
  And 이후 분석 시 해당 Key가 사용된다

Scenario: API Key 없이 접근
  Given API Key가 설정되지 않은 상태에서
  When 기사 분석을 시도하면
  Then "API Key를 설정해주세요" 안내가 표시되고
  And 설정 페이지로 안내된다
```

---

## 3. Functional Requirements

### 3.1 기사 입력 & 처리

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-001 | URL 입력 시 기사 텍스트 추출 (클라이언트 사이드 fetch + DOM 파싱) | P0 (Must) | - |
| FR-002 | 텍스트 직접 붙여넣기 입력 | P0 (Must) | - |
| FR-003 | 문장 단위 분리 (마침표/물음표/느낌표 + AI 보정) | P0 (Must) | FR-001 or FR-002 |
| FR-004 | 기사 메타데이터 추출 (제목, 출처, 날짜) | P1 (Should) | FR-001 |
| FR-005 | 지원 사이트 안내 (CORS 제한 고지) | P1 (Should) | FR-001 |

### 3.2 번역 & 표시

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-010 | 문장 단위 한국어 번역 (OpenAI API) | P0 (Must) | FR-003 |
| FR-011 | 라인바이라인 원문/번역 대조 뷰 | P0 (Must) | FR-010 |
| FR-012 | 표시 모드 토글 (양쪽/원문만/번역만) | P0 (Must) | FR-011 |
| FR-013 | 문장 난이도 색상 표시 (초급/중급/고급) | P2 (Could) | FR-010 |
| FR-014 | SSE 스트리밍 진행률 (문장별 번역 진행) | P1 (Should) | FR-010 |

### 3.3 숙어/표현 추출

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-020 | AI 기반 숙어/관용표현 자동 추출 (기사당 5-15개) | P0 (Must) | FR-003 |
| FR-021 | 각 표현에 한국어 뜻 + 원문 내 사용 위치 표시 | P0 (Must) | FR-020 |
| FR-022 | 표현 전체/선택 단어장 저장 | P0 (Must) | FR-020 |
| FR-023 | 표현 클릭 시 원문에서 해당 위치 하이라이트 | P1 (Should) | FR-020 |

### 3.4 문장 구조 파싱

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-030 | 문장별 "구조 분석" 버튼 | P0 (Must) | FR-011 |
| FR-031 | AI 문장 구조 파싱 (주어/동사/목적어/수식어 분해) | P0 (Must) | FR-030 |
| FR-032 | 한국어 읽는 순서 표시 | P0 (Must) | FR-031 |
| FR-033 | 문법 포인트 설명 (분사구문, 관계사절, 가정법 등) | P0 (Must) | FR-031 |
| FR-034 | 파싱 결과 접기/펼치기 | P1 (Should) | FR-031 |

### 3.5 하이라이트 & 팝오버

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-040 | 텍스트 선택 시 팝오버 표시 (Selection API) | P0 (Must) | FR-011 |
| FR-041 | 팝오버 내 한국어 뜻 표시 | P0 (Must) | FR-040 |
| FR-042 | 팝오버 내 "이 문장에서의 뜻" (문맥 해석) | P0 (Must) | FR-040 |
| FR-043 | 팝오버에서 단어장 저장 버튼 | P0 (Must) | FR-040 |
| FR-044 | 이미 저장된 단어는 팝오버에 "저장됨" 표시 | P1 (Should) | FR-043 |
| FR-045 | 발음 기호 표시 | P2 (Could) | FR-041 |

### 3.6 단어장

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-050 | 단어장 localStorage 저장/조회 | P0 (Must) | - |
| FR-051 | 단어장 목록 뷰 (단어, 뜻, 출처 기사, 저장일) | P0 (Must) | FR-050 |
| FR-052 | 단어 삭제 (단일/다중) | P0 (Must) | FR-050 |
| FR-053 | 단어장 검색 (단어/뜻) | P1 (Should) | FR-051 |
| FR-054 | JSON 내보내기/가져오기 | P1 (Should) | FR-050 |
| FR-055 | 학습 통계 (총 저장 수, 오늘 추가 수) | P2 (Could) | FR-050 |

### 3.7 BYOK & 설정

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-060 | OpenAI API Key 입력 & localStorage 저장 | P0 (Must) | - |
| FR-061 | API Key 유효성 검증 (test call) | P0 (Must) | FR-060 |
| FR-062 | API Key 미설정 시 안내 & 유도 | P0 (Must) | FR-060 |
| FR-063 | 기본 무료 분석 횟수 (일 3회, 운영자 Key 사용) | P2 (Could) | - |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|------------|--------|
| NFR-001 | 페이지 초기 로딩 (LCP) | < 2s |
| NFR-002 | 기사 분석 완료 시간 (1000단어 기준) | < 30s |
| NFR-003 | 팝오버 표시 지연 | < 500ms |
| NFR-004 | 문장 구조 파싱 응답 | < 5s |
| NFR-005 | localStorage 읽기/쓰기 | < 50ms |

### 4.2 Security

| ID | Requirement |
|----|------------|
| NFR-010 | API Key는 localStorage에 저장, 서버 전송 시 HTTPS만 사용 |
| NFR-011 | API Key는 Next.js API Route를 통해서만 OpenAI에 전달 (클라이언트 직접 호출 금지) |
| NFR-012 | 기사 원문은 서버에 저장하지 않음 |
| NFR-013 | XSS 방지: 외부 기사 HTML 렌더링 시 DOMPurify 사용 |

### 4.3 Accessibility

| ID | Requirement |
|----|------------|
| NFR-020 | 키보드 내비게이션 지원 (Tab, Enter, Escape) |
| NFR-021 | 팝오버 Escape로 닫기 |
| NFR-022 | 적절한 폰트 크기 (본문 16px 이상) |
| NFR-023 | 다크/라이트 모드 지원 |

---

## 5. Technical Design

### 5.1 API Specification

#### API: 기사 분석 (번역 + 표현 추출)

##### `POST /api/analyze-article`

**Description**: 기사 텍스트를 문장 단위로 번역하고, 숙어/표현을 추출

**Authentication**: BYOK (X-API-Key 헤더)

**Request Body**:
```json
{
  "text": "string (required) - 기사 원문 텍스트 (max 10000자)",
  "url": "string (optional) - 기사 출처 URL",
  "title": "string (optional) - 기사 제목"
}
```

**Response 200 OK** (SSE Stream):
```
event: progress
data: {"step": "splitting", "message": "문장 분리 중...", "progress": 10}

event: progress
data: {"step": "translating", "message": "번역 중... (3/15)", "progress": 40}

event: progress
data: {"step": "extracting", "message": "표현 추출 중...", "progress": 80}

event: result
data: {
  "sentences": [
    {
      "id": 0,
      "original": "The Federal Reserve held interest rates steady.",
      "translated": "연방준비제도는 금리를 동결했다.",
      "difficulty": "intermediate"
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
| 400 | TEXT_REQUIRED | 텍스트를 입력해주세요 |
| 400 | TEXT_TOO_LONG | 텍스트가 너무 깁니다 (10000자 제한) |
| 401 | INVALID_API_KEY | API Key가 유효하지 않습니다 |
| 429 | RATE_LIMIT | 요청이 너무 많습니다 |
| 500 | ANALYSIS_FAILED | 분석에 실패했습니다 |

---

#### API: 문장 구조 파싱

##### `POST /api/parse-sentence`

**Description**: 단일 문장의 문법 구조를 분석하고 읽는 법을 안내

**Request Body**:
```json
{
  "sentence": "string (required) - 분석할 영어 문장",
  "context": "string (optional) - 전후 문맥 (정확도 향상용)"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "components": [
      {"text": "The Federal Reserve", "role": "주어", "explanation": "연방준비제도"},
      {"text": "held", "role": "동사", "explanation": "유지했다 (hold의 과거형)"},
      {"text": "interest rates", "role": "목적어", "explanation": "금리를"},
      {"text": "steady", "role": "보어", "explanation": "안정적으로"},
      {"text": ", citing persistent inflation concerns", "role": "분사구문", "explanation": "지속적인 인플레이션 우려를 이유로 들며"}
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

#### API: 단어/구문 조회

##### `POST /api/word-lookup`

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
      "The central bank raised interest rates. (중앙은행이 금리를 인상했다.)",
      "Low interest rates encourage borrowing. (낮은 금리는 차입을 촉진한다.)"
    ]
  }
}
```

---

### 5.2 AI Prompts (핵심)

#### 번역 + 표현 추출 통합 프롬프트

```
System: 당신은 영어 뉴스 기사 학습 도우미입니다.

주어진 영어 기사를 다음 형식으로 분석해주세요:

1. sentences: 각 문장의 원문과 자연스러운 한국어 번역
   - difficulty: "beginner" | "intermediate" | "advanced"

2. expressions: 기사에 포함된 숙어, 관용표현, 핵심 어휘
   - expression: 원문 표현
   - meaning: 한국어 뜻
   - category: "idiom" | "phrasal_verb" | "collocation" | "technical_term"
   - sentenceId: 해당 표현이 사용된 문장 번호 (0-indexed)
   - context: 원문에서 사용된 형태

JSON만 반환하세요.
```

#### 문장 구조 파싱 프롬프트

```
System: 당신은 영어 문장 구조 분석 전문가입니다.
한국인 영어 학습자가 긴 영어 문장을 이해할 수 있도록 도와주세요.

주어진 문장을 다음과 같이 분석해주세요:

1. components: 문장 성분별 분해
   - text: 원문 텍스트 조각
   - role: "주어" | "동사" | "목적어" | "보어" | "부사구" | "관계사절" | "분사구문" | "전치사구" | "접속사" | "to부정사"
   - explanation: 한국어 뜻

2. readingOrder: 한국어 어순으로 재배열한 읽기 순서
   (/ 로 끊어읽기 단위 구분)

3. grammarPoints: 주요 문법 포인트 (해당 시)
   - type: 문법 항목명
   - explanation: 쉬운 한국어 설명
   - highlight: 해당 부분 원문

JSON만 반환하세요.
```

### 5.3 기존 컴포넌트 재활용 계획

| 기존 컴포넌트 | 재활용 방식 | 수정사항 |
|--------------|-----------|---------|
| `ScriptPanel` | `ArticlePanel`로 변환 | 타임스탬프 제거, 구조분석 버튼 추가 |
| `FloatingMemo` | 학습 노트로 재활용 | videoTitle→articleTitle 변경 |
| `LoadingState` | 분석 진행률 표시 | 단계명 변경 (번역→표현추출) |
| `useAnalysisStream` | 기사 분석 SSE 스트리밍 | 이벤트 타입 변경 |
| `UrlInput` | URL/텍스트 입력으로 확장 | 텍스트 영역 추가, YouTube 검증 제거 |
| `ui/button, card, badge, input` | 그대로 사용 | 변경 없음 |
| `error-boundary.tsx` | 그대로 사용 | 변경 없음 |
| `error-display.tsx` | 에러 코드만 변경 | 기사 관련 에러 추가 |
| `providers.tsx` | 그대로 사용 | 변경 없음 |
| `theme-toggle.tsx` | 그대로 사용 | 변경 없음 |

### 5.4 새로 만들어야 하는 것

| 컴포넌트/파일 | 역할 |
|-------------|------|
| `ArticlePanel` | 라인바이라인 기사 학습 뷰 (ScriptPanel 기반) |
| `ExpressionBar` | 추출된 숙어/표현 목록 표시 (KeyMomentsBar 기반) |
| `SentenceParser` | 문장 구조 분석 결과 표시 (새로 작성) |
| `SelectionPopover` | 텍스트 선택 시 팝오버 (새로 작성) |
| `VocabularyList` | 단어장 목록/관리 뷰 (새로 작성) |
| `ApiKeyInput` | BYOK API Key 설정 UI (새로 작성) |
| `useVocabulary` | 단어장 localStorage CRUD 훅 (새로 작성) |
| `useTextSelection` | 텍스트 선택 감지 훅 (새로 작성) |
| `useArticleAnalysis` | 기사 분석 SSE 훅 (useAnalysisStream 기반) |

### 5.5 localStorage 스키마

```typescript
// 단어장
interface VocabularyItem {
  id: string;               // nanoid
  word: string;             // 원문 단어/구문
  meaning: string;          // 한국어 뜻
  contextMeaning?: string;  // 문맥 속 뜻
  pronunciation?: string;   // 발음기호
  category: "word" | "expression" | "idiom";
  sourceArticle?: string;   // 출처 기사 제목
  sourceSentence?: string;  // 출처 문장
  createdAt: string;        // ISO 8601
}

// 저장 Key: "wigvu-vocabulary"
// 저장 형태: VocabularyItem[]

// 설정
interface Settings {
  apiKey?: string;          // OpenAI API Key
  displayMode: "both" | "original" | "translated";
  theme: "dark" | "light" | "system";
  fontSize: "small" | "medium" | "large";
}

// 저장 Key: "wigvu-settings"

// 학습 기록 (간단한 통계)
interface StudyStats {
  totalArticles: number;
  totalExpressions: number;
  dailyArticles: Record<string, number>;  // "2026-02-09": 3
}

// 저장 Key: "wigvu-stats"
```

---

## 6. Implementation Phases

### Phase 1: Core Reading Experience (MVP)
- [ ] 1.1 프로젝트 구조 정리 (불필요한 YouTube 코드 분리)
- [ ] 1.2 BYOK API Key 설정 UI & localStorage 저장
- [ ] 1.3 URL/텍스트 입력 컴포넌트 (UrlInput 확장)
- [ ] 1.4 기사 분석 API Route (POST /api/analyze-article)
- [ ] 1.5 번역 + 표현 추출 OpenAI 프롬프트
- [ ] 1.6 라인바이라인 ArticlePanel 컴포넌트
- [ ] 1.7 ExpressionBar (숙어/표현 목록)
- [ ] 1.8 SSE 스트리밍 진행률

**Deliverable**: URL/텍스트 입력 → 문장별 번역 + 표현 추출 동작

### Phase 2: Deep Learning Features
- [ ] 2.1 문장 구조 파싱 API Route (POST /api/parse-sentence)
- [ ] 2.2 SentenceParser UI 컴포넌트
- [ ] 2.3 텍스트 선택 감지 훅 (useTextSelection)
- [ ] 2.4 SelectionPopover 컴포넌트
- [ ] 2.5 팝오버에서 AI 단어 조회 (POST /api/word-lookup)
- [ ] 2.6 표시 모드 토글 (양쪽/원문만/번역만)

**Deliverable**: 문장 구조 분석 + 하이라이트 팝오버 동작

### Phase 3: Vocabulary & Polish
- [ ] 3.1 useVocabulary 훅 (localStorage CRUD)
- [ ] 3.2 단어장 페이지 (/vocabulary)
- [ ] 3.3 팝오버/표현바에서 단어장 저장 연동
- [ ] 3.4 JSON 내보내기/가져오기
- [ ] 3.5 학습 통계 표시
- [ ] 3.6 다크/라이트 모드 완성
- [ ] 3.7 반응형 모바일 최적화
- [ ] 3.8 Vercel 배포

**Deliverable**: 완성된 학습 도구 + 단어장 + 배포

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 기사 분석 완료율 | 90%+ (에러 없이 완료) | 에러 로그 |
| 팝오버 응답 시간 | < 500ms (p95) | 클라이언트 측정 |
| 단어장 저장 항목 수 | 사용자당 평균 20+/월 | localStorage 분석 |
| 구조 분석 사용률 | 기사당 평균 3+ 문장 분석 | 이벤트 트래킹 |
| GitHub Star | 50+ (6개월 후) | GitHub |

---

## 8. UI Wireframe (텍스트)

### 메인 페이지

```
┌──────────────────────────────────────────────────┐
│  WIGVU Reader                    [설정] [단어장]  │
├──────────────────────────────────────────────────┤
│                                                    │
│         영어 뉴스, 읽으면서 배우자                  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  [URL]  [텍스트]                    탭 전환   │ │
│  │                                              │ │
│  │  https://bbc.com/news/article...              │ │
│  │                                              │ │
│  │                     또는                      │ │
│  │                                              │ │
│  │  영어 텍스트를 여기에 붙여넣으세요...          │ │
│  │                                              │ │
│  │                              [분석 시작 →]    │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└──────────────────────────────────────────────────┘
```

### 학습 뷰

```
┌──────────────────────────────────────────────────┐
│  WIGVU Reader    [새 기사]   [설정] [단어장]      │
├──────────────────────────────────────────────────┤
│  BBC News · 2026-02-09                           │
│  "Fed Holds Interest Rates Steady"                │
├──────────────────────────────────────────────────┤
│  📌 주요 표현 (8개)                    [전체 저장] │
│  ┌──────┐ ┌──────────┐ ┌──────────┐             │
│  │hold  │ │in light  │ │going     │  ...         │
│  │steady│ │of        │ │forward   │              │
│  │동결   │ │~고려하여  │ │앞으로     │             │
│  │[저장] │ │[저장]    │ │[저장]    │              │
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
│       │                    │                      │
│       │ 이 문장에서:        │                      │
│       │ "(향후 방향을) 시사했다"│                   │
│       │                    │                      │
│       │ [📥 단어장 저장]    │                      │
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

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CORS로 기사 URL fetch 실패 | 일부 사이트 접근 불가 | 텍스트 붙여넣기를 1차 방법으로 안내 |
| OpenAI 프롬프트 정확도 | 문장 구조 파싱 오류 | "AI 분석 결과입니다" 고지, 피드백 버튼 |
| API Key 분실/노출 | 보안 이슈 | localStorage 저장, API Route 통해서만 전달 |
| 긴 기사 비용 | 사용자 API 비용 증가 | 10000자 제한, 예상 비용 표시 |
| 기사 저작권 | 원문 저장 이슈 | 서버 미저장, 클라이언트 세션 내에서만 |
