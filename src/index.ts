/**
 * Vertex AI Image Generation
 *
 * Free image generation via Vertex AI Gemini 3.1 Flash Image.
 * Framework-agnostic core with integrations for OpenClaw, Claude Code, and Hermes Agent.
 */

export {
  getAccessToken,
  generateImages,
  generateImagesWithAuth,
  type ServiceAccount,
  type ImageGenerationOptions,
  type ImageResult,
  type VertexConfig,
  type AspectRatio,
  type SafetySettingLevel,
  type PersonGeneration,
} from './lib/client.js';
