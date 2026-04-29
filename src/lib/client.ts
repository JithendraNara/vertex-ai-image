/**
 * Vertex AI Image Generation - Core Client
 *
 * Framework-agnostic Vertex AI image generation client using Gemini 3.1 Flash Image.
 * Handles JWT authentication and image generation via Vertex AI.
 */

import { createSign } from 'node:crypto';

export interface ServiceAccount {
  type: string;
  project_id?: string;
  private_key_id?: string;
  private_key: string;
  client_email?: string;
  token_uri?: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  projectId: string;
  region?: string;
  model?: string;
  aspectRatio?: AspectRatio;
  numberOfImages?: number;
  safetySetting?: SafetySettingLevel;
  personGeneration?: PersonGeneration;
}

export type AspectRatio = '1:1' | '1:4' | '1:8' | '3:2' | '2:3' | '3:4' | '4:1' | '4:3' | '4:5' | '5:4' | '8:1' | '9:16' | '16:9' | '21:9';
export type SafetySettingLevel = 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_NONE';
export type PersonGeneration = 'DONT_ALLOW' | 'ALLOW_ADULT' | 'ALLOW_ALL';

export interface ImageResult {
  imageData: string;  // Base64 encoded image
  mimeType: string;  // e.g., image/png
  promptFeedback?: {
    reason: string;
    rating?: number;
  };
}

export interface VertexConfig {
  projectId: string;
  region?: string;
  model?: string;
  serviceAccountJson: string;
}

// GCP Auth - exchange service account JSON for access token
export async function getAccessToken(serviceAccountJson: string): Promise<string> {
  // Escape literal newlines (which Python's json.load() produces from \n in JSON)
  const escaped = serviceAccountJson.replace(/\n/g, '\\n');
  let parsed: ServiceAccount;

  // Try parsing as-is first, then try base64 decode if that fails
  try {
    parsed = JSON.parse(escaped);
  } catch {
    // Try base64 decode
    try {
      const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
      parsed = JSON.parse(decoded);
    } catch {
      throw new Error('Failed to parse service account JSON');
    }
  }

  const tokenUrl = parsed.token_uri || 'https://oauth2.googleapis.com/token';
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);

  const payload = Buffer.from(
    JSON.stringify({
      iss: parsed.client_email,
      sub: parsed.client_email,
      aud: tokenUrl,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(parsed.private_key, 'base64url');
  const jwt = `${signingInput}.${signature}`;

  const postBody = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(jwt)}`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: postBody,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token fetch failed: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

// Generate images using Vertex AI Gemini 3.1 Flash Image
export async function generateImages(options: {
  prompt: string;
  projectId: string;
  region?: string;
  model?: string;
  aspectRatio?: AspectRatio;
  numberOfImages?: number;
  safetySetting?: SafetySettingLevel;
  personGeneration?: PersonGeneration;
  accessToken: string;
}): Promise<ImageResult[]> {
  const region = options.region || 'us-west2';
  const model = options.model || 'gemini-3.1-flash-image-preview';
  const regionHost = region === 'global' ? 'aiplatform.googleapis.com' : `${region}-aiplatform.googleapis.com`;
  const endpoint = `https://${regionHost}/v1/projects/${options.projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;

  const requestBody: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: options.prompt }],
      },
    ],
    generation_config: {
      temperature: 1.0,
      topP: 0.95,
    },
  };

  // Add optional parameters
  if (options.aspectRatio) {
    (requestBody.generation_config as Record<string, unknown>).aspectRatio = options.aspectRatio;
  }

  if (options.numberOfImages && options.numberOfImages > 1) {
    (requestBody.generation_config as Record<string, unknown>).numberOfImages = options.numberOfImages;
  }

  if (options.safetySetting) {
    (requestBody as Record<string, unknown>).safety_settings = [
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: options.safetySetting,
      },
    ];
  }

  if (options.personGeneration) {
    (requestBody as Record<string, unknown>).person_generation = options.personGeneration;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vertex AI error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const candidates = data.candidates || [];

  const results: ImageResult[] = [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        results.push({
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    // Check prompt feedback if present
    if (candidate.promptFeedback) {
      const feedback = candidate.promptFeedback;
      let reason = 'Unknown';
      if (feedback.blockReason) {
        reason = feedback.blockReason;
      } else if (feedback.safetyRatings) {
        reason = 'Passed safety checks';
      }

      if (results.length > 0) {
        results[results.length - 1].promptFeedback = {
          reason,
          rating: feedback.safetyRatings?.[0]?.probability,
        };
      }
    }
  }

  return results;
}

// Full generation: authenticate + generate
export async function generateImagesWithAuth(
  config: VertexConfig,
  options: Omit<ImageGenerationOptions, 'projectId'>
): Promise<ImageResult[]> {
  const accessToken = await getAccessToken(config.serviceAccountJson);
  return generateImages({
    ...options,
    projectId: config.projectId,
    region: config.region,
    model: config.model,
    accessToken,
  });
}
