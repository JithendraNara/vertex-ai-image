/**
 * Hermes Agent Integration for Vertex AI Image Generation
 *
 * Provides image generation as an MCP server for Hermes Agent.
 */

import { generateImagesWithAuth, type AspectRatio, type SafetySettingLevel, type PersonGeneration } from '../lib/client.js';

interface HermesMcpConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface HermesImageConfig {
  projectId: string;
  region?: string;
  model?: string;
  serviceAccountJson: string;
  name?: string;
}

export function createHermesMcpServer(config: HermesImageConfig): HermesMcpConfig {
  return {
    name: config.name || 'vertex-ai-image',
    command: 'npx',
    args: ['-y', 'vertex-ai-image', 'hermes-mcp'],
    env: {
      VERTEX_AI_PROJECT_ID: config.projectId,
      VERTEX_AI_REGION: config.region || 'global',
      VERTEX_AI_MODEL: config.model || 'gemini-3.1-flash-image-preview',
      VERTEX_AI_SERVICE_ACCOUNT_JSON: config.serviceAccountJson,
    },
  };
}

export async function hermesGenerateImage(
  query: string,
  config: HermesImageConfig,
  options?: { aspectRatio?: AspectRatio; numberOfImages?: number }
): Promise<{ images?: Array<{ data: string; mimeType: string }>; error?: string }> {
  try {
    const results = await generateImagesWithAuth(config, {
      prompt: query,
      aspectRatio: options?.aspectRatio,
      numberOfImages: options?.numberOfImages,
    });

    if (results.length === 0) {
      return { error: 'No images generated. The prompt may have been blocked.' };
    }

    return {
      images: results.map((r) => ({ data: r.imageData, mimeType: r.mimeType })),
    };
  } catch (error) {
    return { error: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export const HERMES_INTEGRATION_STATUS = {
  status: 'working',
  type: 'mcp-server',
  setup_required: [
    'Install Hermes Agent',
    'Configure VERTEX_AI_* environment variables',
    'Add as MCP server via hermes tools',
  ],
  reference_url: 'https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp',
};

export default { createHermesMcpServer, hermesGenerateImage, HERMES_INTEGRATION_STATUS };
