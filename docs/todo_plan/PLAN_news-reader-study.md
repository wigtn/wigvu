# Task Plan: WIGVU News Reader - 영어 뉴스 읽기 학습 도구

> **Generated from**: docs/prd/PRD_news-reader-study.md
> **Created**: 2026-02-09
> **Status**: pending

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | true | Phase별 중간 커밋 |
| `quality_gate` | true | /auto-commit 품질 검사 |

## Reuse Strategy

기존 코드베이스에서 재활용할 컴포넌트:
- `ScriptPanel` → `ArticlePanel` (타임스탬프 제거, 구조분석 버튼 추가)
- `FloatingMemo` → 학습 노트 (props명 변경)
- `LoadingState` → 기사 분석 진행률 (단계명 변경)
- `useAnalysisStream` → `useArticleAnalysis` (이벤트 타입 변경)
- `UrlInput` → 확장 (텍스트 입력 추가, YouTube 검증 제거)
- `ui/*` → 그대로 사용

## Phases

### Phase 1: Core Reading Experience (MVP)

**Goal**: URL/텍스트 입력 → 문장별 번역 + 표현 추출 동작

- [ ] 1.1 프로젝트 구조 정리
  - YouTube 전용 코드를 별도 디렉토리로 분리
  - 공통 컴포넌트(ui, providers, theme) 유지
  - 새 라우트 구조 설정 (/read/[id], /vocabulary)
- [ ] 1.2 BYOK API Key 설정
  - ApiKeyInput 컴포넌트 작성
  - localStorage 저장/조회 로직
  - API Key 유효성 검증 (OpenAI test call)
  - 미설정 시 안내 UI
- [ ] 1.3 입력 컴포넌트 확장
  - UrlInput → ContentInput 리팩토링
  - URL 탭 / 텍스트 탭 전환
  - URL 입력 시 텍스트 추출 (Next.js API Route)
  - 텍스트 직접 붙여넣기
- [ ] 1.4 기사 분석 API Route
  - POST /api/analyze-article 엔드포인트
  - OpenAI 프롬프트 (번역 + 표현 추출 통합)
  - SSE 스트리밍 응답
  - 에러 핸들링 (API Key 검증, 텍스트 길이 제한)
- [ ] 1.5 라인바이라인 ArticlePanel
  - ScriptPanel 기반으로 ArticlePanel 작성
  - 문장별 원문/번역 대조 표시
  - 표시 모드 토글 (양쪽/원문만/번역만)
  - 문장 난이도 색상 표시
- [ ] 1.6 ExpressionBar 컴포넌트
  - KeyMomentsBar 기반으로 ExpressionBar 작성
  - 숙어/표현 카드 목록
  - 각 표현: 원문, 뜻, 카테고리
  - 개별/전체 저장 버튼
- [ ] 1.7 분석 진행률 UI
  - LoadingState 적응 (단계명: 문장분리→번역→표현추출)
  - useArticleAnalysis 훅 (useAnalysisStream 기반)

### Phase 2: Deep Learning Features

**Goal**: 문장 구조 분석 + 하이라이트 팝오버 동작

- [ ] 2.1 문장 구조 파싱 API
  - POST /api/parse-sentence 엔드포인트
  - OpenAI 프롬프트 (구조 분석 전용)
  - JSON 응답 파싱 & 검증
- [ ] 2.2 SentenceParser 컴포넌트
  - 문장 성분별 색상 구분 표시
  - 한국어 읽는 순서 표시
  - 문법 포인트 설명 카드
  - 접기/펼치기 토글
- [ ] 2.3 ArticlePanel에 "구조 분석" 버튼 통합
  - 각 문장 우측에 🔍 버튼
  - 클릭 시 해당 문장 아래에 파싱 결과 펼침
  - 로딩 상태 표시
- [ ] 2.4 useTextSelection 훅
  - Selection API 기반 텍스트 선택 감지
  - 선택 위치 좌표 계산 (팝오버 위치용)
  - 선택 텍스트 + 포함 문장 추출
- [ ] 2.5 SelectionPopover 컴포넌트
  - 선택된 텍스트 위에 팝오버 표시
  - AI 단어 조회 API 호출 (POST /api/word-lookup)
  - 뜻, 발음, 문맥 해석 표시
  - "단어장 저장" 버튼
  - 이미 저장된 단어 "저장됨" 표시
  - Escape로 닫기
- [ ] 2.6 단어 조회 API Route
  - POST /api/word-lookup 엔드포인트
  - OpenAI 프롬프트 (단어 해석 전용)
  - 캐시: 같은 단어+문장 조합 sessionStorage 캐시

### Phase 3: Vocabulary & Polish

**Goal**: 단어장 완성 + UI 다듬기 + 배포

- [ ] 3.1 useVocabulary 훅
  - localStorage CRUD (추가, 조회, 삭제, 검색)
  - VocabularyItem 타입 정의
  - 중복 검사 (같은 단어 중복 저장 방지)
- [ ] 3.2 단어장 페이지 (/vocabulary)
  - 저장된 단어/표현 목록 (최신순)
  - 검색 필터
  - 단일/다중 삭제
  - 출처 기사 표시
- [ ] 3.3 저장 연동
  - SelectionPopover → useVocabulary 연결
  - ExpressionBar → useVocabulary 연결
  - 저장 시 토스트 알림
- [ ] 3.4 JSON 내보내기/가져오기
  - 내보내기: JSON 파일 다운로드
  - 가져오기: 파일 업로드 → 기존 데이터와 병합
- [ ] 3.5 학습 통계
  - 총 분석 기사 수, 저장 표현 수
  - 일별 학습 기록 (간단한 streak 표시)
- [ ] 3.6 UI 마무리
  - 다크/라이트 모드 완성
  - 반응형 모바일 최적화
  - 랜딩 페이지 디자인
  - 에러 메시지 한국어화
- [ ] 3.7 배포
  - Vercel 배포 설정
  - 환경변수 설정 (기본 API Key - 일 3회 무료)
  - README 작성

## Dependencies

```
Phase 1 (MVP)
  ├── 1.2 API Key → 1.4 분석 API
  ├── 1.3 입력 → 1.4 분석 API
  └── 1.4 분석 API → 1.5 ArticlePanel
                    → 1.6 ExpressionBar
                    → 1.7 진행률 UI

Phase 2 (Deep Features)
  ├── 2.1 파싱 API → 2.2 SentenceParser → 2.3 ArticlePanel 통합
  └── 2.4 useTextSelection → 2.5 SelectionPopover → 2.6 단어 조회 API

Phase 3 (Vocabulary & Polish)
  ├── 3.1 useVocabulary → 3.2 단어장 페이지 → 3.3 저장 연동
  └── 3.4~3.7 독립적으로 진행 가능
```

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 0/20 |
| Current Phase | - |
| Status | pending |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| - | - | - | - |
