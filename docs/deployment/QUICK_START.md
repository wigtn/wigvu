# QuickPreview GCP 배포 - 빠른 시작 가이드

> 이미 GCE VM 인스턴스가 있는 경우를 위한 간단 가이드

---

## 준비물

- [x] GCP VM 인스턴스 (이미 생성됨)
- [ ] VM의 External IP 주소
- [ ] OpenAI API Key
- [ ] STT 서버 URL

---

## Step 1: VM에 SSH 접속

**GCP Console에서 접속** (가장 쉬움):

1. https://console.cloud.google.com 접속
2. Compute Engine → VM instances
3. 내 VM 인스턴스 찾기
4. **SSH** 버튼 클릭 (브라우저에서 터미널 열림)

---

## Step 2: Docker 설치

SSH 터미널에서 아래 명령어를 **한 줄씩** 복사-붙여넣기:

```bash
# 1. 시스템 업데이트
sudo apt-get update && sudo apt-get upgrade -y

# 2. Docker 설치
curl -fsSL https://get.docker.com | sudo sh

# 3. 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 4. 변경사항 적용 (SSH 재접속)
exit
```

**다시 SSH 접속** 후 확인:

```bash
docker --version
```

---

## Step 3: 프로젝트 다운로드

```bash
# 1. 작업 디렉토리 생성
sudo mkdir -p /opt/quickpreview
sudo chown $USER:$USER /opt/quickpreview
cd /opt/quickpreview

# 2. Git 설치 (없는 경우)
sudo apt-get install -y git

# 3. 프로젝트 클론 (YOUR_GITHUB_USERNAME을 실제 username으로 변경)
git clone https://github.com/YOUR_GITHUB_USERNAME/wigtn-quickpreview.git .
```

---

## Step 4: 환경변수 설정

```bash
# 1. 예제 파일 복사
cp .env.example .env

# 2. 에디터로 열기
nano .env
```

**필수로 수정해야 할 값들:**

```
OPENAI_API_KEY=sk-실제키입력
INTERNAL_API_KEY=아무거나32자이상랜덤문자열
STT_API_URL=실제STT서버주소
```

> **INTERNAL_API_KEY 생성**: `openssl rand -hex 16` 실행 후 출력값 복사

저장: `Ctrl + O` → `Enter` → `Ctrl + X`

---

## Step 5: 앱 실행

```bash
cd /opt/quickpreview

# 빌드 및 실행 (처음에는 5-10분 소요)
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Step 6: 확인

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인 (Ctrl+C로 종료)
docker compose -f docker-compose.prod.yml logs -f
```

**브라우저에서 접속:**
- 웹: `http://VM외부IP:3000`
- API: `http://VM외부IP:4000/api/v1/health`

---

## 방화벽 설정 (접속 안 될 때)

GCP Console에서:

1. VPC network → Firewall
2. **CREATE FIREWALL RULE** 클릭
3. 설정:
   - Name: `allow-quickpreview`
   - Targets: All instances in the network
   - Source IP ranges: `0.0.0.0/0`
   - Protocols and ports: `tcp:3000,4000,5000`
4. **CREATE** 클릭

---

## 자주 쓰는 명령어

```bash
# 앱 시작
docker compose -f docker-compose.prod.yml up -d

# 앱 중지
docker compose -f docker-compose.prod.yml down

# 앱 재시작
docker compose -f docker-compose.prod.yml restart

# 로그 보기
docker compose -f docker-compose.prod.yml logs -f

# 업데이트 적용
cd /opt/quickpreview
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 문제 해결

### "docker: command not found"
→ Step 2 다시 실행

### "permission denied"
→ `sudo usermod -aG docker $USER` 후 SSH 재접속

### 접속 안 됨
→ 방화벽 설정 확인 (위 섹션 참고)

### 컨테이너가 계속 재시작됨
→ `docker compose -f docker-compose.prod.yml logs` 로 에러 확인
