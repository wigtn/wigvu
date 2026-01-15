#!/bin/bash
# GCP Compute Engine Initial Setup Script
# Run this script on a fresh GCE instance (Ubuntu 22.04 LTS recommended)

set -e

echo "=========================================="
echo "QuickPreview GCE Setup Script"
echo "=========================================="

# Update system
echo "[1/6] Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# Install Docker Compose
echo "[3/6] Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin

# Install Google Cloud SDK (if not already installed)
echo "[4/6] Setting up Google Cloud SDK..."
if ! command -v gcloud &> /dev/null; then
    curl https://sdk.cloud.google.com | bash
    exec -l $SHELL
fi

# Configure Docker for GCR
echo "[5/6] Configuring Docker for GCR..."
gcloud auth configure-docker

# Create application directory
echo "[6/6] Setting up application directory..."
sudo mkdir -p /opt/quickpreview
sudo chown $USER:$USER /opt/quickpreview

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone the repository:"
echo "   cd /opt/quickpreview"
echo "   git clone https://github.com/YOUR_USERNAME/wigtn-quickpreview.git ."
echo ""
echo "2. Create .env file:"
echo "   cp .env.example .env"
echo "   nano .env  # Edit with your actual values"
echo ""
echo "3. Set GCP_PROJECT_ID in .env:"
echo "   echo 'GCP_PROJECT_ID=your-project-id' >> .env"
echo ""
echo "4. Pull and start the application:"
echo "   docker compose -f docker-compose.gce.yml pull"
echo "   docker compose -f docker-compose.gce.yml up -d"
echo ""
echo "5. Check status:"
echo "   docker compose -f docker-compose.gce.yml ps"
echo "   docker compose -f docker-compose.gce.yml logs -f"
echo ""
echo "NOTE: You may need to log out and back in for Docker group to take effect."
