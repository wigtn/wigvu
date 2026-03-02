# WIGVU Deployment Guide

## Architecture

```
                    Cloudflare DNS
                         │
        www.app.wigtn.com (CNAME)
                         │
              ┌──────────▼──────────┐
              │   Cloud Run: Web    │  ← Next.js (Port 3000)
              │   (Public)          │
              └──────────┬──────────┘
                         │ HTTPS (internal)
              ┌──────────▼──────────┐
              │   Cloud Run: API    │  ← NestJS (Port 4000)
              │   (Public)          │
              └──────────┬──────────┘
                         │ HTTPS (internal)
              ┌──────────▼──────────┐
              │   Cloud Run: AI     │  ← FastAPI (Port 5000)
              │   (Internal only)   │
              └─────────────────────┘
                         │
              ┌──────────▼──────────┐
              │     Supabase        │  ← Auth + PostgreSQL
              └─────────────────────┘
```

## Prerequisites

- GCP 프로젝트 (결제 활성화)
- `gcloud` CLI 설치 및 인증
- Cloudflare에서 `wigtn.com` DNS 관리 중
- Supabase 프로젝트 생성 완료

---

## Step 1: GCP 인프라 셋업

```bash
export GCP_PROJECT_ID="your-project-id"
bash scripts/setup-cloudrun.sh
```

이 스크립트가 자동으로 생성하는 것:
- Artifact Registry (Docker 이미지 저장소)
- Secret Manager (7개 시크릿)
- Service Account + IAM 역할
- Workload Identity Federation (GitHub Actions 연동)

## Step 2: Secret Manager 값 설정

```bash
# AI Service
echo -n 'sk-...' | gcloud secrets versions add OPENAI_API_KEY --data-file=-
echo -n 'http://your-stt-server' | gcloud secrets versions add STT_API_URL --data-file=-

# API Service
echo -n 'AIza...' | gcloud secrets versions add YOUTUBE_API_KEY --data-file=-
echo -n "$(openssl rand -hex 16)" | gcloud secrets versions add INTERNAL_API_KEY --data-file=-

# Supabase
echo -n 'https://xxx.supabase.co' | gcloud secrets versions add SUPABASE_URL --data-file=-
echo -n 'eyJ...' | gcloud secrets versions add SUPABASE_ANON_KEY --data-file=-
echo -n 'eyJ...' | gcloud secrets versions add SUPABASE_SERVICE_ROLE_KEY --data-file=-
```

## Step 3: GitHub Repository 설정

### Secrets (Settings → Secrets and variables → Actions → Secrets)

| Name | Value | Source |
|------|-------|--------|
| `GCP_PROJECT_ID` | your-project-id | GCP Console |
| `WIF_PROVIDER` | `projects/.../providers/github-provider` | setup 스크립트 출력 |
| `WIF_SERVICE_ACCOUNT` | `wigvu-github-actions@...iam.gserviceaccount.com` | setup 스크립트 출력 |

### Variables (Settings → Secrets and variables → Actions → Variables)

| Name | Value | 설명 |
|------|-------|------|
| `FRONTEND_URL` | `https://www.app.wigtn.com` | CORS + Auth 리다이렉트 |
| `CORS_ORIGINS` | `https://www.app.wigtn.com` | API CORS 허용 목록 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase 공개 키 |

## Step 4: 첫 배포

```bash
git push origin main
```

GitHub Actions가 자동으로:
1. AI, API 이미지 병렬 빌드
2. AI → API 순서로 배포
3. API URL 획득 후 Web 이미지 빌드
4. Web 배포

첫 배포 후 Cloud Run URL 확인:
```bash
gcloud run services describe wigvu-web --region=asia-northeast3 --format='value(status.url)'
# → https://wigvu-web-xxxxx-du.a.run.app
```

## Step 5: 커스텀 도메인 매핑 (Cloudflare + Cloud Run)

### 5-1. Cloud Run에 커스텀 도메인 매핑

```bash
# Web 서비스에 커스텀 도메인 매핑
gcloud beta run domain-mappings create \
  --service=wigvu-web \
  --domain=www.app.wigtn.com \
  --region=asia-northeast3
```

이 명령어 실행 후 **도메인 소유권 확인**이 필요할 수 있음:
```bash
# 도메인 매핑 상태 확인
gcloud beta run domain-mappings describe \
  --domain=www.app.wigtn.com \
  --region=asia-northeast3
```

### 5-2. Cloudflare DNS 설정

Cloudflare Dashboard → `wigtn.com` → DNS 에서:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `www.app` | `ghs.googlehosted.com` | **OFF** (DNS only) |

> **중요**: Cloudflare Proxy (주황색 구름)를 **반드시 OFF**로 설정해야 합니다.
> Cloud Run 커스텀 도메인은 Google이 직접 SSL 인증서를 발급하므로,
> Cloudflare 프록시가 켜져 있으면 SSL 충돌이 발생합니다.

### 5-3. SSL 인증서 대기

Cloud Run이 자동으로 Let's Encrypt SSL 인증서를 발급합니다.
DNS 전파 + 인증서 발급까지 **최대 15~30분** 소요.

```bash
# 인증서 상태 확인
gcloud beta run domain-mappings describe \
  --domain=www.app.wigtn.com \
  --region=asia-northeast3 \
  --format='value(status.resourceRecords,status.conditions)'
```

### 5-4. 검증

```bash
# Health check
curl https://www.app.wigtn.com

# API Health
curl https://wigvu-api-xxxxx-du.a.run.app/health
```

---

## 서비스 간 통신

| From | To | 방식 |
|------|----|------|
| Web (Browser) | API | HTTPS (NEXT_PUBLIC_API_URL) |
| API | AI | HTTPS (AI_SERVICE_URL) + INTERNAL_API_KEY |
| Web (Browser) | Supabase | HTTPS (NEXT_PUBLIC_SUPABASE_URL) |
| API | Supabase | HTTPS (SUPABASE_URL + SERVICE_ROLE_KEY) |

### AI 서비스 보안

AI 서비스는 `--no-allow-unauthenticated`로 배포되어 외부 접근 불가.
API 서비스만 `INTERNAL_API_KEY` 헤더로 접근 가능.

API → AI 호출 시 Cloud Run 서비스 간 인증이 필요하면:
```bash
# API 서비스 계정에 AI 서비스 호출 권한 부여
gcloud run services add-iam-policy-binding wigvu-ai \
  --region=asia-northeast3 \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/run.invoker"
```

---

## 비용 최적화 팁

| 설정 | 값 | 이유 |
|------|-----|------|
| `min-instances` | 0 (전체) | Cold start 허용, 비용 절감 |
| AI `max-instances` | 5 | LLM 비용 제한 |
| Web/API `max-instances` | 10 | 트래픽 대응 |
| AI `memory` | 1Gi | LLM 처리에 필요 |
| Web/API `memory` | 512Mi | 충분 |

트래픽이 늘면 `min-instances=1`로 변경하여 Cold start 제거 가능.

---

## Troubleshooting

### 배포 실패
```bash
# 로그 확인
gcloud run services logs read wigvu-web --region=asia-northeast3 --limit=50
gcloud run services logs read wigvu-api --region=asia-northeast3 --limit=50
gcloud run services logs read wigvu-ai --region=asia-northeast3 --limit=50
```

### 도메인 SSL 인증서 미발급
- Cloudflare Proxy가 OFF인지 확인
- DNS 전파 확인: `dig www.app.wigtn.com CNAME`
- 최대 30분 대기

### 서비스 간 통신 오류
```bash
# AI 서비스 URL 확인
gcloud run services describe wigvu-ai --region=asia-northeast3 --format='value(status.url)'

# API에서 AI 호출 테스트
curl -H "x-api-key: YOUR_KEY" https://wigvu-ai-xxxxx-du.a.run.app/health
```
