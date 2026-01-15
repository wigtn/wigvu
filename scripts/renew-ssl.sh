#!/bin/bash
# SSL Certificate Renewal Script for QuickPreview
# Add to crontab: 0 3 1 * * /opt/quickpreview/scripts/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1

set -e

DOMAIN="${DOMAIN:-yourdomain.com}"
PROJECT_DIR="${PROJECT_DIR:-/opt/quickpreview}"

echo "=========================================="
echo "SSL Certificate Renewal - $(date)"
echo "=========================================="

cd $PROJECT_DIR

# Check if renewal is needed
echo "[1/5] Checking certificate expiry..."
if ! sudo certbot certificates 2>/dev/null | grep -q "VALID"; then
    echo "No valid certificates found. Please run initial setup first."
    exit 1
fi

# Stop nginx to free port 80
echo "[2/5] Stopping services..."
docker compose -f docker-compose.prod.yml --profile with-nginx stop nginx || true

# Renew certificates
echo "[3/5] Renewing certificates..."
sudo certbot renew --quiet --standalone

# Copy new certificates
echo "[4/5] Copying certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $PROJECT_DIR/nginx/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $PROJECT_DIR/nginx/ssl/
sudo chown $(whoami):$(whoami) $PROJECT_DIR/nginx/ssl/*.pem
chmod 600 $PROJECT_DIR/nginx/ssl/privkey.pem

# Restart services
echo "[5/5] Restarting services..."
docker compose -f docker-compose.prod.yml --profile with-nginx up -d

echo ""
echo "=========================================="
echo "SSL Certificate Renewal Complete!"
echo "=========================================="

# Verify
echo ""
echo "Certificate expiry dates:"
sudo certbot certificates 2>/dev/null | grep "Expiry Date" || echo "Could not read certificate dates"
