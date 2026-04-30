# Integrations

## Claude Code

**Status**: ✅ Working (MCP server)

### Installation

```bash
claude mcp add vertex-image --transport stdio -- npx -y vertex-ai-image claude-code
```

### Environment Variables

```bash
export VERTEX_AI_PROJECT_ID="your-gcp-project-id"
export VERTEX_AI_REGION="us-west2"
export VERTEX_AI_MODEL="gemini-3.1-flash-image-preview"
export VERTEX_AI_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

### Usage

```
Generate an image of a sunset over the ocean with aspect ratio 16:9
```

---

## OpenClaw

**Status**: ✅ Working

### Configuration

```json
{
  "plugins": {
    "entries": {
      "vertex-ai-image": {
        "enabled": true,
        "config": {
          "projectId": "your-gcp-project-id",
          "region": "us-west2",
          "model": "gemini-3.1-flash-image-preview",
          "serviceAccountJson": "paste-json-here"
        }
      }
    }
  }
}
```

---

## Hermes Agent

**Status**: ✅ Working (MCP server)

### Installation

```bash
hermes tools add vertex-ai-image
```

Or configure in `~/.hermes/mcp.json`:

```json
{
  "mcpServers": {
    "vertex-ai-image": {
      "command": "npx",
      "args": ["-y", "vertex-ai-image", "hermes-mcp"]
    }
  }
}
```

### Environment Variables

```bash
export VERTEX_AI_PROJECT_ID="your-gcp-project-id"
export VERTEX_AI_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```
