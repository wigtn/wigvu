# Task Plan: WigVu v2 Hackathon Upgrade

> **Generated from**: docs/prd/PRD_wigvu-v2-hackathon.md
> **Created**: 2026-02-04
> **Status**: pending

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | true | Phase별 중간 커밋 |
| `quality_gate` | true | /auto-commit 품질 검사 |

---

## Phase 1: 영상 길이 확대 + 청킹 (P0)

### 1-1. 환경변수 및 설정값 업데이트
- [ ] `.env.example` (루트/api/ai) - `MAX_VIDEO_DURATION_MINUTES=120`, `MAX_TRANSCRIPT_LENGTH=200000`, `MAX_SEGMENTS_COUNT=5000`
- [ ] `apps/ai/app/config.py` - 기본값 업데이트
- [ ] `apps/api/src/common/config/configuration.ts` - 기본값 업데이트
- [ ] `apps/web/src/lib/constants.ts` - `TRANSCRIPT.MAX_LENGTH`, `STT.DEFAULT_MAX_DURATION_MINUTES` 업데이트
- [ ] `docker-compose.yml`, `docker-compose.hub.yml` - 환경변수 반영
- [ ] 타임아웃 확대: `TIMEOUT_STT=600`, `TIMEOUT_ANALYZE=120`

### 1-2. AI 서비스 청킹 로직
- [ ] `apps/ai/app/services/chunking.py` (신규) - 트랜스크립트 청킹 유틸리티
  - 12,000자 단위 분할, 타임스탬프 기반 자연 구간
  - 500자 오버랩
- [ ] `apps/ai/app/services/llm_service.py` - 청크별 분석 + 결과 병합 로직
  - 청크별 요약 → 통합 요약 2차 생성
  - 키워드 중복 제거 + 병합
  - 하이라이트 타임스탬프 유지
- [ ] `apps/ai/app/services/translation_service.py` - 청크별 번역 처리
- [ ] `apps/ai/app/api/analyze.py` - 청킹 분기 추가

### 1-3. 프론트엔드 업데이트
- [ ] 프로그레스 표시 (청킹 진행률) - 스트리밍 응답에 청크 진행 상태 포함

**Deliverable**: 2시간 영상 분석 가능

---

## Phase 2: 웹 URL 크롤링/번역/요약 (P0)

### 2-1. API 서비스 (NestJS)
- [ ] `npm install cheerio @mozilla/readability jsdom` (apps/api)
- [ ] `apps/api/src/modules/article/article.module.ts` (신규)
- [ ] `apps/api/src/modules/article/article.controller.ts` (신규) - `POST /api/v1/article/analyze`
- [ ] `apps/api/src/modules/article/article.service.ts` (신규) - 크롤링 + 본문 추출
- [ ] `apps/api/src/modules/article/dto/` (신규) - AnalyzeArticleDto
- [ ] AppModule에 ArticleModule 등록
- [ ] URL 판별 유틸리티 (YouTube vs 일반 URL)

### 2-2. AI 서비스 (FastAPI)
- [ ] `apps/ai/app/api/article.py` (신규) - 기사 분석 엔드포인트
- [ ] `apps/ai/app/services/article_analyzer.py` (신규) - 기사 번역 + 요약 + 키워드 추출
- [ ] 라우터 등록 (`main.py`)

### 2-3. 프론트엔드
- [ ] URL 입력 컴포넌트 수정 - YouTube/웹 URL 자동 판별
- [ ] `apps/web/src/lib/services/article-service.ts` (신규) - API 연동
- [ ] `apps/web/src/components/article-view.tsx` (신규) - 기사 분석 결과 뷰
- [ ] 원문/번역 토글 UI
- [ ] 기존 라우팅에 기사 분석 결과 통합

**Deliverable**: 신문기사 URL → 번역/요약 결과 표시

---

## Phase 3: 메모 기능 강화 (P1)

### 3-1. 메모 영속화
- [ ] `apps/web/src/lib/memo-storage.ts` (신규) - localStorage 기반 메모 CRUD
  - Key: `wigvu_memo_{contentId}`
  - debounce 자동 저장 (1초)
- [ ] `apps/web/src/components/floating-memo.tsx` - localStorage 연동으로 리팩토링
- [ ] 메모 목록 UI (이전 메모 열람)

### 3-2. AI 핵심 정리
- [ ] AI 서비스: vocabulary 추출 프롬프트 추가 (analyze 응답 확장)
- [ ] 프론트엔드: "핵심 정리" 탭/버튼 UI
- [ ] 키워드 목록 (영어-한국어 쌍) 표시
- [ ] bullet point 요약 표시

### 3-3. 내보내기
- [ ] 통합 내보내기 (메모 + 키워드 + 요약 → Markdown 파일)
- [ ] 기사/영상 구분 내보내기 템플릿

**Deliverable**: 영속 메모 + AI 키워드 자동 정리

---

## Phase 4: Expo 모바일 앱 MVP (P2)

### 4-1. 프로젝트 초기화
- [ ] `npx create-expo-app apps/mobile` (Expo Router 기반)
- [ ] 프로젝트 구조 설정 (app/, components/, lib/, types/)
- [ ] API 서비스 연동 레이어

### 4-2. 핵심 화면
- [ ] 홈 화면 - URL 입력 (YouTube + 웹 URL)
- [ ] 분석 결과 화면 - 번역, 요약, 키워드
- [ ] 메모 화면 - AsyncStorage 기반

### 4-3. 공통
- [ ] 네비게이션 설정 (Expo Router)
- [ ] 에러 핸들링 + 로딩 UI
- [ ] 기본 테마/스타일

**Deliverable**: Expo Go에서 기본 분석 기능 사용 가능

---

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 0/~40 |
| Current Phase | - |
| Status | pending |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| - | - | - | - |
