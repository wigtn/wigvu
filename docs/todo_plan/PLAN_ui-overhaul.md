# Task Plan: UI Overhaul

> **Generated from**: docs/prd/PRD_ui-overhaul.md v2.1
> **Created**: 2026-02-13
> **Updated**: 2026-02-13
> **Status**: completed

## Execution Config

| Option | Value | Description |
|--------|-------|-------------|
| `auto_commit` | true | 완료 시 자동 커밋 |
| `commit_per_phase` | true | Phase별 중간 커밋 |
| `quality_gate` | true | /auto-commit 품질 검사 |

## Phases

### Phase 1: 디자인 시스템 + 사이드바 레이아웃 기반
- [x] `globals.css` 컬러 시스템 교체 (Light/Dark + Sidebar 토큰)
- [x] Pretendard 폰트 설정 (`layout.tsx` — CDN)
- [x] 타이포그래피 스케일 CSS 유틸리티 클래스
- [x] `layout.tsx`에 사이드바 + 콘텐츠 영역 글로벌 레이아웃
- [x] `components/layout/sidebar.tsx` (펼침/접힘, 섹션, 유틸리티)
- [x] `components/layout/sidebar-item.tsx` (아이콘, 텍스트, 활성 상태)
- [x] `components/layout/mobile-header.tsx` (햄버거+로고+언어)
- [x] `components/layout/sidebar-overlay.tsx` (모바일 오버레이)
- [x] 기존 YouTube 다크모드 전용 스타일 제거
- [x] `hero-section.tsx`, `klaim-pricing-table.tsx` 삭제

### Phase 2: 메인 페이지 (인풋) + Video 페이지
- [x] `app/page.tsx` 재작성 — Liner Scholar 스타일 텍스트/URL 인풋
- [x] `components/study/study-input.tsx` (텍스트에어리어, URL 감지, CTA)
- [x] `components/study/recommended-links.tsx` (추천 글 링크 5개)
- [x] `components/language-selector.tsx` (사이드바 드롭다운)
- [x] `app/video/page.tsx` — 수직 중앙 URL 인풋 + 기능 카드
- [x] 기존 `page.tsx` 모놀리식 코드 완전 제거
- [x] `navigation.tsx` 삭제

### Phase 3: Study 학습 화면
- [x] `app/study/page.tsx` — 학습 화면 (교차 배치 + 표현 카드 + 복습 요약)
- [x] `components/study/sentence-view.tsx` (교차/원문만/번역만 문장 렌더링)
- [x] `components/study/view-mode-toggle.tsx` (pill 토글 UI)
- [x] `components/study/expression-card.tsx` 리디자인 (새 컬러 토큰)
- [x] `components/study/expression-summary.tsx` (카테고리별 복습 요약)
- [x] 로딩 스켈레톤 UI + 에러 처리 UI
- [x] 기존 `article-list.tsx`, `article-reader.tsx`, `study-mode-panel.tsx` 삭제
- [x] 기존 `app/read/` 디렉토리 삭제

### Phase 4: Video 분석 + 마무리
- [x] `analyze/[videoId]` 페이지 컬러 시스템 적용 (CSS 변수 자동 적용)
- [x] 기존 analysis 컴포넌트 컬러 토큰 교체 (CSS 변수 자동 적용)
- [x] 불필요한 CSS/컴포넌트/import 정리 (`klaim.d.ts` 삭제)
- [x] `next build` 빌드 검증 ✅

## File Summary

### 삭제 (9개)
| 파일 | 이유 |
|------|------|
| `hero-section.tsx` | 캐러셀 제거 |
| `klaim-pricing-table.tsx` | 프라이싱 제거 |
| `navigation.tsx` | 사이드바로 대체 |
| `types/klaim.d.ts` | 프라이싱 타입 제거 |
| 기존 `page.tsx` 모놀리식 코드 | 완전 재작성 |
| `components/study/article-list.tsx` | 카드 그리드 제거 (인풋 중심 전환) |
| `components/study/article-reader.tsx` | `/read/` 라우트 제거 |
| `components/study/study-mode-panel.tsx` | 즉시 학습 모드 (별도 진입 없음) |
| `app/read/` 디렉토리 | `/study` 단일 라우트로 대체 |

### 신규 (12개)
| 파일 | 역할 |
|------|------|
| `components/layout/sidebar.tsx` | 사이드바 메인 |
| `components/layout/sidebar-item.tsx` | 사이드바 항목 |
| `components/layout/mobile-header.tsx` | 모바일 상단 바 |
| `components/layout/sidebar-overlay.tsx` | 모바일 오버레이 |
| `components/language-selector.tsx` | 언어 드롭다운 |
| `app/video/page.tsx` | 영상 분석 전용 페이지 |
| `app/study/page.tsx` | 학습 화면 |
| `components/study/study-input.tsx` | 텍스트/URL 인풋 |
| `components/study/sentence-view.tsx` | 문장 교차/원문/번역 뷰 |
| `components/study/view-mode-toggle.tsx` | 보기 모드 토글 |
| `components/study/expression-summary.tsx` | 표현 복습 요약 |
| `components/study/recommended-links.tsx` | 추천 글 링크 |

### 수정 (4개)
| 파일 | 변경 |
|------|------|
| `globals.css` | 컬러/타이포 전면 교체 + 사이드바 토큰 |
| `app/layout.tsx` | Pretendard + 사이드바 레이아웃 |
| `app/page.tsx` | Liner Scholar 인풋 중심으로 재작성 |
| `components/study/expression-card.tsx` | 새 컬러 토큰 적용 |

## Progress

| Metric | Value |
|--------|-------|
| Total Tasks | 31/31 |
| Current Phase | - |
| Status | ✅ completed |

## Execution Log

| Timestamp | Phase | Task | Status |
|-----------|-------|------|--------|
| 2026-02-13 | Phase 1 | globals.css + layout + sidebar | ✅ completed |
| 2026-02-13 | Phase 2 | page.tsx + video + input components | ✅ completed |
| 2026-02-13 | Phase 3 | study page + sentence/expression views | ✅ completed |
| 2026-02-13 | Phase 4 | cleanup + build verification | ✅ completed |
