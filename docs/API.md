# API Reference

## Core Functions

### `getAccessToken(serviceAccountJson)`

Exchange GCP service account JSON for an access token.

```typescript
const token = await getAccessToken(serviceAccountJson);
```

### `generateImages(options)`

Generate images using Vertex AI.

```typescript
const results = await generateImages({
  prompt: 'A cute cat sitting on a windowsill',
  projectId: 'your-project-id',
  region: 'global',
  model: 'gemini-3.1-flash-image-preview',
  aspectRatio: '16:9',
  numberOfImages: 1,
  accessToken: token,
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `prompt` | string | required | Text description of the image |
| `projectId` | string | required | GCP project ID |
| `region` | string | `global` | Vertex AI region |
| `model` | string | `gemini-3.1-flash-image-preview` | Model ID |
| `aspectRatio` | AspectRatio | `1:1` | Output aspect ratio |
| `numberOfImages` | number | `1` | Number of images (1-8) |
| `safetySetting` | SafetySettingLevel | `BLOCK_MEDIUM_AND_ABOVE` | Safety filter level |
| `personGeneration` | PersonGeneration | `DONT_ALLOW` | Person generation setting |
| `accessToken` | string | required | GCP access token |

**Returns:**

```typescript
[
  {
    imageData: 'base64-encoded-image...',
    mimeType: 'image/png',
    promptFeedback: {
      reason: 'Passed safety checks',
      rating: 1,
    },
  }
]
```

### `generateImagesWithAuth(config, options)`

Convenience function that handles authentication + generation.

```typescript
const results = await generateImagesWithAuth(
  {
    projectId: 'your-project-id',
    region: 'global',
    model: 'gemini-3.1-flash-image-preview',
    serviceAccountJson: '...',
  },
  {
    prompt: 'A sunset over the ocean',
    aspectRatio: '16:9',
  }
);
```

## Types

```typescript
type AspectRatio = '1:1' | '1:4' | '1:8' | '3:2' | '2:3' | '3:4' | '4:1' | '4:3' | '4:5' | '5:4' | '8:1' | '9:16' | '16:9' | '21:9';

type SafetySettingLevel = 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_NONE';

type PersonGeneration = 'DONT_ALLOW' | 'ALLOW_ADULT' | 'ALLOW_ALL';
```
