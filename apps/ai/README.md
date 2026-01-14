# QuickPreview AI Service

AI 백엔드 서비스 - LLM 기반 영상 분석 및 STT 프록시

## 기술 스택

- **Framework**: FastAPI
- **LLM**: OpenAI (gpt-4o-mini)
- **STT**: 외부 WhisperX API (프록시)
- **Rate Limiting**: slowapi
- **Logging**: structlog (JSON)
- **Retry**: tenacity (지수 백오프)

## API 엔드포인트

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | /analyze | LLM 기반 영상 분석 | 30/min |
| POST | /stt/transcribe | STT 프록시 | 10/min |
| POST | /whisperX/transcribe | STT 프록시 (하위 호환) | 10/min |
| GET | /health | 헬스체크 | - |

## 주요 기능

- **에러 응답 표준화**: 모든 에러는 일관된 형식으로 반환
- **입력값 검증**: Pydantic을 통한 강력한 입력 검증
- **재시도 로직**: 외부 API 호출 시 지수 백오프 (최대 3회)
- **Rate Limiting**: IP 기반 요청 제한
- **구조화된 로깅**: JSON 형식, request_id 추적

## 개발 시작

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에 OPENAI_API_KEY 설정

# 개발 서버
uvicorn main:app --reload --port 5000

# 테스트 실행
pytest
```

## 환경변수

```env
# Required
OPENAI_API_KEY=sk-...            # OpenAI API key

# Optional - API Configuration
OPENAI_MODEL=gpt-4o-mini         # LLM model
STT_API_URL=http://work.soundmind.life:12321
STT_MAX_DURATION_MINUTES=120
MAX_FILE_SIZE_MB=500

# Rate Limiting
RATE_LIMIT_ANALYZE=30            # /analyze 분당 요청 수
RATE_LIMIT_STT=10                # /stt 분당 요청 수

# Retry
RETRY_MAX_ATTEMPTS=3
RETRY_BASE_DELAY=1.0

# Timeouts (seconds)
TIMEOUT_ANALYZE=30
TIMEOUT_STT=300

# Validation
MAX_TITLE_LENGTH=200
MAX_TRANSCRIPT_LENGTH=50000

# Logging
LOG_LEVEL=INFO
```

## API 상세

### POST /analyze

영상 메타데이터와 자막을 분석하여 요약, 점수, 키워드, 하이라이트 반환

**Request:**
```json
{
  "metadata": {
    "title": "영상 제목 (필수, 최대 200자)",
    "channelName": "채널명 (필수, 최대 100자)",
    "description": "영상 설명 (최대 2000자)"
  },
  "transcript": "자막 텍스트 (최대 50000자)",
  "segments": [
    {"start": 0.0, "end": 5.0, "text": "세그먼트 텍스트"}
  ]
}
```

**Response (성공):**
```json
{
  "success": true,
  "data": {
    "summary": "3문장 요약",
    "watchScore": 8,
    "watchScoreReason": "점수 근거",
    "keywords": ["키워드1", "키워드2"],
    "highlights": [
      {"timestamp": 60, "title": "제목", "description": "설명"}
    ]
  }
}
```

**Response (에러):**
```json
{
  "success": false,
  "error": {
    "code": "LLM_ERROR",
    "message": "OpenAI API 호출에 실패했습니다",
    "details": {"retry_after": 5}
  }
}
```

### POST /stt/transcribe

외부 STT API 프록시

**Request:** `multipart/form-data`
- `audio`: 오디오 파일 (최대 500MB, webm/mp3/wav/m4a/ogg/flac)
- `language`: 언어 코드 (default: "auto")

**Response (성공):**
```json
{
  "text": "전체 텍스트",
  "language": "ko",
  "language_probability": 0.95,
  "segments": [
    {"start": 0.0, "end": 5.0, "text": "세그먼트"}
  ]
}
```

**Response (에러 - 플랫 형식):**
```json
{
  "error": "FILE_TOO_LARGE",
  "message": "파일 크기가 500MB를 초과합니다"
}
```

### 에러 코드

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_REQUEST | 400 | 잘못된 요청 형식 |
| TITLE_REQUIRED | 400 | 필수 필드 누락 |
| FILE_TOO_LARGE | 400 | 파일 크기 초과 |
| INVALID_FILE | 400 | 지원하지 않는 파일 |
| RATE_LIMIT_EXCEEDED | 429 | 요청 한도 초과 |
| LLM_ERROR | 500 | OpenAI API 오류 |
| STT_ERROR | 500 | STT API 오류 |
| SERVICE_UNAVAILABLE | 503 | 서비스 불가 |

## 테스트

```bash
# 전체 테스트
pytest

# 커버리지 포함
pytest --cov=app

# 특정 테스트
pytest tests/test_analyze.py -v
```

## Docker

```bash
# 빌드
docker build -t quickpreview-ai .

# 실행
docker run -p 5000:5000 -e OPENAI_API_KEY=sk-... quickpreview-ai
```

## docker-compose

```bash
# 전체 서비스 실행
docker-compose up -d

# AI 서비스만 실행
docker-compose up -d ai
```

## 프로젝트 구조

```
apps/ai/
├── main.py                 # FastAPI 엔트리포인트
├── requirements.txt        # Python 의존성
├── pytest.ini             # 테스트 설정
├── Dockerfile             # Docker 빌드
├── .env.example           # 환경변수 예시
│
├── app/
│   ├── __init__.py
│   ├── config.py          # 설정 관리
│   │
│   ├── api/
│   │   ├── router.py      # API 라우터
│   │   ├── analyze.py     # /analyze 엔드포인트
│   │   ├── stt.py         # /stt/transcribe 엔드포인트
│   │   └── health.py      # /health 엔드포인트
│   │
│   ├── core/
│   │   ├── exceptions.py  # 커스텀 예외
│   │   ├── error_handlers.py  # 전역 에러 핸들러
│   │   ├── middleware.py  # 미들웨어 (request_id, logging)
│   │   └── rate_limiter.py # Rate Limiting 설정
│   │
│   ├── services/
│   │   ├── llm.py         # OpenAI LLM 서비스
│   │   └── stt_client.py  # 외부 STT API 클라이언트
│   │
│   └── models/
│       └── schemas.py     # Pydantic 모델
│
└── tests/
    ├── conftest.py        # 테스트 fixtures
    ├── test_health.py
    ├── test_analyze.py
    ├── test_stt.py
    ├── test_validation.py
    └── test_exceptions.py
```
