# QuickPreview GCP Compute Engine 배포 가이드

이 문서는 QuickPreview 애플리케이션을 GCP Compute Engine에 배포하는 방법을 설명합니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [GCP 프로젝트 설정](#1-gcp-프로젝트-설정)
3. [서비스 계정 생성](#2-서비스-계정-생성-github-actions용)
4. [GCE 인스턴스 생성](#3-gce-인스턴스-생성)
5. [인스턴스 초기 설정](#4-인스턴스-초기-설정)
6. [GitHub Secrets 설정](#5-github-secrets-설정)
7. [환경변수 설정](#6-환경변수-설정)
8. [첫 배포](#7-첫-배포)
9. [자동 배포 (CI/CD)](#8-자동-배포-cicd)
10. [운영 및 모니터링](#9-운영-및-모니터링)
11. [문제 해결](#10-문제-해결)

---

## 사전 요구사항

- GCP 계정 및 결제 활성화
- [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) 설치
- GitHub 저장소 접근 권한
- 다음 API 키 준비:
  - OpenAI API Key
  - YouTube Data API Key (선택)
  - STT 서버 URL

---

## 1. GCP 프로젝트 설정

### 1.1 gcloud CLI 로그인

```bash
# 로그인
gcloud auth login

# 프로젝트 생성 (새 프로젝트인 경우)
gcloud projects create quickpreview-prod --name="QuickPreview Production"

# 프로젝트 설정
gcloud config set project quickpreview-prod
```

### 1.2 필요한 API 활성화

```bash
# Compute Engine API
gcloud services enable compute.googleapis.com

# Container Registry API
gcloud services enable containerregistry.googleapis.com

# Cloud Build API (선택)
gcloud services enable cloudbuild.googleapis.com
```

### 1.3 결제 계정 연결 확인

```bash
gcloud beta billing accounts list
gcloud beta billing projects link quickpreview-prod --billing-account=BILLING_ACCOUNT_ID
```

---

## 2. 서비스 계정 생성 (GitHub Actions용)

GitHub Actions에서 GCP에 자동 배포하려면 서비스 계정이 필요합니다.

### 2.1 서비스 계정 생성

```bash
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Deploy" \
    --description="Service account for GitHub Actions CI/CD"
```

### 2.2 필요한 권한 부여

```bash
PROJECT_ID=$(gcloud config get-value project)

# Compute Engine 관리 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/compute.instanceAdmin.v1"

# Container Registry 푸시 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# SSH 접근 권한
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/compute.osLogin"
```

### 2.3 JSON 키 생성

```bash
gcloud iam service-accounts keys create gcp-sa-key.json \
    --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# 생성된 파일 확인
cat gcp-sa-key.json
```

> **중요**: `gcp-sa-key.json` 파일은 GitHub Secrets에 등록 후 로컬에서 안전하게 삭제하세요.

---

## 3. GCE 인스턴스 생성

### 3.1 스크립트로 생성 (권장)

```bash
# 환경변수 설정
export GCP_PROJECT_ID=quickpreview-prod
export GCP_ZONE=asia-northeast3-a  # 서울 리전
export GCE_INSTANCE=quickpreview-vm

# 스크립트 실행 권한 부여
chmod +x scripts/gce-create-instance.sh

# 인스턴스 생성
./scripts/gce-create-instance.sh
```

### 3.2 수동 생성

```bash
gcloud compute instances create quickpreview-vm \
    --zone=asia-northeast3-a \
    --machine-type=e2-medium \
    --boot-disk-size=30GB \
    --boot-disk-type=pd-ssd \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --tags=http-server,https-server,quickpreview-server \
    --scopes=cloud-platform
```

### 3.3 방화벽 규칙 생성

```bash
# HTTP 허용
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --target-tags http-server

# HTTPS 허용
gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --target-tags https-server

# 애플리케이션 포트 허용 (개발용, 프로덕션에서는 80/443만 사용 권장)
gcloud compute firewall-rules create allow-app-ports \
    --allow tcp:3000,tcp:4000,tcp:5000 \
    --target-tags quickpreview-server
```

### 3.4 고정 IP 할당 (선택)

```bash
# 고정 IP 생성
gcloud compute addresses create quickpreview-ip --region=asia-northeast3

# IP 확인
gcloud compute addresses describe quickpreview-ip --region=asia-northeast3

# 인스턴스에 할당
gcloud compute instances delete-access-config quickpreview-vm \
    --zone=asia-northeast3-a \
    --access-config-name="external-nat"

gcloud compute instances add-access-config quickpreview-vm \
    --zone=asia-northeast3-a \
    --address=STATIC_IP_ADDRESS
```

---

## 4. 인스턴스 초기 설정

### 4.1 SSH 접속

```bash
gcloud compute ssh quickpreview-vm --zone=asia-northeast3-a
```

### 4.2 초기 설정 스크립트 실행

인스턴스 내부에서 실행:

```bash
# 스크립트 다운로드 및 실행
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/wigtn-quickpreview/main/scripts/gce-setup.sh -o gce-setup.sh
chmod +x gce-setup.sh
./gce-setup.sh
```

또는 로컬에서 직접 전송:

```bash
# 로컬에서 실행
gcloud compute scp scripts/gce-setup.sh quickpreview-vm:~ --zone=asia-northeast3-a
gcloud compute ssh quickpreview-vm --zone=asia-northeast3-a --command="chmod +x ~/gce-setup.sh && ~/gce-setup.sh"
```

### 4.3 Docker 그룹 적용

```bash
# 로그아웃 후 재접속 필요
exit
gcloud compute ssh quickpreview-vm --zone=asia-northeast3-a

# Docker 동작 확인
docker ps
```

---

## 5. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

| Secret Name | 설명 | 예시 값 |
|-------------|------|---------|
| `GCP_PROJECT_ID` | GCP 프로젝트 ID | `quickpreview-prod` |
| `GCP_ZONE` | GCE 인스턴스 존 | `asia-northeast3-a` |
| `GCE_INSTANCE` | GCE 인스턴스 이름 | `quickpreview-vm` |
| `GCP_SA_KEY` | 서비스 계정 JSON 키 전체 내용 | `{"type": "service_account", ...}` |

### GCP_SA_KEY 등록 방법

```bash
# 로컬에서 JSON 파일 내용 복사
cat gcp-sa-key.json | pbcopy  # macOS
cat gcp-sa-key.json | xclip   # Linux
```

GitHub Secrets에 전체 JSON 내용을 붙여넣기합니다.

---

## 6. 환경변수 설정

### 6.1 GCE 인스턴스에서 .env 파일 생성

```bash
# SSH 접속
gcloud compute ssh quickpreview-vm --zone=asia-northeast3-a

# 프로젝트 디렉토리로 이동
cd /opt/quickpreview

# 저장소 클론 (최초 1회)
git clone https://github.com/YOUR_USERNAME/wigtn-quickpreview.git .

# .env 파일 생성
cp .env.example .env
nano .env
```

### 6.2 필수 환경변수

```bash
# === 필수 API 키 ===
OPENAI_API_KEY=sk-your-openai-api-key
INTERNAL_API_KEY=your-32-char-random-string  # openssl rand -hex 16

# === STT 설정 ===
STT_API_URL=https://your-stt-server.com

# === GCP 설정 ===
GCP_PROJECT_ID=quickpreview-prod

# === 선택 설정 ===
YOUTUBE_API_KEY=your-youtube-api-key
OPENAI_MODEL=gpt-4o-mini
LOG_LEVEL=INFO
```

### 6.3 INTERNAL_API_KEY 생성

```bash
# 랜덤 키 생성
openssl rand -hex 16
# 출력 예: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## 7. 첫 배포

### 7.1 수동 배포 (최초)

GCE 인스턴스에서 실행:

```bash
cd /opt/quickpreview

# GCR 인증 설정
gcloud auth configure-docker

# 이미지 빌드 및 실행 (로컬 빌드)
docker compose -f docker-compose.prod.yml up -d --build

# 또는 GCR 이미지 사용 (GitHub Actions 배포 후)
docker compose -f docker-compose.gce.yml pull
docker compose -f docker-compose.gce.yml up -d
```

### 7.2 상태 확인

```bash
# 컨테이너 상태
docker compose -f docker-compose.gce.yml ps

# 로그 확인
docker compose -f docker-compose.gce.yml logs -f

# 개별 서비스 로그
docker compose -f docker-compose.gce.yml logs -f web
docker compose -f docker-compose.gce.yml logs -f api
docker compose -f docker-compose.gce.yml logs -f ai
```

### 7.3 헬스체크

```bash
# API 헬스체크
curl http://localhost:4000/api/v1/health

# AI 서비스 헬스체크
curl http://localhost:5000/health

# 웹 페이지 확인
curl -I http://localhost:3000
```

---

## 8. 자동 배포 (CI/CD)

### 8.1 배포 트리거

다음 조건에서 자동 배포가 실행됩니다:
- `main` 브랜치에 푸시
- GitHub Actions에서 수동 트리거 (workflow_dispatch)

### 8.2 배포 워크플로우

```
Push to main
    ↓
CI 검증 (빌드 테스트)
    ↓
Docker 이미지 빌드
    ↓
GCR에 이미지 푸시
    ↓
GCE SSH 접속
    ↓
이미지 Pull & 재시작
    ↓
헬스체크
```

### 8.3 수동 배포 트리거

GitHub → Actions → CD - Deploy to GCP → Run workflow

### 8.4 배포 롤백

```bash
# GCE 인스턴스에서
cd /opt/quickpreview

# 이전 커밋으로 롤백
git checkout HEAD~1

# 이전 이미지로 롤백 (특정 태그)
docker compose -f docker-compose.gce.yml down
# docker-compose.gce.yml에서 :latest를 특정 SHA로 변경
docker compose -f docker-compose.gce.yml up -d
```

---

## 9. 운영 및 모니터링

### 9.1 로그 확인

```bash
# 전체 로그 (최근 100줄)
docker compose -f docker-compose.gce.yml logs --tail=100

# 실시간 로그
docker compose -f docker-compose.gce.yml logs -f

# 특정 서비스 로그
docker logs quickpreview-api-1 --tail=50
```

### 9.2 리소스 모니터링

```bash
# Docker 리소스 사용량
docker stats

# 시스템 리소스
htop
df -h
```

### 9.3 서비스 재시작

```bash
# 전체 재시작
docker compose -f docker-compose.gce.yml restart

# 특정 서비스만 재시작
docker compose -f docker-compose.gce.yml restart api

# 완전 재시작 (이미지 재빌드 없이)
docker compose -f docker-compose.gce.yml down
docker compose -f docker-compose.gce.yml up -d
```

### 9.4 업데이트 적용

```bash
cd /opt/quickpreview
git pull origin main
docker compose -f docker-compose.gce.yml pull
docker compose -f docker-compose.gce.yml up -d --remove-orphans
docker system prune -f  # 불필요한 이미지 정리
```

---

## 10. 문제 해결

### 10.1 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker compose -f docker-compose.gce.yml logs

# 컨테이너 상태 상세 확인
docker inspect quickpreview-api-1

# 환경변수 확인
docker compose -f docker-compose.gce.yml config
```

### 10.2 헬스체크 실패

```bash
# 수동 헬스체크
curl -v http://localhost:4000/api/v1/health
curl -v http://localhost:5000/health

# 네트워크 확인
docker network ls
docker network inspect quickpreview_default
```

### 10.3 메모리 부족

```bash
# 메모리 사용량 확인
free -h
docker stats --no-stream

# 불필요한 리소스 정리
docker system prune -af
docker volume prune -f
```

### 10.4 디스크 공간 부족

```bash
# 디스크 사용량 확인
df -h

# Docker 리소스 정리
docker system prune -af --volumes

# 오래된 로그 삭제
sudo journalctl --vacuum-time=7d
```

### 10.5 SSH 접속 불가

```bash
# 시리얼 콘솔로 접속
gcloud compute instances get-serial-port-output quickpreview-vm --zone=asia-northeast3-a

# 인스턴스 재시작
gcloud compute instances reset quickpreview-vm --zone=asia-northeast3-a
```

### 10.6 GCR 인증 오류

```bash
# GCE 인스턴스에서 재인증
gcloud auth configure-docker

# 서비스 계정 확인
gcloud auth list
```

---

## 부록: 권장 인스턴스 스펙

| 환경 | 머신 타입 | vCPU | 메모리 | 월 예상 비용 |
|------|-----------|------|--------|-------------|
| 개발/테스트 | e2-micro | 0.25 | 1GB | ~$6 |
| 스테이징 | e2-small | 0.5 | 2GB | ~$13 |
| 프로덕션 (소규모) | e2-medium | 2 | 4GB | ~$25 |
| 프로덕션 (중규모) | e2-standard-2 | 2 | 8GB | ~$50 |
| 프로덕션 (대규모) | e2-standard-4 | 4 | 16GB | ~$100 |

> 비용은 서울 리전 (asia-northeast3) 기준 예상치입니다.

---

## 다음 단계

- [ ] SSL 인증서 설정 (Let's Encrypt + Nginx)
- [ ] 커스텀 도메인 연결
- [ ] Cloud Monitoring 알림 설정
- [ ] 백업 전략 수립
