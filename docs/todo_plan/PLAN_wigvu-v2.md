# WIGVU v2 Implementation Plan

> **PRD**: `docs/prd/PRD_wigvu-v2.md`
> **Created**: 2026-02-10
> **Status**: Active

---

## Phase 1: Architecture Refactoring + News Reader Core

### 1A. Folder Restructuring (Web)

- [ ] `features/video/` 디렉토리 생성
- [ ] `features/article/` 디렉토리 생성
- [ ] `shared/` 디렉토리 생성
- [ ] 기존 컴포넌트 → `features/video/components/`로 이동 (script-panel, analysis-result, analysis-view, key-moments-bar)
- [ ] 기존 hooks → `features/video/hooks/`로 이동 (use-analysis-stream, use-video-sync)
- [ ] 기존 lib/services → `features/video/lib/`로 이동 (ai-analysis, transcript, youtube-metadata)
- [ ] 기존 types, store → `features/video/`로 이동
- [ ] 공유 컴포넌트 → `shared/components/`로 이동 (ui/, error-*, floating-memo, loading-state, navigation, url-input, theme-toggle, providers)
- [ ] 공유 lib → `shared/lib/`로 이동 (config, errors, logger, constants, utils, translation)
- [ ] import 경로 전체 업데이트
- [ ] 빌드 확인 (`npm run build`)

### 1B. Folder Restructuring (AI)

- [ ] `api/video/` 디렉토리 생성, 기존 `analyze.py`, `translate.py` 이동
- [ ] `api/stt/` 디렉토리 생성, 기존 `stt.py` 이동
- [ ] `api/article/` 디렉토리 생성
- [ ] `services/video/` 디렉토리 생성, 기존 `llm.py`, `youtube_audio.py` 이동
- [ ] `services/shared/` 디렉토리 생성, 기존 `translation.py`, `stt_client.py` 이동
- [ ] `services/article/` 디렉토리 생성
- [ ] `router.py` 업데이트 (새 라우터 구조)
- [ ] import 경로 업데이트
- [ ] 테스트 확인

### 1C. Article Module (API - NestJS)

- [ ] `modules/article/` 디렉토리 생성 (Clean Architecture 구조)
- [ ] `article.module.ts` 정의
- [ ] `article.dto.ts` 작성 (AnalyzeArticleRequest, ParseSentenceRequest, WordLookupRequest)
- [ ] `article.entity.ts` 작성 (Article, Sentence, Expression 엔티티)
- [ ] `article-crawler.interface.ts` 정의 (IArticleCrawler 포트)
- [ ] `web-crawler.service.ts` 구현 (cheerio + @mozilla/readability + jsdom)
- [ ] `analyze-article.use-case.ts` 구현 (크롤링 → AI 서비스 호출 → SSE 응답)
- [ ] `article.controller.ts` 구현 (POST /api/v1/article/analyze)
- [ ] cheerio, @mozilla/readability, jsdom 패키지 설치
- [ ] SSRF 방지 (private IP 차단 로직)

### 1D. Article Analysis (AI - FastAPI)

- [ ] `models/article_schemas.py` 작성 (Pydantic 모델)
- [ ] `services/article/article_analyzer.py` 구현 (번역 + 표현 추출 프롬프트)
- [ ] `api/article/analyze.py` 라우터 구현
- [ ] `response_format: json_object` 적용
- [ ] 테스트 작성

### 1E. Article UI (Web - Next.js)

- [ ] `features/article/types/article.ts` 타입 정의
- [ ] `features/article/lib/article-service.ts` API 호출 서비스
- [ ] `features/article/hooks/use-article-analysis.ts` SSE 스트리밍 훅
- [ ] `features/article/components/article-panel.tsx` 라인바이라인 뷰
- [ ] `features/article/components/expression-bar.tsx` 표현 목록
- [ ] `shared/components/url-input.tsx` 확장 (기사/영상 탭)
- [ ] `app/read/[articleId]/page.tsx` 학습 뷰 페이지
- [ ] `app/api/article/stream/route.ts` SSE API Route
- [ ] 메인 페이지 리팩토링 (통합 랜딩)

---

## Phase 2: News Reader Deep Learning

### 2A. Sentence Parsing (API + AI)

- [ ] `parse-sentence.use-case.ts` 구현
- [ ] `article.controller.ts`에 POST /api/v1/article/parse-sentence 추가
- [ ] `services/article/sentence_parser.py` 구현 (구조 파싱 프롬프트)
- [ ] `api/article/parse_sentence.py` 라우터

### 2B. Word Lookup (API + AI)

- [ ] `lookup-word.use-case.ts` 구현
- [ ] `article.controller.ts`에 POST /api/v1/article/word-lookup 추가
- [ ] `services/article/word_lookup.py` 구현
- [ ] `api/article/word_lookup.py` 라우터

### 2C. Deep Learning UI (Web)

- [ ] `features/article/components/sentence-parser.tsx` 구조 분석 결과 UI
- [ ] `features/article/hooks/use-text-selection.ts` 텍스트 선택 감지 훅
- [ ] `features/article/components/selection-popover.tsx` 팝오버 UI
- [ ] 표시 모드 토글 (양쪽/원문만/번역만)
- [ ] 반응형 모바일 최적화

### 2D. Testing & QA

- [ ] 크롤링 테스트: BBC, CNN, Reuters, NYT, Guardian
- [ ] 번역 품질 검증 (10개 기사)
- [ ] 표현 추출 유용성 검증
- [ ] 구조 파싱 정확도 검증
- [ ] 팝오버 응답 시간 측정

---

## Phase 3: Auth & Data Persistence (Supabase)

- [ ] Supabase 프로젝트 생성
- [ ] Google OAuth Provider 설정
- [ ] DB 스키마 생성 (profiles, vocabulary, article_analyses, video_analyses, user_analyses)
- [ ] RLS 정책 적용
- [ ] Web: Supabase Auth 연동 (로그인/로그아웃)
- [ ] 단어장 CRUD (팝오버/표현바 → Supabase 저장)
- [ ] `/vocabulary` 페이지
- [ ] 분석 결과 DB 캐싱
- [ ] 히스토리 페이지

---

## Phase 4: V2 Enhancement (Future)

- [ ] 공유 링크
- [ ] 학습 컬렉션
- [ ] 다국어 번역
- [ ] 프리미엄 티어
- [ ] 영상 길이 확대 (청킹)
