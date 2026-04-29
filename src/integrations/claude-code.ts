/**
 * Claude Code Integration for Vertex AI Image Generation
 *
 * Provides image generation as an MCP server for Claude Code.
 */

import { generateImagesWithAuth, getAccessToken, type AspectRatio, type SafetySettingLevel, type PersonGeneration } from '../lib/client.js';

interface GenerateImageArgs {
  prompt: string;
  aspectRatio?: AspectRatio;
  numberOfImages?: number;
  safetySetting?: SafetySettingLevel;
  personGeneration?: PersonGeneration;
}

function getConfig(): { projectId: string; region: string; model: string; serviceAccountJson: string } {
  const serviceAccountJson = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error('VERTEX_AI_SERVICE_ACCOUNT_JSON environment variable is required');
  const projectId = process.env.VERTEX_AI_PROJECT_ID;
  if (!projectId) throw new Error('VERTEX_AI_PROJECT_ID environment variable is required');
  return {
    projectId,
    region: process.env.VERTEX_AI_REGION || 'global',
    model: process.env.VERTEX_AI_MODEL || 'gemini-3.1-flash-image-preview',
    serviceAccountJson,
  };
}

const TOOL_NAME = 'generate_image';

async function handleToolCall(tool: string, args: Record<string, unknown>) {
  switch (tool) {
    case TOOL_NAME:
      return handleGenerateImage(args as GenerateImageArgs);
    case 'get_access_token':
      return { access_token: await getAccessToken(getConfig().serviceAccountJson) };
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

async function handleGenerateImage(args: GenerateImageArgs): Promise<{
  images?: Array<{ data: string; mimeType: string }>;
  error?: string;
}> {
  if (!args.prompt) return { error: 'prompt is required' };

  try {
    const config = getConfig();
    const results = await generateImagesWithAuth(config, {
      prompt: args.prompt,
      aspectRatio: args.aspectRatio,
      numberOfImages: args.numberOfImages,
      safetySetting: args.safetySetting,
      personGeneration: args.personGeneration,
    });

    if (results.length === 0) {
      return { error: 'No images generated. The prompt may have been blocked by safety filters.' };
    }

    return {
      images: results.map((r) => ({ data: r.imageData, mimeType: r.mimeType })),
    };
  } catch (error) {
    return { error: `Error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

const server = {
  name: 'vertex-ai-image',
  version: '1.0.0',
  description: 'Image generation via Vertex AI Gemini 3.1 Flash Image (free)',
};

const tools = [
  {
    name: TOOL_NAME,
    description: 'Generate images using Vertex AI Gemini 3.1 Flash Image. Supports aspect ratios like 1:1, 16:9, 9:16, etc.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Text description of the image to generate' },
        aspectRatio: {
          type: 'string',
          description: 'Aspect ratio of output image',
          enum: ['1:1', '1:4', '1:8', '3:2', '2:3', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'],
        },
        numberOfImages: { type: 'number', description: 'Number of images to generate (1-8)', minimum: 1, maximum: 8 },
        safetySetting: {
          type: 'string',
          description: 'Safety setting level',
          enum: ['BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE', 'BLOCK_ONLY_HIGH', 'BLOCK_NONE'],
        },
        personGeneration: {
          type: 'string',
          description: 'Person generation setting',
          enum: ['DONT_ALLOW', 'ALLOW_ADULT', 'ALLOW_ALL'],
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'get_access_token',
    description: 'Get a fresh GCP access token for debugging',
    input_schema: { type: 'object', properties: {} },
  },
];

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'claude-code') {
    console.error('Vertex AI Image MCP server for Claude Code');
    console.error('');
    console.error('To add to Claude Code:');
    console.error('  claude mcp add vertex-image --transport stdio -- npx -y vertex-ai-image claude-code');
    console.error('');
    console.error('Environment variables required:');
    console.error('  VERTEX_AI_PROJECT_ID=your-project-id');
    console.error('  VERTEX_AI_SERVICE_ACCOUNT_JSON={"type":"service_account",...}');
    process.exit(0);
  } else if (command === 'test') {
    const prompt = process.argv[3] || 'A cute cat sitting on a windowsill';
    console.log(`Generating image: "${prompt}"`);

    try {
      const config = getConfig();
      const results = await generateImagesWithAuth(config, { prompt });
      console.log(`\nGenerated ${results.length} image(s)`);
      results.forEach((r, i) => {
        const filename = `/tmp/generated_image_${Date.now()}_${i}.${r.mimeType.split('/')[1]}`;
        require('fs').writeFileSync(filename, Buffer.from(r.imageData, 'base64'));
        console.log(`Saved to: ${filename}`);
      });
    } catch (error) {
      console.error('Generation failed:', error);
      process.exit(1);
    }
  } else {
    console.log('Usage:');
    console.log('  vertex-ai-image claude-code  # Run as MCP server');
    console.log('  vertex-ai-image test [prompt] # Test generation');
  }
}

export { server, tools, handleToolCall, getConfig };
export default { server, tools, handleToolCall, getConfig };
