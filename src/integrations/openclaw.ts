/**
 * OpenClaw Integration for Vertex AI Image Generation
 *
 * Registers as an OpenClaw image generation provider.
 */

import { definePluginEntry } from 'openclaw/plugin-sdk/plugin-entry';
import { getAccessToken, generateImages, type AspectRatio, type SafetySettingLevel, type PersonGeneration } from '../lib/client.js';

interface GenerateImageArgs {
  prompt: string;
  aspectRatio?: AspectRatio;
  numberOfImages?: number;
  safetySetting?: SafetySettingLevel;
  personGeneration?: PersonGeneration;
}

function resolveConfig(config: Record<string, unknown> | undefined) {
  if (!config || typeof config !== 'object') return;
  const plugins = (config as Record<string, unknown>).plugins as Record<string, unknown> | undefined;
  const entries = plugins?.entries as Record<string, unknown> | undefined;
  const vertexEntry = entries?.['vertex-ai-image'] as Record<string, unknown> | undefined;
  return vertexEntry?.config as Record<string, unknown> | undefined;
}

function createImageTool(ctx: { config?: Record<string, unknown> }) {
  return {
    description: 'Generate images using Vertex AI Gemini 3.1 Flash Image (free). Requires Google Cloud service account.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Text description of the image to generate.' },
        aspectRatio: {
          type: 'string',
          description: 'Aspect ratio of output image.',
          enum: ['1:1', '1:4', '1:8', '3:2', '2:3', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'],
        },
        numberOfImages: { type: 'number', description: 'Number of images to generate (1-8).', minimum: 1, maximum: 8 },
        safetySetting: {
          type: 'string',
          description: 'Safety setting level.',
          enum: ['BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE', 'BLOCK_ONLY_HIGH', 'BLOCK_NONE'],
        },
        personGeneration: {
          type: 'string',
          description: 'Person generation setting.',
          enum: ['DONT_ALLOW', 'ALLOW_ADULT', 'ALLOW_ALL'],
        },
      },
      required: ['prompt'],
    },
    execute: async (args: GenerateImageArgs) => {
      const pluginConfig = resolveConfig(ctx.config);
      const projectId = pluginConfig?.projectId as string | undefined;
      const region = pluginConfig?.region as string | undefined;
      const model = pluginConfig?.model as string | undefined;
      const serviceAccountJson = pluginConfig?.serviceAccountJson as string | undefined;

      if (!projectId || !serviceAccountJson) {
        return {
          error: 'Error: Vertex AI Image not configured. Set projectId and serviceAccountJson in plugin config.',
        };
      }

      let accessToken: string;
      try {
        accessToken = await getAccessToken(serviceAccountJson);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        return { error: `Error getting access token: ${err.message}` };
      }

      try {
        const results = await generateImages({
          prompt: args.prompt,
          projectId,
          region: region ?? 'global',
          model: model ?? 'gemini-3.1-flash-image-preview',
          aspectRatio: args.aspectRatio,
          numberOfImages: args.numberOfImages,
          safetySetting: args.safetySetting,
          personGeneration: args.personGeneration,
          accessToken,
        });

        if (results.length === 0) {
          return { error: 'No images generated. The prompt may have been blocked by safety filters.' };
        }

        return {
          images: results.map((r) => ({
            data: r.imageData,
            mimeType: r.mimeType,
            promptFeedback: r.promptFeedback,
          })),
        };
      } catch (e) {
        return {
          error: `Error: ${e instanceof Error ? e.message : String(e)}`,
        };
      }
    },
  };
}

const CREDENTIAL_PATH = 'plugins.entries.vertex-ai-image.config.serviceAccountJson';

function getCredentialValue(searchConfig?: Record<string, unknown>): string | undefined {
  const scoped = searchConfig?.['vertex-ai-image'];
  if (!scoped || typeof scoped !== 'object' || Array.isArray(scoped)) return;
  return (scoped as { serviceAccountJson?: string }).serviceAccountJson;
}

function setCredentialValue(searchConfigTarget: Record<string, unknown>, value: unknown): void {
  const scoped = (searchConfigTarget['vertex-ai-image'] ??= {}) as Record<string, unknown>;
  scoped.serviceAccountJson = value as string;
}

function getConfiguredCredentialValue(config?: Record<string, unknown>): string | undefined {
  const pluginConfig = (config as Record<string, unknown>)?.plugins as Record<string, unknown>;
  const vertexConfig = pluginConfig?.entries as Record<string, unknown>;
  return (vertexConfig?.['vertex-ai-image'] as Record<string, unknown>)?.config as Record<string, unknown> | undefined;
}

function setConfiguredCredentialValue(configTarget: Record<string, unknown>, value: unknown): void {
  const pluginEntries = (((configTarget.plugins ??= {}) as Record<string, unknown>).entries ??= {}) as Record<string, unknown>;
  const vertexEntry = (pluginEntries['vertex-ai-image'] ??= {}) as Record<string, unknown>;
  const config = (vertexEntry.config ??= {}) as Record<string, unknown>;
  config.serviceAccountJson = value;
}

const plugin = {
  id: 'vertex-ai-image',
  name: 'Vertex AI Image Generation',
  description: 'Generate images via Vertex AI Gemini 3.1 Flash Image (free)',
  register(
    api: {
      registerImageGenerationProvider: (provider: {
        id: string;
        label: string;
        hint?: string;
        envVars?: string[];
        placeholder?: string;
        signupUrl?: string;
        docsUrl?: string;
        autoDetectOrder?: number;
        createTool: (ctx: { pluginConfig?: Record<string, unknown> }) => {
          description: string;
          parameters: Record<string, unknown>;
          execute: (args: GenerateImageArgs) => Promise<unknown>;
        };
      }) => void;
    }
  ) {
    api.registerImageGenerationProvider({
      id: 'vertex-ai-image',
      label: 'Vertex AI Image Generation',
      hint: 'Free image generation via Vertex AI Gemini 3.1 Flash Image',
      envVars: [],
      placeholder: '{"type":"service_account",...}',
      signupUrl: 'https://console.cloud.google.com/vertex-ai',
      docsUrl: 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-1-flash-image',
      autoDetectOrder: 5,
      credentialPath: CREDENTIAL_PATH,
      requiresCredential: true,
      inactiveSecretPaths: [CREDENTIAL_PATH],
      getCredentialValue,
      setCredentialValue,
      getConfiguredCredentialValue,
      setConfiguredCredentialValue,
      createTool: (ctx) => createImageTool(ctx),
    });
  },
};

export default definePluginEntry(plugin);
