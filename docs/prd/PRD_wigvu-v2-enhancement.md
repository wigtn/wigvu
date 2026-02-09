# WIGVU v2.0 Enhancement PRD

> **Version**: 1.0
> **Created**: 2026-02-09
> **Status**: Draft
> **Author**: AI-assisted (Claude Code)

## 1. Overview

### 1.1 Current State Analysis

WIGVU(윅뷰)는 YouTube 영상의 자막 추출, 번역, AI 분석을 제공하는 서비스입니다. 현재 구현된 기능:

| 기능 | 상태 | 비고 |
|------|------|------|
| YouTube URL 입력 & 메타데이터 추출 | Done | 제목, 채널, 조회수, 좋아요 등 |
| 자막 추출 (YouTube Captions) | Done | 자동/수동 자막 지원 |
| STT 폴백 (WhisperX) | Done | 30분 이하 영상 |
| 영어→한국어 번역 | Done | GPT-4o-mini 기반 |
| AI 분석 (요약, 시청점수, 키워드, 하이라이트) | Done | GPT-4o-mini 기반 |
| 실시간 스크립트 동기화 | Done | 영상 재생과 스크립트 연동 |
| SSE 스트리밍 진행률 | Done | 단계별 실시간 업데이트 |
| 플로팅 메모 | Done | 시청 중 메모 기능 |
| 다크모드 | Done | 기본 다크모드 |
| 반응형 디자인 | Done | 모바일/데스크톱 대응 |

### 1.2 Problem Statement

현재 WIGVU는 **단일 영상 분석의 1회성 경험**에 그치고 있습니다:

1. **데이터 영속성 부재**: 분석 결과가 저장되지 않아 페이지 이탈 시 모든 데이터 소멸
2. **사용자 식별 불가**: 로그인/회원가입 없이 익명 사용, 개인화 불가
3. **학습 히스토리 부재**: 과거 분석 기록 조회, 복습 불가
4. **공유 기능 부재**: 분석 결과를 다른 사람과 공유 불가
5. **언어 제한**: 영어→한국어만 지원, 다국어 확장 구조 부재
6. **검색 불가**: 키워드/채널별 과거 분석 검색 불가
7. **수익 모델 부재**: 무료 사용만 가능, 지속 가능성 위험

### 1.3 Goals

- **G1**: 분석 결과 영속성 확보 (DB 저장 & 조회)
- **G2**: 사용자 인증 시스템 구축 (소셜 로그인)
- **G3**: 분석 히스토리 & 대시보드 제공
- **G4**: 분석 결과 공유 기능 (공유 링크)
- **G5**: 다국어 지원 확장 (일본어, 중국어, 스페인어)
- **G6**: 재생목록 분석 & 학습 컬렉션 기능
- **G7**: 프리미엄 기능 분리 (무료/유료 티어)

### 1.4 Non-Goals (Out of Scope)

- 자체 영상 플레이어 개발 (YouTube IFrame 유지)
- YouTube 이외 플랫폼 지원 (Twitch, Vimeo 등)
- 자체 STT 모델 학습/운영
- 모바일 네이티브 앱 개발
- 실시간 라이브 스트리밍 분석

### 1.5 Scope

| 포함 | 제외 |
|------|------|
| PostgreSQL DB 도입 | Redis 클러스터 (단일 인스턴스로 충분) |
| OAuth 소셜 로그인 (Google, GitHub) | 이메일/비밀번호 인증 |
| 분석 히스토리 CRUD | 복잡한 대시보드 Analytics |
| 공유 링크 생성 | SNS 직접 포스팅 |
| 다국어 번역 확장 | 실시간 음성 통역 |
| 컬렉션/폴더 관리 | 팀 협업 기능 |
| 기본 프리미엄 티어 | 결제 시스템 (Phase 3) |

---

## 2. User Stories

### 2.1 Primary Users

**페르소나 1: 영어 학습자 (민지, 25세)**
- 영어 YouTube 강의를 보며 학습
- 자막과 번역을 동시에 보며 표현을 익힘
- 핵심 구간을 반복 시청하고 메모함

**페르소나 2: 콘텐츠 리서처 (준혁, 32세)**
- 해외 기술/비즈니스 영상을 빠르게 리서치
- 시청 가치 판단 후 선별적으로 시청
- 분석 결과를 팀원에게 공유

**페르소나 3: 캐주얼 시청자 (수연, 28세)**
- 긴 영상의 핵심만 빠르게 파악하고 싶음
- 가끔 사용, 로그인 없이 간편하게 이용

### 2.2 User Stories & Acceptance Criteria

#### US-001: 분석 결과 저장 및 재조회
**As a** 반복 사용자, **I want to** 과거 분석한 영상을 다시 볼 수 있도록 **so that** 복습하거나 참고할 수 있다.

```gherkin
Scenario: 분석 결과 자동 저장
  Given 사용자가 로그인한 상태에서
  When YouTube URL을 입력하여 분석을 완료하면
  Then 분석 결과가 자동으로 DB에 저장되고
  And 히스토리 목록에 표시된다

Scenario: 비로그인 사용자의 분석
  Given 사용자가 비로그인 상태에서
  When YouTube URL을 입력하여 분석을 완료하면
  Then 분석 결과는 세션 내에서만 유지되고
  And "로그인하면 저장됩니다" 안내가 표시된다

Scenario: 이미 분석된 영상 재요청
  Given 동일한 videoId가 이미 DB에 저장되어 있을 때
  When 같은 URL로 분석을 요청하면
  Then 캐시된 분석 결과를 즉시 반환하고
  And "캐시에서 로드됨" 표시가 보인다
```

#### US-002: 소셜 로그인
**As a** 신규 사용자, **I want to** Google 또는 GitHub 계정으로 간편 로그인하여 **so that** 복잡한 회원가입 없이 서비스를 이용할 수 있다.

```gherkin
Scenario: Google 소셜 로그인
  Given 사용자가 비로그인 상태에서
  When "Google로 로그인" 버튼을 클릭하면
  Then Google OAuth 동의 화면이 표시되고
  And 동의 후 WIGVU로 리디렉션되며
  And 사용자 프로필(이름, 이메일, 아바타)이 표시된다

Scenario: 로그아웃
  Given 사용자가 로그인 상태에서
  When "로그아웃" 버튼을 클릭하면
  Then 세션이 종료되고
  And 메인 페이지로 이동한다
```

#### US-003: 분석 히스토리 대시보드
**As a** 로그인 사용자, **I want to** 분석한 영상 목록을 보고 관리할 수 있도록 **so that** 과거 분석 내용을 쉽게 찾을 수 있다.

```gherkin
Scenario: 히스토리 목록 조회
  Given 사용자가 로그인하고 3개 이상의 분석 기록이 있을 때
  When 히스토리 페이지에 접근하면
  Then 분석 목록이 최신순으로 표시되고
  And 각 항목에 썸네일, 제목, 채널명, 시청점수, 분석일시가 보인다

Scenario: 히스토리 검색
  Given 히스토리에 10개 이상의 기록이 있을 때
  When 검색창에 키워드를 입력하면
  Then 제목, 채널명, 키워드에 매칭되는 결과가 필터링된다

Scenario: 분석 기록 삭제
  Given 히스토리에 특정 분석 기록이 있을 때
  When 삭제 버튼을 클릭하고 확인하면
  Then 해당 기록이 목록에서 제거된다
```

#### US-004: 분석 결과 공유
**As a** 콘텐츠 리서처, **I want to** 분석 결과를 공유 링크로 전달할 수 있도록 **so that** 팀원이 로그인 없이도 분석을 볼 수 있다.

```gherkin
Scenario: 공유 링크 생성
  Given 분석 결과 페이지에서
  When "공유" 버튼을 클릭하면
  Then 고유 공유 링크가 생성되고
  And 클립보드에 복사된다

Scenario: 공유 링크 접근
  Given 유효한 공유 링크가 있을 때
  When 비로그인 사용자가 해당 링크에 접근하면
  Then 읽기 전용으로 분석 결과가 표시된다
  And 영상 플레이어와 스크립트 동기화가 동작한다
```

#### US-005: 학습 컬렉션
**As a** 영어 학습자, **I want to** 분석한 영상을 주제별 컬렉션으로 정리할 수 있도록 **so that** 체계적으로 학습할 수 있다.

```gherkin
Scenario: 컬렉션 생성
  Given 로그인한 사용자가
  When "새 컬렉션" 버튼을 클릭하고 이름을 입력하면
  Then 빈 컬렉션이 생성된다

Scenario: 분석을 컬렉션에 추가
  Given 분석 결과 페이지에서
  When "컬렉션에 추가" 버튼을 클릭하고 컬렉션을 선택하면
  Then 해당 분석이 선택한 컬렉션에 추가된다
```

#### US-006: 다국어 번역 확장
**As a** 다국어 사용자, **I want to** 한국어 외에 일본어, 중국어, 스페인어로도 번역을 받을 수 있도록 **so that** 다양한 언어로 학습할 수 있다.

```gherkin
Scenario: 번역 언어 선택
  Given 분석 요청 시
  When 번역 대상 언어를 "일본어"로 선택하면
  Then 스크립트가 일본어로 번역되어 표시된다
```

---

## 3. Functional Requirements

### 3.1 인증 & 사용자 관리

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-001 | OAuth 2.0 소셜 로그인 (Google) | P0 (Must) | - |
| FR-002 | OAuth 2.0 소셜 로그인 (GitHub) | P1 (Should) | - |
| FR-003 | JWT 기반 세션 관리 (Access + Refresh Token) | P0 (Must) | FR-001 |
| FR-004 | 사용자 프로필 조회/수정 (이름, 아바타) | P1 (Should) | FR-001 |
| FR-005 | 로그아웃 & 토큰 무효화 | P0 (Must) | FR-003 |
| FR-006 | 계정 삭제 (GDPR 대응) | P1 (Should) | FR-001 |

### 3.2 분석 결과 영속성

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-010 | PostgreSQL DB 도입 (분석 결과 테이블) | P0 (Must) | - |
| FR-011 | 분석 완료 시 자동 저장 (로그인 사용자) | P0 (Must) | FR-001, FR-010 |
| FR-012 | 동일 videoId 캐시 히트 (DB에서 즉시 반환) | P0 (Must) | FR-010 |
| FR-013 | 분석 결과 만료/갱신 정책 (7일 후 재분석 가능) | P1 (Should) | FR-010 |
| FR-014 | 비로그인 분석 결과 임시 저장 (세션 기반, 24시간) | P2 (Could) | FR-010 |

### 3.3 히스토리 & 대시보드

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-020 | 분석 히스토리 목록 조회 (페이지네이션) | P0 (Must) | FR-010, FR-011 |
| FR-021 | 히스토리 검색 (제목, 채널명, 키워드) | P1 (Should) | FR-020 |
| FR-022 | 히스토리 정렬 (최신순, 시청점수순, 채널별) | P1 (Should) | FR-020 |
| FR-023 | 분석 기록 삭제 (단일/다중) | P1 (Should) | FR-020 |
| FR-024 | 총 분석 횟수, 평균 시청점수 등 통계 표시 | P2 (Could) | FR-020 |

### 3.4 공유 기능

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-030 | 고유 공유 링크 생성 (nanoid) | P1 (Should) | FR-010 |
| FR-031 | 공유 링크 접근 시 읽기 전용 뷰 | P1 (Should) | FR-030 |
| FR-032 | 공유 링크 만료 설정 (기본 30일) | P2 (Could) | FR-030 |
| FR-033 | 공유 링크 비활성화 | P2 (Could) | FR-030 |

### 3.5 학습 컬렉션

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-040 | 컬렉션 CRUD (생성, 조회, 수정, 삭제) | P1 (Should) | FR-001, FR-010 |
| FR-041 | 분석 결과를 컬렉션에 추가/제거 | P1 (Should) | FR-040 |
| FR-042 | 컬렉션 목록 조회 (포함 영상 수 표시) | P1 (Should) | FR-040 |
| FR-043 | 컬렉션 공유 링크 | P2 (Could) | FR-030, FR-040 |

### 3.6 다국어 확장

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-050 | 번역 대상 언어 선택 UI (드롭다운) | P1 (Should) | - |
| FR-051 | 일본어 (ja) 번역 지원 | P1 (Should) | FR-050 |
| FR-052 | 중국어 간체 (zh-CN) 번역 지원 | P2 (Could) | FR-050 |
| FR-053 | 스페인어 (es) 번역 지원 | P2 (Could) | FR-050 |
| FR-054 | UI 인터페이스 다국어 (i18n) | P2 (Could) | - |

### 3.7 사용자 경험 개선

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-060 | 라이트/다크 모드 토글 (시스템 설정 연동) | P1 (Should) | - |
| FR-061 | 영상 분석 중 예상 소요시간 표시 | P2 (Could) | - |
| FR-062 | 키보드 단축키 (Space: 재생/정지, ←→: 구간 이동) | P2 (Could) | - |
| FR-063 | 스크립트 텍스트 복사 기능 | P1 (Should) | - |
| FR-064 | 스크립트 PDF/TXT 내보내기 | P2 (Could) | FR-010 |
| FR-065 | 재생목록(Playlist) URL 입력 시 다중 분석 | P2 (Could) | FR-010 |

### 3.8 프리미엄 티어

| ID | Requirement | Priority | Dependencies |
|----|------------|----------|--------------|
| FR-070 | 무료/프리미엄 사용자 구분 (DB 필드) | P1 (Should) | FR-001, FR-010 |
| FR-071 | 무료: 일일 분석 5회 제한 | P1 (Should) | FR-070 |
| FR-072 | 무료: 영상 30분 이하 제한 | P1 (Should) | FR-070 |
| FR-073 | 프리미엄: 일일 분석 무제한 | P1 (Should) | FR-070 |
| FR-074 | 프리미엄: 영상 60분까지 지원 | P1 (Should) | FR-070 |
| FR-075 | 프리미엄: 스크립트 내보내기 기능 | P2 (Could) | FR-064, FR-070 |
| FR-076 | 사용량 카운터 & 리셋 (매일 00:00 UTC+9) | P1 (Should) | FR-070 |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target |
|----|------------|--------|
| NFR-001 | 페이지 초기 로딩 시간 (LCP) | < 2.5s |
| NFR-002 | API 응답 시간 (캐시 히트) | < 200ms (p95) |
| NFR-003 | API 응답 시간 (신규 분석) | < 90s (p95) |
| NFR-004 | 히스토리 목록 조회 응답 | < 500ms (p95) |
| NFR-005 | 동시 분석 요청 처리 | 20+ concurrent |
| NFR-006 | DB 쿼리 응답 시간 | < 100ms (p95) |

### 4.2 Security

| ID | Requirement | Description |
|----|------------|-------------|
| NFR-010 | OAuth 2.0 + PKCE | 소셜 로그인 보안 |
| NFR-011 | JWT Access Token 만료 | 15분 |
| NFR-012 | JWT Refresh Token 만료 | 7일 (remember me: 30일) |
| NFR-013 | HTTPS 필수 | 모든 통신 TLS 1.2+ |
| NFR-014 | API Key 노출 방지 | 서버사이드 전용 |
| NFR-015 | SQL Injection 방지 | ORM Parameterized Queries |
| NFR-016 | XSS 방지 | CSP + 입력 검증 |
| NFR-017 | Rate Limiting | IP + User 기반 이중 제한 |

### 4.3 Scalability

| ID | Requirement | Description |
|----|------------|-------------|
| NFR-020 | 사용자 수 | 10,000 MAU 지원 |
| NFR-021 | 분석 저장소 | 100,000건 이상 |
| NFR-022 | 수평 확장 가능 | 서비스별 독립 스케일링 |

### 4.4 Reliability

| ID | Requirement | Target |
|----|------------|--------|
| NFR-030 | 서비스 가용성 | 99.5% uptime |
| NFR-031 | 데이터 백업 | 일간 자동 백업 |
| NFR-032 | 장애 복구 시간 (RTO) | < 1시간 |

---

## 5. Technical Design

### 5.1 Architecture (Updated)

```
┌─────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│   Nginx     │────▶│        Web              │     │   OpenAI     │
│  (SSL/TLS)  │     │    (Next.js 16)         │     │   GPT-4o     │
└──────┬──────┘     │  + NextAuth.js          │     └──────────────┘
       │            └──────────┬──────────────┘           ▲
       │                       │                          │
       │            ┌──────────▼──────────────┐    ┌──────┴──────┐
       └───────────▶│        API              │───▶│     AI      │
                    │      (NestJS)           │    │  (FastAPI)  │
                    │  + Prisma ORM           │    │  Port 5000  │
                    │  Port 4000              │    └──────┬──────┘
                    └──────────┬──────────────┘          │
                               │                   ┌──────▼──────┐
                    ┌──────────▼──────────────┐    │  WhisperX   │
                    │     PostgreSQL          │    │  (STT API)  │
                    │     Port 5432           │    └─────────────┘
                    └─────────────────────────┘
```

### 5.2 Database Schema

```sql
-- 사용자 테이블
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(100) NOT NULL,
  avatar_url    VARCHAR(500),
  provider      VARCHAR(20) NOT NULL,        -- 'google' | 'github'
  provider_id   VARCHAR(255) NOT NULL,
  tier          VARCHAR(20) DEFAULT 'free',  -- 'free' | 'premium'
  daily_usage   INT DEFAULT 0,
  usage_reset_at TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- 분석 결과 테이블
CREATE TABLE analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id        VARCHAR(11) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  channel_name    VARCHAR(100) NOT NULL,
  channel_id      VARCHAR(50),
  duration        INT NOT NULL,              -- seconds
  view_count      BIGINT,
  like_count      BIGINT,
  thumbnail_url   VARCHAR(500),
  description     TEXT,
  summary         TEXT NOT NULL,
  watch_score     SMALLINT NOT NULL,         -- 1-10
  watch_score_reason VARCHAR(200),
  keywords        JSONB NOT NULL,            -- string[]
  highlights      JSONB NOT NULL,            -- {timestamp, title, description}[]
  transcript_segments JSONB NOT NULL,        -- {start, end, text, originalText, translatedText}[]
  transcript_source VARCHAR(10) NOT NULL,    -- 'youtube' | 'stt' | 'none'
  is_korean       BOOLEAN DEFAULT FALSE,
  is_translated   BOOLEAN DEFAULT FALSE,
  target_language VARCHAR(5) DEFAULT 'ko',
  analyzed_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at      TIMESTAMP WITH TIME ZONE,  -- 분석 만료일 (7일 후)
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analyses_video_id ON analyses(video_id);
CREATE INDEX idx_analyses_analyzed_at ON analyses(analyzed_at DESC);

-- 사용자-분석 연결 테이블
CREATE TABLE user_analyses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  is_owner    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, analysis_id)
);

CREATE INDEX idx_user_analyses_user_id ON user_analyses(user_id);

-- 컬렉션 테이블
CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON collections(user_id);

-- 컬렉션-분석 연결 테이블
CREATE TABLE collection_analyses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  analysis_id   UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  added_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, analysis_id)
);

-- 공유 링크 테이블
CREATE TABLE share_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(12) UNIQUE NOT NULL,  -- nanoid
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active   BOOLEAN DEFAULT TRUE,
  expires_at  TIMESTAMP WITH TIME ZONE,     -- NULL = 영구
  view_count  INT DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_share_links_code ON share_links(code);

-- 메모 테이블 (기존 플로팅 메모 영속화)
CREATE TABLE memos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  timestamp   FLOAT,                        -- 영상 타임스탬프 (초)
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memos_user_analysis ON memos(user_id, analysis_id);
```

### 5.3 API Specification

---

#### API: 인증 - Google OAuth 로그인

##### `GET /api/v1/auth/google`

**Description**: Google OAuth 로그인 시작 (NextAuth.js 처리)

**Authentication**: None

**Response**: Redirect to Google OAuth consent screen

---

#### API: 인증 - 세션 조회

##### `GET /api/v1/auth/session`

**Description**: 현재 로그인 세션 정보 조회

**Authentication**: Required (JWT Bearer)

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer {accessToken} |

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string - UUID",
      "email": "string",
      "name": "string",
      "avatarUrl": "string | null",
      "tier": "free | premium",
      "dailyUsage": "number - 오늘 사용 횟수",
      "dailyLimit": "number - 일일 제한 (free: 5, premium: unlimited)"
    }
  }
}
```

**Error Responses**:
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | 인증 토큰이 필요합니다 |
| 401 | TOKEN_EXPIRED | 토큰이 만료되었습니다 |

---

#### API: 분석 히스토리 조회

##### `GET /api/v1/history`

**Description**: 사용자의 분석 히스토리 목록 조회 (페이지네이션)

**Authentication**: Required

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer {accessToken} |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | 페이지 번호 (default: 1) |
| limit | number | No | 페이지 크기 (default: 20, max: 50) |
| sort | string | No | 정렬 기준 (default: "newest") |
| search | string | No | 검색 키워드 (제목, 채널, 키워드) |

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string - analysis UUID",
        "videoId": "string",
        "title": "string",
        "channelName": "string",
        "duration": "number (seconds)",
        "thumbnailUrl": "string",
        "watchScore": "number (1-10)",
        "keywords": ["string"],
        "analyzedAt": "string (ISO 8601)",
        "hasShareLink": "boolean"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Error Responses**:
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | 인증이 필요합니다 |
| 400 | INVALID_PARAMS | 잘못된 파라미터입니다 |

---

#### API: 분석 결과 상세 조회

##### `GET /api/v1/history/:analysisId`

**Description**: 저장된 분석 결과 상세 조회

**Authentication**: Required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "string",
    "videoId": "string",
    "title": "string",
    "channelName": "string",
    "channelId": "string",
    "duration": "number",
    "viewCount": "number",
    "likeCount": "number",
    "thumbnailUrl": "string",
    "description": "string",
    "summary": "string",
    "watchScore": "number",
    "watchScoreReason": "string",
    "keywords": ["string"],
    "highlights": [
      {
        "timestamp": "number",
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
    "transcriptSource": "youtube | stt",
    "isKorean": "boolean",
    "isTranslated": "boolean",
    "targetLanguage": "string",
    "analyzedAt": "string (ISO 8601)",
    "memos": [
      {
        "id": "string",
        "content": "string",
        "timestamp": "number | null",
        "createdAt": "string"
      }
    ]
  }
}
```

**Error Responses**:
| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | 분석 결과를 찾을 수 없습니다 |
| 403 | FORBIDDEN | 접근 권한이 없습니다 |

---

#### API: 분석 기록 삭제

##### `DELETE /api/v1/history/:analysisId`

**Description**: 사용자의 분석 기록 삭제 (user_analyses 관계 삭제, 분석 데이터는 유지)

**Authentication**: Required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

---

#### API: 공유 링크 생성

##### `POST /api/v1/share`

**Description**: 분석 결과의 공유 링크 생성

**Authentication**: Required

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer {accessToken} |
| Content-Type | Yes | application/json |

**Request Body**:
```json
{
  "analysisId": "string (required) - 공유할 분석 UUID",
  "expiresInDays": "number (optional) - 만료 일수 (default: 30, null: 영구)"
}
```

**Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "shareCode": "string - 12자 nanoid",
    "shareUrl": "string - 전체 공유 URL",
    "expiresAt": "string (ISO 8601) | null"
  }
}
```

---

#### API: 공유 링크로 분석 조회

##### `GET /api/v1/shared/:shareCode`

**Description**: 공유 링크로 분석 결과 조회 (인증 불필요)

**Authentication**: None

**Response 200 OK**: 동일한 분석 상세 데이터 (메모 제외)

**Error Responses**:
| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | 공유 링크를 찾을 수 없습니다 |
| 410 | EXPIRED | 공유 링크가 만료되었습니다 |

---

#### API: 컬렉션 CRUD

##### `GET /api/v1/collections`

**Description**: 사용자의 컬렉션 목록 조회

**Authentication**: Required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "description": "string | null",
        "analysisCount": "number",
        "isPublic": "boolean",
        "createdAt": "string",
        "updatedAt": "string"
      }
    ]
  }
}
```

##### `POST /api/v1/collections`

**Request Body**:
```json
{
  "name": "string (required) - 컬렉션명 (max 100자)",
  "description": "string (optional) - 설명 (max 500자)"
}
```

##### `POST /api/v1/collections/:collectionId/analyses`

**Request Body**:
```json
{
  "analysisId": "string (required) - 추가할 분석 UUID"
}
```

##### `DELETE /api/v1/collections/:collectionId/analyses/:analysisId`

**Description**: 컬렉션에서 분석 제거

---

#### API: 사용량 확인

##### `GET /api/v1/usage`

**Description**: 현재 사용자의 일일 사용량 조회

**Authentication**: Required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "tier": "free | premium",
    "daily": {
      "used": 3,
      "limit": 5,
      "remaining": 2,
      "resetsAt": "string (ISO 8601) - 다음 리셋 시간"
    },
    "maxVideoDuration": 1800
  }
}
```

---

#### API: 기존 분석 엔드포인트 변경사항

##### `POST /api/v1/analysis` (Updated)

**변경사항**:
- 로그인 사용자: 분석 완료 후 자동 저장, user_analyses 관계 생성
- 사용량 카운터 증가
- 무료 사용자: 일일 5회 제한 초과 시 429 응답
- 동일 videoId + targetLanguage 조합이 DB에 있고 미만료 시 캐시 반환

**추가 Request Body 필드**:
```json
{
  "url": "string (required)",
  "language": "string (optional, default: 'auto')",
  "targetLanguage": "string (optional, default: 'ko') - 번역 대상 언어"
}
```

**추가 Error Responses**:
| Status | Code | Message |
|--------|------|---------|
| 429 | DAILY_LIMIT_EXCEEDED | 일일 분석 횟수를 초과했습니다 (무료: 5회/일) |
| 403 | VIDEO_TOO_LONG_FREE | 무료 사용자는 30분 이하 영상만 분석 가능합니다 |

---

### 5.4 Frontend New Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | 랜딩 페이지 (기존 유지 + 로그인 버튼) | No |
| `/analyze/[videoId]` | 분석 결과 (기존 유지 + 저장/공유 버튼) | No |
| `/history` | 분석 히스토리 대시보드 | Yes |
| `/collections` | 학습 컬렉션 목록 | Yes |
| `/collections/[id]` | 컬렉션 상세 | Yes |
| `/shared/[code]` | 공유 링크 뷰 (읽기 전용) | No |
| `/settings` | 사용자 설정 (프로필, 계정) | Yes |

### 5.5 Technology Additions

| Category | Technology | Purpose |
|----------|-----------|---------|
| Auth | NextAuth.js v5 | OAuth 소셜 로그인 |
| ORM | Prisma | PostgreSQL 접근 |
| DB | PostgreSQL 16 | 데이터 영속성 |
| ID | nanoid | 공유 링크 코드 생성 |
| State | Zustand | 클라이언트 상태 관리 (인증 상태) |
| i18n | next-intl | 다국어 UI (향후) |

---

## 6. Implementation Phases

### Phase 1: Foundation (MVP) - DB & Auth
- [ ] PostgreSQL 도입 (docker-compose에 추가)
- [ ] Prisma 스키마 정의 & 마이그레이션
- [ ] NextAuth.js 설정 (Google OAuth)
- [ ] JWT 토큰 관리 (Access + Refresh)
- [ ] 로그인/로그아웃 UI
- [ ] 인증 미들웨어 (API 보호)
- [ ] 사용자 프로필 페이지

**Deliverable**: 로그인 가능한 사용자 시스템

### Phase 2: Data Persistence - 분석 결과 저장
- [ ] 분석 결과 DB 저장 로직
- [ ] 동일 videoId 캐시 히트 (DB 조회)
- [ ] 히스토리 목록 API & UI
- [ ] 히스토리 검색/정렬/페이지네이션
- [ ] 분석 기록 삭제
- [ ] 메모 영속화 (DB 저장)

**Deliverable**: 분석 결과가 저장되고 히스토리로 재조회 가능

### Phase 3: Social & Collections - 공유 & 컬렉션
- [ ] 공유 링크 생성 API & UI
- [ ] 공유 링크 뷰 페이지 (/shared/[code])
- [ ] 컬렉션 CRUD API & UI
- [ ] 컬렉션에 분석 추가/제거
- [ ] GitHub OAuth 추가

**Deliverable**: 분석 결과 공유 및 컬렉션 정리 가능

### Phase 4: Premium & Multi-language - 수익화 & 확장
- [ ] 무료/프리미엄 티어 구분
- [ ] 일일 사용량 제한 & 카운터
- [ ] 번역 언어 선택 UI
- [ ] 일본어 번역 프롬프트 추가
- [ ] 중국어/스페인어 번역 확장
- [ ] 스크립트 내보내기 (PDF/TXT)

**Deliverable**: 프리미엄 모델 및 다국어 지원

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| 일일 활성 사용자 (DAU) | 100+ (3개월 후) | Analytics |
| 월 분석 수 | 5,000건+ | DB count |
| 회원가입 전환율 | 30%+ (비로그인→로그인) | Analytics |
| 재방문율 | 40%+ | Analytics |
| 평균 분석 시간 | < 60s (캐시 미스) | API logs |
| 캐시 히트율 | 30%+ | API metrics |
| 공유 링크 생성율 | 분석 건수의 10%+ | DB count |
| 프리미엄 전환율 | 5%+ (6개월 후) | Payment |

---

## 8. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenAI API 비용 증가 | High | Medium | 캐시 적극 활용, 무료 사용량 제한 |
| YouTube API 정책 변경 | High | Low | 자막 추출 다중 소스 유지 |
| DB 성능 저하 (대용량) | Medium | Low | 인덱싱, 분석 만료 정책, 아카이빙 |
| OAuth 인증 실패 | Medium | Low | 다중 프로바이더, 에러 안내 |
| 스크립트 저작권 이슈 | High | Medium | 개인 학습 용도 명시, 저작권 안내 |
