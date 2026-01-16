<div align="center">

# WIGTN Player - WIGPL !

YouTube subtitle extraction, translation, and real-time synchronization service.

[English](./README.md) | [한국어](./README.ko.md)

![CI](https://github.com/wigtn/wigtn-quickpreview/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/wigtn/wigtn-quickpreview/actions/workflows/cd.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Built with Claude Code Skills

This project was rapidly developed using **[wigtn-plugins](https://github.com/wigtn/wigtn-plugins-with-claude-code)**, a Claude Code Skills plugin suite for fast, efficient development.

The entire microservices architecture (Web, API, AI) was designed and implemented through an AI-assisted development workflow, demonstrating the power of Claude Code Skills for building production-ready applications.

---

## Features

- **Subtitle Extraction** - Extract subtitles from YouTube captions or via WhisperX STT
- **Auto Translation** - Translate English to Korean using OpenAI GPT-4o-mini
- **AI Analysis** - Generate summaries, watch scores, keywords, and highlights
- **Real-time Sync** - Synchronized script panel with video playback
- **Floating Memo** - Take notes while watching videos

---

## Architecture

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

| Service | Tech Stack | Port | Role |
|---------|------------|------|------|
| Web | Next.js 16, React 19 | 3000 | Frontend UI |
| API | NestJS 10, TypeScript | 4000 | API Gateway |
| AI | FastAPI, Python 3.11 | 5000 | LLM Analysis, STT |

---

## Project Structure

```
quickpreview/
├── apps/
│   ├── web/              # Frontend (Next.js 16)
│   ├── api/              # Backend API Gateway (NestJS 10)
│   └── ai/               # AI Backend (FastAPI)
├── docs/
│   ├── prd/              # Product Requirements Documents
│   └── deployment/       # Deployment Guides
├── nginx/                # Nginx Configuration
├── scripts/              # GCP Deployment Scripts
├── .github/workflows/    # CI/CD Pipelines
├── docker-compose.yml    # Local Development
├── docker-compose.hub.yml # Production Deployment
└── .env.example          # Environment Variables Template
```

---

## Tech Stack

**Frontend**
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4, TanStack Query, Radix UI

**Backend API**
- NestJS 10, Express, TypeScript
- ytdl-core, Circuit Breaker Pattern

**AI Service**
- FastAPI, Python 3.11
- OpenAI API, WhisperX, yt-dlp

**Infrastructure**
- Docker, Nginx, Let's Encrypt
- GitHub Actions, GCP Compute Engine

---

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/wigtn/wigtn-quickpreview.git
cd wigtn-quickpreview

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run all services
docker-compose up -d

# Access
# Web: http://localhost:3000
# API: http://localhost:4000/api/v1/health
# AI:  http://localhost:5000/health
```

### Running Services Individually

```bash
# Web (Terminal 1)
cd apps/web
npm install
npm run dev

# API (Terminal 2)
cd apps/api
npm install
npm run start:dev

# AI (Terminal 3)
cd apps/ai
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 5000
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API Key | Yes |
| `INTERNAL_API_KEY` | Inter-service Authentication Key | Yes |
| `YOUTUBE_API_KEY` | YouTube Data API v3 Key | Optional |
| `STT_API_URL` | WhisperX STT Server URL | Optional |
| `OPENAI_MODEL` | OpenAI Model (default: gpt-4o-mini) | No |
| `MAX_VIDEO_DURATION_MINUTES` | Max video length for analysis | No |

See [.env.example](./.env.example) for all available options.

---

## API Endpoints

### API Gateway (Port 4000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health Check |
| GET | `/api/v1/youtube/metadata/:videoId` | Get Video Metadata |
| GET | `/api/v1/transcript/:videoId` | Get Transcript |
| POST | `/api/v1/analysis` | Full Video Analysis |

### AI Service (Port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health Check |
| POST | `/api/v1/analyze` | LLM Analysis |
| POST | `/api/v1/translate` | Translation |
| POST | `/stt/video/:videoId` | Speech-to-Text |

---

## Deployment

### Docker Hub Images

Pre-built images are available on Docker Hub:

```bash
docker-compose -f docker-compose.hub.yml up -d
```

- `morirokim/wigtn-web:latest`
- `morirokim/wigtn-api:latest`
- `morirokim/wigtn-ai:latest`

### GCP Deployment

- [Quick Start Guide](./docs/deployment/QUICK_START.md)
- [GCP Deployment Guide](./docs/deployment/GCP_DEPLOYMENT_GUIDE.md)
- [SSL Setup Guide](./docs/deployment/SSL_SETUP_GUIDE.md)

---

## Documentation

- [PRD - QuickPreview Service](./docs/prd/quickpreview-service.md)
- [PRD - AI Service](./docs/prd/ai-service.md)
- [PRD - Service Separation](./docs/prd/service-separation-refactoring.md)

---

## License

MIT License

Copyright (c) 2026 WIGTN Crew
