# Task Plan: WIGVU v2.0 Enhancement

> **Generated from**: docs/prd/PRD_wigvu-v2-enhancement.md
> **Created**: 2026-02-09
> **Status**: pending

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | true | Phase별 중간 커밋 |
| `quality_gate` | true | /auto-commit 품질 검사 |

## Phases

### Phase 1: Foundation (MVP) - DB & Auth

**Goal**: 로그인 가능한 사용자 시스템 구축

- [ ] 1.1 PostgreSQL 서비스 docker-compose.yml에 추가
- [ ] 1.2 Prisma ORM 설치 및 스키마 정의 (users, analyses, user_analyses, collections, collection_analyses, share_links, memos)
- [ ] 1.3 Prisma 마이그레이션 실행 & seed 데이터 작성
- [ ] 1.4 NextAuth.js v5 설치 및 Google OAuth 설정
- [ ] 1.5 JWT Access/Refresh Token 관리 로직
- [ ] 1.6 로그인/로그아웃 UI 컴포넌트 (네비게이션 바)
- [ ] 1.7 인증 미들웨어 (API Route 보호)
- [ ] 1.8 사용자 프로필 페이지 (/settings)
- [ ] 1.9 환경변수 업데이트 (.env.example)

### Phase 2: Data Persistence - 분석 결과 저장

**Goal**: 분석 결과가 DB에 저장되고 히스토리로 재조회 가능

- [ ] 2.1 분석 완료 후 DB 저장 로직 (analysis API route 수정)
- [ ] 2.2 동일 videoId + targetLanguage 조합 캐시 히트 (DB 조회 우선)
- [ ] 2.3 user_analyses 관계 자동 생성 (로그인 사용자)
- [ ] 2.4 히스토리 목록 API (`GET /api/v1/history`)
- [ ] 2.5 히스토리 검색/정렬/페이지네이션
- [ ] 2.6 히스토리 페이지 UI (/history)
- [ ] 2.7 분석 기록 삭제 API & UI
- [ ] 2.8 메모 영속화 API (CRUD: 생성, 조회, 수정, 삭제)
- [ ] 2.9 기존 플로팅 메모 컴포넌트 DB 연동

### Phase 3: Social & Collections - 공유 & 컬렉션

**Goal**: 분석 결과 공유 및 컬렉션 정리 기능

- [ ] 3.1 공유 링크 생성 API (`POST /api/v1/share`)
- [ ] 3.2 공유 링크 뷰 페이지 (`/shared/[code]`)
- [ ] 3.3 공유 버튼 UI (분석 결과 페이지에 추가)
- [ ] 3.4 컬렉션 CRUD API
- [ ] 3.5 컬렉션 목록 페이지 UI (/collections)
- [ ] 3.6 컬렉션 상세 페이지 UI (/collections/[id])
- [ ] 3.7 분석 결과에서 "컬렉션에 추가" UI
- [ ] 3.8 GitHub OAuth 추가

### Phase 4: Premium & Multi-language - 수익화 & 확장

**Goal**: 프리미엄 모델 및 다국어 지원

- [ ] 4.1 무료/프리미엄 티어 구분 로직
- [ ] 4.2 일일 사용량 제한 & 카운터 (무료: 5회/일)
- [ ] 4.3 사용량 API (`GET /api/v1/usage`)
- [ ] 4.4 사용량 초과 시 UI 안내 (업그레이드 유도)
- [ ] 4.5 번역 언어 선택 UI (드롭다운: ko, ja, zh-CN, es)
- [ ] 4.6 AI Service 번역 프롬프트 다국어 확장 (ja, zh-CN, es)
- [ ] 4.7 스크립트 내보내기 기능 (PDF/TXT)
- [ ] 4.8 키보드 단축키 구현 (Space, 방향키)
- [ ] 4.9 스크립트 텍스트 복사 기능

## Dependencies

```
Phase 1 ─────► Phase 2 ─────► Phase 3
                  │                │
                  └────────────────┴──► Phase 4
```

- Phase 2는 Phase 1 (DB & Auth)에 의존
- Phase 3는 Phase 2 (Data Persistence)에 의존
- Phase 4는 Phase 2에 의존 (일부 Phase 3)

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 0/35 |
| Current Phase | - |
| Status | pending |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| - | - | - | - |
