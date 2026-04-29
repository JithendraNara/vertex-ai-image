# Setup Guide

## Prerequisites

- Node.js 18+
- GCP project with billing enabled
- Service account with Vertex AI permissions

## GCP Setup

### 1. Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com
```

### 2. Create Service Account

```bash
PROJECT_ID=$(gcloud config get-value project)

gcloud iam service-accounts create vertex-image \
    --display-name="Vertex AI Image Generation" \
    --description="Used for free image generation"
```

### 3. Grant Permissions

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vertex-image@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

### 4. Create Key

```bash
gcloud iam service-accounts keys create key.json \
    --iam-account=vertex-image@$PROJECT_ID.iam.gserviceaccount.com
```

## Tool-Specific Setup

See [INTEGRATIONS.md](INTEGRATIONS.md) for your specific tool.

## Testing

```bash
export VERTEX_AI_PROJECT_ID="your-project"
export VERTEX_AI_SERVICE_ACCOUNT_JSON=$(cat key.json)

npx tsx src/integrations/claude-code.ts test "A cute cat sitting on a windowsill"
```

## Security Notes

- **Never commit `key.json`** — Add to `.gitignore`
- **Use least privilege** — `roles/aiplatform.user` may be more than needed
- **Rotate keys** — GCP recommends periodic rotation
