<div align="center">

# WIGVU (윅뷰)

**WIGTN View** - YouTube 영상의 자막을 추출하고 한국어로 번역하여 실시간으로 동기화된 스크립트를 제공하는 서비스입니다.

[English](./README.md) | [한국어](./README.ko.md)

![CI](https://github.com/wigtn/wigvu/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/wigtn/wigvu/actions/workflows/cd.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Claude Code Skills로 개발

이 프로젝트는 **[wigtn-plugins](https://github.com/wigtn/wigtn-plugins-with-claude-code)**를 사용하여 빠르게 개발되었습니다. wigtn-plugins는 효율적인 개발을 위한 Claude Code Skills 플러그인 모음입니다.

전체 마이크로서비스 아키텍처(Web, API, AI)가 AI 기반 개발 워크플로우를 통해 설계 및 구현되었으며, 프로덕션 수준의 애플리케이션 개발에서 Claude Code Skills의 강력함을 보여줍니다.

---

## 주요 기능

- **자막 추출** - YouTube 자막 또는 WhisperX STT를 통한 자막 추출
- **자동 번역** - OpenAI GPT-4o-mini를 사용한 영어→한국어 번역
- **AI 분석** - 요약, 시청 점수, 키워드, 하이라이트 생성
- **실시간 동기화** - 영상 재생과 동기화된 스크립트 패널
- **메모 기능** - 영상 시청 중 메모 작성

---

## 아키텍처

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│    Web      │     │   OpenAI    │
│  (SSL/TLS)  │     │  (Next.js)  │     │   GPT-4o    │
└──────┬──────┘     └──────┬──────┘     └─────────────┘
       │                   │                   ▲
       │            ┌──────▼──────┐     ┌──────┴──────┐
       └───────────▶│    API      │────▶│     AI      │
                    │  (NestJS)   │     │  (FastAPI)  │
                    │  Port 4000  │     │  Port 5000  │
                    └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │  WhisperX   │
                                        │  (STT API)  │
                                        └─────────────┘
```

| 서비스 | 기술 스택 | 포트 | 역할 |
|--------|-----------|------|------|
| Web | Next.js 16, React 19 | 3000 | 프론트엔드 UI |
| API | NestJS 10, TypeScript | 4000 | API 게이트웨이 |
| AI | FastAPI, Python 3.11 | 5000 | LLM 분석, STT |

---

## 프로젝트 구조

```
wigvu/
├── apps/
│   ├── web/              # 프론트엔드 (Next.js 16)
│   ├── api/              # 백엔드 API 게이트웨이 (NestJS 10)
│   └── ai/               # AI 백엔드 (FastAPI)
├── docs/
│   ├── prd/              # PRD 문서
│   └── deployment/       # 배포 가이드
├── nginx/                # Nginx 설정
├── scripts/              # GCP 배포 스크립트
├── .github/workflows/    # CI/CD 파이프라인
├── docker-compose.yml    # 로컬 개발용
├── docker-compose.hub.yml # 프로덕션 배포용
└── .env.example          # 환경변수 예시
```

---

## 기술 스택

**프론트엔드**
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4, TanStack Query, Radix UI

**백엔드 API**
- NestJS 10, Express, TypeScript
- ytdl-core, Circuit Breaker 패턴

**AI 서비스**
- FastAPI, Python 3.11
- OpenAI API, WhisperX, yt-dlp

**인프라**
- Docker, Nginx, Let's Encrypt
- GitHub Actions, GCP Compute Engine

---

## 빠른 시작

### Docker Compose 사용 (권장)

```bash
# 저장소 클론
git clone https://github.com/wigtn/wigvu.git
cd wigvu

# 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 모든 서비스 실행
docker-compose up -d

# 접속
# Web: http://localhost:3000
# API: http://localhost:4000/api/v1/health
# AI:  http://localhost:5000/health
```

### 개별 서비스 실행

```bash
# Web (터미널 1)
cd apps/web
npm install
npm run dev

# API (터미널 2)
cd apps/api
npm install
npm run start:dev

# AI (터미널 3)
cd apps/ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

---

## 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 | O |
| `INTERNAL_API_KEY` | 서비스 간 인증 키 | O |
| `YOUTUBE_API_KEY` | YouTube Data API v3 키 | △ |
| `STT_API_URL` | WhisperX STT 서버 URL | △ |
| `OPENAI_MODEL` | OpenAI 모델 (기본: gpt-4o-mini) | - |
| `MAX_VIDEO_DURATION_MINUTES` | 분석 가능 최대 영상 길이 | - |

모든 옵션은 [.env.example](./.env.example)을 참조하세요.

---

## API 엔드포인트

### API 게이트웨이 (Port 4000)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/v1/health` | 헬스 체크 |
| GET | `/api/v1/youtube/metadata/:videoId` | 영상 메타데이터 조회 |
| GET | `/api/v1/transcript/:videoId` | 자막 조회 |
| POST | `/api/v1/analysis` | 전체 영상 분석 |

### AI 서비스 (Port 5000)

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/health` | 헬스 체크 |
| POST | `/api/v1/analyze` | LLM 분석 |
| POST | `/api/v1/translate` | 번역 |
| POST | `/stt/video/:videoId` | 음성 인식 |

---

## 배포

### Docker Hub 이미지

Docker Hub에서 빌드된 이미지를 사용할 수 있습니다:

```bash
docker-compose -f docker-compose.hub.yml up -d
```

- `morirokim/wigvu-web:latest`
- `morirokim/wigvu-api:latest`
- `morirokim/wigvu-ai:latest`

### GCP 배포

- [빠른 시작 가이드](./docs/deployment/QUICK_START.md)
- [GCP 배포 가이드](./docs/deployment/GCP_DEPLOYMENT_GUIDE.md)
- [SSL 설정 가이드](./docs/deployment/SSL_SETUP_GUIDE.md)

---

## 문서

- [PRD - WIGVU 서비스](./docs/prd/wigvu-service.md)
- [PRD - AI 서비스](./docs/prd/ai-service.md)
- [PRD - 서비스 분리 리팩토링](./docs/prd/service-separation-refactoring.md)

---

## 라이선스

MIT License

Copyright (c) 2026 WIGTN Crew
