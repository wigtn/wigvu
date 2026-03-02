#!/usr/bin/env bash
# WIGVU Cloud Run Infrastructure Setup (3-Service Architecture)
# Run this script once to set up GCP resources for Cloud Run deployment.
#
# Architecture: Web (Next.js) → API (NestJS) → AI (FastAPI) + Supabase
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - GCP project created with billing enabled
#
# Usage:
#   export GCP_PROJECT_ID="your-project-id"
#   bash scripts/setup-cloudrun.sh

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────
REGION="asia-northeast3"  # Seoul
REPO_NAME="wigvu-repo"
GITHUB_REPO="wigtn/wigvu"
SA_NAME="wigvu-github-actions"
WIF_POOL="github-pool"
WIF_PROVIDER="github-provider"

# ─── Validation ──────────────────────────────────────────────────────────────
if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "ERROR: GCP_PROJECT_ID is not set."
  echo "Usage: GCP_PROJECT_ID=your-project-id bash $0"
  exit 1
fi

echo "=== WIGVU Cloud Run Setup (3-Service) ==="
echo "Project:    ${GCP_PROJECT_ID}"
echo "Region:     ${REGION}"
echo "Repository: ${GITHUB_REPO}"
echo "Services:   wigvu-web, wigvu-api, wigvu-ai"
echo ""

gcloud config set project "${GCP_PROJECT_ID}"

# ─── 1. Enable APIs ─────────────────────────────────────────────────────────
echo ">>> Enabling required APIs..."
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  iam.googleapis.com

# ─── 2. Create Artifact Registry ────────────────────────────────────────────
echo ">>> Creating Artifact Registry repository..."
if gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" &>/dev/null; then
  echo "    Repository '${REPO_NAME}' already exists, skipping."
else
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="WIGVU Docker images"
fi

# ─── 3. Create Secret Manager secrets ───────────────────────────────────────
echo ">>> Creating Secret Manager secrets..."
SECRETS=(
  # AI Service
  "OPENAI_API_KEY"
  "STT_API_URL"
  # API Service
  "YOUTUBE_API_KEY"
  "INTERNAL_API_KEY"
  # Supabase (API + Web)
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for secret in "${SECRETS[@]}"; do
  if gcloud secrets describe "${secret}" &>/dev/null; then
    echo "    Secret '${secret}' already exists, skipping."
  else
    echo -n "placeholder" | gcloud secrets create "${secret}" \
      --data-file=- \
      --replication-policy=user-managed \
      --locations="${REGION}"
    echo "    Created secret '${secret}' (update with actual value later)"
  fi
done

echo ""
echo "  IMPORTANT: Update secret values with:"
echo "    echo -n 'actual-value' | gcloud secrets versions add SECRET_NAME --data-file=-"

# ─── 4. Create Service Account ──────────────────────────────────────────────
SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo ">>> Creating service account: ${SA_EMAIL}"
if gcloud iam service-accounts describe "${SA_EMAIL}" &>/dev/null; then
  echo "    Service account already exists, skipping."
else
  gcloud iam service-accounts create "${SA_NAME}" \
    --display-name="WIGVU GitHub Actions"
fi

# Grant roles
echo ">>> Granting IAM roles..."
ROLES=(
  "roles/run.admin"
  "roles/artifactregistry.writer"
  "roles/secretmanager.secretAccessor"
  "roles/iam.serviceAccountUser"
)

for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}" \
    --condition=None \
    --quiet
done

# ─── 4b. Grant Cloud Run default SA access to secrets ─────────────────────
PROJECT_NUMBER=$(gcloud projects describe "${GCP_PROJECT_ID}" --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo ">>> Granting Secret Manager access to Cloud Run default SA: ${COMPUTE_SA}"
gcloud projects add-iam-policy-binding "${GCP_PROJECT_ID}" \
  --member="serviceAccount:${COMPUTE_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

# ─── 5. Workload Identity Federation ────────────────────────────────────────
echo ">>> Setting up Workload Identity Federation..."

# Create pool
if gcloud iam workload-identity-pools describe "${WIF_POOL}" --location=global &>/dev/null; then
  echo "    Pool '${WIF_POOL}' already exists, skipping."
else
  gcloud iam workload-identity-pools create "${WIF_POOL}" \
    --location=global \
    --display-name="GitHub Actions Pool"
fi

# Create provider
POOL_ID=$(gcloud iam workload-identity-pools describe "${WIF_POOL}" --location=global --format="value(name)")

if gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER}" \
  --workload-identity-pool="${WIF_POOL}" --location=global &>/dev/null; then
  echo "    Provider '${WIF_PROVIDER}' already exists, skipping."
else
  gcloud iam workload-identity-pools providers create-oidc "${WIF_PROVIDER}" \
    --location=global \
    --workload-identity-pool="${WIF_POOL}" \
    --display-name="GitHub Provider" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='${GITHUB_REPO}'"
fi

# Bind service account to repository
echo ">>> Binding service account to repository..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_REPO}" \
  --quiet

# ─── 6. Output ───────────────────────────────────────────────────────────────
PROVIDER_FULL=$(gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER}" \
  --workload-identity-pool="${WIF_POOL}" --location=global --format="value(name)")

echo ""
echo "=== Setup Complete ==="
echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│  Step 1: Add GitHub Repository Secrets                      │"
echo "├──────────────────────────────────────────────────────────────┤"
echo "│  GCP_PROJECT_ID      = ${GCP_PROJECT_ID}"
echo "│  WIF_PROVIDER        = ${PROVIDER_FULL}"
echo "│  WIF_SERVICE_ACCOUNT = ${SA_EMAIL}"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│  Step 2: Add GitHub Repository Variables                    │"
echo "├──────────────────────────────────────────────────────────────┤"
echo "│  FRONTEND_URL         = https://www.app.wigtn.com           │"
echo "│  CORS_ORIGINS         = https://www.app.wigtn.com           │"
echo "│  NEXT_PUBLIC_SUPABASE_URL  = https://xxx.supabase.co        │"
echo "│  NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key              │"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│  Step 3: Update Secret Manager values                       │"
echo "├──────────────────────────────────────────────────────────────┤"
for secret in "${SECRETS[@]}"; do
  echo "│  echo -n 'value' | gcloud secrets versions add ${secret} --data-file=-"
done
echo "└──────────────────────────────────────────────────────────────┘"
echo ""
echo "Docker registry: ${REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO_NAME}/"
echo ""
echo "After first deploy, map custom domain:"
echo "  gcloud run services update wigvu-web --region=${REGION} --add-custom-audiences=www.app.wigtn.com"
echo "  See: scripts/DEPLOYMENT.md for Cloudflare DNS setup"
