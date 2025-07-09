/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
} from '@google/genai';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';
import { OpenRouterClient } from './openrouterClient.js';

/**
 * Interface abstracting the core functionalities for generating content and counting tokens.
 */
export interface ContentGenerator {
  generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse>;

  generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>>;

  countTokens(request: CountTokensParameters): Promise<CountTokensResponse>;

  embedContent(request: EmbedContentParameters): Promise<EmbedContentResponse>;
}

export enum AuthType {
  USE_OPENROUTER = 'openrouter-api-key',
}

export type ContentGeneratorConfig = {
  model: string;
  apiKey?: string;
  vertexai?: boolean;
  authType?: AuthType | string | undefined;
};

export async function createContentGeneratorConfig(
  model: string | undefined,
  authType: AuthType | string | undefined,
  config?: { getModel?: () => string },
): Promise<ContentGeneratorConfig> {
  // Use runtime model from config if available, otherwise fallback to parameter or default
  const effectiveModel = config?.getModel?.() || model || DEFAULT_GEMINI_MODEL;

  const contentGeneratorConfig: ContentGeneratorConfig = {
    model: effectiveModel,
    authType: AuthType.USE_OPENROUTER,
  };

  // OpenRouter is the only supported auth type
  if (process.env.OPENROUTER_API_KEY) {
    contentGeneratorConfig.apiKey = process.env.OPENROUTER_API_KEY;
    return contentGeneratorConfig;
  }

  throw new Error(
    'OPENROUTER_API_KEY environment variable is required. Please set it to use Writer CLI.'
  );
}

export async function createContentGenerator(
  config: ContentGeneratorConfig,
  sessionId?: string,
): Promise<ContentGenerator> {
  // Only OpenRouter is supported
  if (config.authType === AuthType.USE_OPENROUTER) {
    return createOpenRouterContentGenerator(config);
  }

  throw new Error(
    `Error creating contentGenerator: Unsupported authType: ${config.authType}`,
  );
}

/**
 * Creates a ContentGenerator that uses OpenRouter for multi-model support
 */
function createOpenRouterContentGenerator(
  config: ContentGeneratorConfig
): ContentGenerator {
  // Map legacy Gemini model names to OpenRouter model names
  let mappedModel = config.model;
  switch (config.model) {
    case 'gemini-2.5-pro':
    case 'gemini-pro':
      mappedModel = 'anthropic/claude-3.5-sonnet';
      break;
    case 'gemini-2.5-flash':
    case 'gemini-flash':
      mappedModel = 'anthropic/claude-3-haiku';
      break;
    default:
      // If it's already a valid OpenRouter model format, keep it
      if (!mappedModel.includes('/')) {
        mappedModel = 'anthropic/claude-3.5-sonnet'; // Default fallback
      }
  }

  const modelConfig = {
    provider: 'openrouter',
    model: mappedModel,
    apiKey: config.apiKey || '',
  };

  const client = new OpenRouterClient(modelConfig as any);

  return {
    async generateContent(
      request: GenerateContentParameters,
    ): Promise<GenerateContentResponse> {
      // Extract prompt from contents
      let prompt = '';
      if (request.contents) {
        const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
        if (contents.length > 0) {
          const lastContent = contents[contents.length - 1];
          if (typeof lastContent === 'string') {
            prompt = lastContent;
          } else if (lastContent && typeof lastContent === 'object' && 'parts' in lastContent && lastContent.parts && lastContent.parts.length > 0) {
            const part = lastContent.parts[0];
            if (typeof part === 'object' && 'text' in part) {
              prompt = part.text || '';
            }
          }
        }
      }
      
      const result = await client.generateText(prompt, undefined, {
        maxTokens: request.config?.maxOutputTokens || 4096,
        temperature: request.config?.temperature || 0.7,
        stream: false,
      });

      const text = typeof result === 'string' ? result : '';

      // Convert to GenerateContentResponse format
      return {
        candidates: [{
          content: {
            parts: [{ text }],
            role: 'model',
          },
          finishReason: 'STOP',
          index: 0,
        }],
        usageMetadata: {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0,
        },
      } as GenerateContentResponse;
    },

    async generateContentStream(
      request: GenerateContentParameters,
    ): Promise<AsyncGenerator<GenerateContentResponse>> {
      // Extract prompt from contents
      let prompt = '';
      if (request.contents) {
        const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
        if (contents.length > 0) {
          const lastContent = contents[contents.length - 1];
          if (typeof lastContent === 'string') {
            prompt = lastContent;
          } else if (lastContent && typeof lastContent === 'object' && 'parts' in lastContent && lastContent.parts && lastContent.parts.length > 0) {
            const part = lastContent.parts[0];
            if (typeof part === 'object' && 'text' in part) {
              prompt = part.text || '';
            }
          }
        }
      }
      
      const stream = await client.generateText(prompt, undefined, {
        maxTokens: request.config?.maxOutputTokens || 4096,
        temperature: request.config?.temperature || 0.7,
        stream: true,
      });

      if (typeof stream === 'string') {
        // Non-streaming response
        return (async function* () {
          yield {
            candidates: [{
              content: {
                parts: [{ text: stream }],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            }],
            usageMetadata: {
              promptTokenCount: 0,
              candidatesTokenCount: 0,
              totalTokenCount: 0,
            },
          } as GenerateContentResponse;
        })();
      }

      // Convert streaming response
      return (async function* () {
        let accumulatedText = '';
        for await (const chunk of stream) {
          accumulatedText += chunk;
          yield {
            candidates: [{
              content: {
                parts: [{ text: chunk }],
                role: 'model',
              },
              finishReason: undefined,
              index: 0,
            }],
            usageMetadata: {
              promptTokenCount: 0,
              candidatesTokenCount: 0,
              totalTokenCount: 0,
            },
          } as GenerateContentResponse;
        }
      })();
    },

    async countTokens(
      request: CountTokensParameters,
    ): Promise<CountTokensResponse> {
      // Extract text from contents for token counting
      let text = '';
      if (request.contents) {
        const contents = Array.isArray(request.contents) ? request.contents : [request.contents];
        for (const content of contents) {
          if (typeof content === 'string') {
            text += content + ' ';
          } else if (content && typeof content === 'object' && 'parts' in content && content.parts) {
            for (const part of content.parts) {
              if (typeof part === 'object' && 'text' in part && part.text) {
                text += part.text + ' ';
              }
            }
          }
        }
      }
      
      // Rough estimation - 1 token ≈ 4 characters
      const tokenCount = Math.ceil(text.length / 4);
      
      return {
        totalTokens: tokenCount,
      } as CountTokensResponse;
    },

    async embedContent(
      request: EmbedContentParameters,
    ): Promise<EmbedContentResponse> {
      // Not implemented for OpenRouter
      throw new Error('Embeddings not supported for OpenRouter models');
    },
  };
}
