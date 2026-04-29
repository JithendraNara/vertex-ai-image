# Vertex AI Image Generation

**Free image generation via Vertex AI Gemini 3.1 Flash Image** - usable from any AI coding tool.

## Why

- **Other image APIs**: `$0.01-$0.20` per image (paid)
- **Vertex AI Gemini 3.1 Flash Image**: Free tier available with Gemini Enterprise
- **Same quality**: Powered by Google's Gemini model with 14 aspect ratios supported

## Model

**Gemini 3.1 Flash Image Preview**
- Model ID: `gemini-3.1-flash-image-preview`
- Free tier: Check GCP pricing for your tier
- Supports: 1:1, 1:4, 1:8, 3:2, 2:3, 3:4, 4:1, 4:3, 4:5, 5:4, 8:1, 9:16, 16:9, 21:9 aspect ratios
- Output: PNG, JPEG, WebP, HEIC, HEIF

## Supported Tools

| Tool | Status | Integration |
|------|--------|-------------|
| OpenClaw | ✅ Working | `src/integrations/openclaw.ts` |
| Claude Code | ✅ Working | `src/integrations/claude-code.ts` |
| Hermes Agent | ✅ Working | `src/integrations/hermes.ts` (MCP server) |

## Quick Start

### 1. GCP Setup

```bash
# Create service account
gcloud iam service-accounts create vertex-image \
    --display-name="Vertex AI Image"

# Grant permissions
PROJECT_ID=$(gcloud config get-value project)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:vertex-image@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create key
gcloud iam service-accounts keys create key.json \
    --iam-account=vertex-image@$PROJECT_ID.iam.gserviceaccount.com
```

### 2. Install

```bash
npm install -g vertex-ai-image
```

### 3. Configure for your tool

#### Claude Code

```bash
claude mcp add vertex-image --transport stdio -- npx -y vertex-ai-image claude-code
```

Set environment variables:

```bash
export VERTEX_AI_PROJECT_ID="your-gcp-project"
export VERTEX_AI_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

Then ask Claude Code:

```
Generate an image of a sunset over the ocean
```

## Architecture

```
AI Coding Tool → Integration (MCP/Plugin) → src/lib/client.ts → Vertex AI API
                                                  ↓
                                          getAccessToken() → GCP OAuth2
```

## Documentation

- [SETUP.md](docs/SETUP.md) - Step-by-step GCP + tool configuration
- [INTEGRATIONS.md](docs/INTEGRATIONS.md) - Per-tool setup guide
- [API.md](docs/API.md) - API reference

## Files

```
vertex-ai-image/
├── src/
│   ├── index.ts                    # Main exports
│   ├── lib/client.ts              # Core image generation client
│   └── integrations/
│       ├── openclaw.ts            # OpenClaw plugin
│       ├── claude-code.ts         # Claude Code MCP server
│       └── hermes.ts             # Hermes Agent MCP server
├── docs/
├── examples/
└── package.json
```

## License

MIT
