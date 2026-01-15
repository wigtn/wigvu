#!/bin/bash
# GCP Compute Engine Instance Creation Script
# Run this from your local machine with gcloud CLI installed

set -e

# Configuration - Modify these values
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
INSTANCE_NAME="${GCE_INSTANCE:-quickpreview-vm}"
ZONE="${GCP_ZONE:-asia-northeast3-a}"  # Seoul region
MACHINE_TYPE="e2-medium"  # 2 vCPU, 4GB RAM (adjust as needed)
BOOT_DISK_SIZE="30GB"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"

echo "=========================================="
echo "Creating GCE Instance"
echo "=========================================="
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo "Zone: $ZONE"
echo "Machine Type: $MACHINE_TYPE"
echo "=========================================="

# Set project
gcloud config set project $PROJECT_ID

# Create firewall rules (if not exists)
echo "[1/4] Creating firewall rules..."
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --target-tags http-server \
    --description "Allow HTTP traffic" \
    2>/dev/null || echo "Firewall rule 'allow-http' already exists"

gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --target-tags https-server \
    --description "Allow HTTPS traffic" \
    2>/dev/null || echo "Firewall rule 'allow-https' already exists"

gcloud compute firewall-rules create allow-app-ports \
    --allow tcp:3000,tcp:4000,tcp:5000 \
    --target-tags quickpreview-server \
    --description "Allow QuickPreview app ports" \
    2>/dev/null || echo "Firewall rule 'allow-app-ports' already exists"

# Create static IP (optional)
echo "[2/4] Creating static IP..."
gcloud compute addresses create quickpreview-ip \
    --region ${ZONE%-*} \
    2>/dev/null || echo "Static IP 'quickpreview-ip' already exists"

STATIC_IP=$(gcloud compute addresses describe quickpreview-ip \
    --region ${ZONE%-*} \
    --format='get(address)' 2>/dev/null || echo "")

# Create instance
echo "[3/4] Creating compute instance..."
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --boot-disk-size=$BOOT_DISK_SIZE \
    --boot-disk-type=pd-ssd \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --tags=http-server,https-server,quickpreview-server \
    --scopes=cloud-platform \
    ${STATIC_IP:+--address=$STATIC_IP}

# Wait for instance to be ready
echo "[4/4] Waiting for instance to be ready..."
sleep 30

echo ""
echo "=========================================="
echo "Instance Created Successfully!"
echo "=========================================="
echo ""
echo "External IP: $(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')"
echo ""
echo "To connect:"
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "To setup the instance, run:"
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='bash -s' < scripts/gce-setup.sh"
echo ""
echo "Or copy and run setup script manually:"
echo "  gcloud compute scp scripts/gce-setup.sh $INSTANCE_NAME:~ --zone=$ZONE"
echo "  gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "  ./gce-setup.sh"
