# QuickPreview SSL 인증서 설정 가이드

이 문서는 Let's Encrypt를 사용하여 무료 SSL 인증서를 설정하는 방법을 설명합니다.

## 사전 요구사항

- GCE 인스턴스가 실행 중
- 도메인 이름이 인스턴스 IP를 가리키도록 DNS 설정 완료
- 80, 443 포트가 방화벽에서 열려 있음

---

## 1. 도메인 DNS 설정

### 1.1 GCP에서 고정 IP 확인

```bash
gcloud compute instances describe quickpreview-vm \
    --zone=asia-northeast3-a \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### 1.2 DNS 레코드 설정

도메인 관리 페이지에서 A 레코드 추가:

| 호스트 | 타입 | 값 |
|--------|------|-----|
| @ | A | YOUR_GCE_IP |
| www | A | YOUR_GCE_IP |
| api | A | YOUR_GCE_IP |

> DNS 전파에 최대 24시간이 소요될 수 있습니다.

---

## 2. Certbot 설치

GCE 인스턴스에서 실행:

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install -y certbot

# 버전 확인
certbot --version
```

---

## 3. SSL 인증서 발급

### 3.1 서비스 일시 중지

```bash
cd /opt/quickpreview
docker compose -f docker-compose.gce.yml down
```

### 3.2 인증서 발급 (Standalone 모드)

```bash
sudo certbot certonly --standalone \
    -d yourdomain.com \
    -d www.yourdomain.com \
    -d api.yourdomain.com \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email
```

### 3.3 인증서 위치 확인

```bash
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# 출력 예:
# cert.pem -> 인증서
# chain.pem -> 중간 인증서
# fullchain.pem -> 전체 체인 (cert + chain)
# privkey.pem -> 개인 키
```

---

## 4. Nginx에 SSL 적용

### 4.1 인증서 복사

```bash
# SSL 디렉토리 생성
sudo mkdir -p /opt/quickpreview/nginx/ssl

# 인증서 복사
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/quickpreview/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/quickpreview/nginx/ssl/

# 권한 설정
sudo chown -R $USER:$USER /opt/quickpreview/nginx/ssl/
chmod 600 /opt/quickpreview/nginx/ssl/privkey.pem
```

### 4.2 nginx.conf 도메인 수정

```bash
nano /opt/quickpreview/nginx/nginx.conf
```

`server_name _;`를 실제 도메인으로 변경:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    # ...
}
```

### 4.3 Nginx 프로필로 서비스 시작

```bash
cd /opt/quickpreview

# Nginx 포함하여 시작
docker compose -f docker-compose.prod.yml --profile with-nginx up -d
```

---

## 5. 인증서 자동 갱신 설정

### 5.1 갱신 스크립트 생성

```bash
sudo nano /opt/quickpreview/scripts/renew-ssl.sh
```

내용:

```bash
#!/bin/bash
set -e

cd /opt/quickpreview

# 서비스 중지
docker compose -f docker-compose.prod.yml --profile with-nginx down

# 인증서 갱신
certbot renew --quiet

# 인증서 복사
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/quickpreview/nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/quickpreview/nginx/ssl/

# 서비스 재시작
docker compose -f docker-compose.prod.yml --profile with-nginx up -d

echo "SSL certificate renewed successfully at $(date)"
```

### 5.2 실행 권한 부여

```bash
sudo chmod +x /opt/quickpreview/scripts/renew-ssl.sh
```

### 5.3 Cron 작업 등록

```bash
sudo crontab -e
```

추가:

```cron
# SSL 인증서 자동 갱신 (매월 1일 새벽 3시)
0 3 1 * * /opt/quickpreview/scripts/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1
```

---

## 6. 확인 및 테스트

### 6.1 SSL 적용 확인

```bash
# HTTPS 접속 테스트
curl -I https://yourdomain.com

# SSL 인증서 정보 확인
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 6.2 SSL Labs 테스트

[SSL Labs](https://www.ssllabs.com/ssltest/)에서 도메인을 입력하여 SSL 설정 점수 확인

### 6.3 HTTP → HTTPS 리다이렉트 확인

```bash
curl -I http://yourdomain.com
# 301 Moved Permanently가 출력되어야 함
```

---

## 7. 문제 해결

### 7.1 인증서 발급 실패

```bash
# DNS 확인
nslookup yourdomain.com

# 포트 80 확인
sudo netstat -tlnp | grep :80

# 방화벽 확인
sudo ufw status
gcloud compute firewall-rules list
```

### 7.2 Nginx 시작 실패

```bash
# Nginx 설정 테스트
docker run --rm -v /opt/quickpreview/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx nginx -t

# 로그 확인
docker logs quickpreview-nginx-1
```

### 7.3 인증서 갱신 실패

```bash
# 수동 갱신 테스트
sudo certbot renew --dry-run

# 인증서 상태 확인
sudo certbot certificates
```

---

## 8. API 전용 도메인 설정 (선택)

API를 별도 서브도메인으로 운영하려면:

### 8.1 nginx.conf 수정

```nginx
# API 서버 블록 추가
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8.2 프론트엔드 API URL 수정

`.env` 파일에서:

```bash
API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

---

## 참고 자료

- [Let's Encrypt 문서](https://letsencrypt.org/docs/)
- [Certbot 사용 가이드](https://certbot.eff.org/)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
