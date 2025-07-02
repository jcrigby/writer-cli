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
  GoogleGenAI,
} from '@google/genai';
import { createCodeAssistContentGenerator } from '../code_assist/codeAssist.js';
import { DEFAULT_GEMINI_MODEL } from '../config/models.js';
import { getEffectiveModel } from './modelCheck.js';
import { OpenRouterClient } from './openrouterClient.js';
import { getApiKey } from '../config/writerConfig.js';

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
  LOGIN_WITH_GOOGLE = 'oauth-personal',
  USE_GEMINI = 'gemini-api-key',
  USE_VERTEX_AI = 'vertex-ai',
  USE_OPENROUTER = 'openrouter-api-key',
  USE_ANTHROPIC = 'anthropic-api-key', 
  USE_OPENAI = 'openai-api-key',
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
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
  const googleCloudLocation = process.env.GOOGLE_CLOUD_LOCATION;

  // Use runtime model from config if available, otherwise fallback to parameter or default
  const effectiveModel = config?.getModel?.() || model || DEFAULT_GEMINI_MODEL;

  const contentGeneratorConfig: ContentGeneratorConfig = {
    model: effectiveModel,
    authType,
  };

  // if we are using google auth nothing else to validate for now
  if (authType === AuthType.LOGIN_WITH_GOOGLE) {
    return contentGeneratorConfig;
  }

  if (authType === AuthType.USE_GEMINI && geminiApiKey) {
    contentGeneratorConfig.apiKey = geminiApiKey;
    contentGeneratorConfig.model = await getEffectiveModel(
      contentGeneratorConfig.apiKey,
      contentGeneratorConfig.model,
    );

    return contentGeneratorConfig;
  }

  if (
    authType === AuthType.USE_VERTEX_AI &&
    !!googleApiKey &&
    googleCloudProject &&
    googleCloudLocation
  ) {
    contentGeneratorConfig.apiKey = googleApiKey;
    contentGeneratorConfig.vertexai = true;
    contentGeneratorConfig.model = await getEffectiveModel(
      contentGeneratorConfig.apiKey,
      contentGeneratorConfig.model,
    );

    return contentGeneratorConfig;
  }

  // Handle Writer CLI auth types
  if (authType === AuthType.USE_OPENROUTER && process.env.OPENROUTER_API_KEY) {
    contentGeneratorConfig.apiKey = process.env.OPENROUTER_API_KEY;
    return contentGeneratorConfig;
  }

  if (authType === AuthType.USE_ANTHROPIC && process.env.ANTHROPIC_API_KEY) {
    contentGeneratorConfig.apiKey = process.env.ANTHROPIC_API_KEY;
    return contentGeneratorConfig;
  }

  if (authType === AuthType.USE_OPENAI && process.env.OPENAI_API_KEY) {
    contentGeneratorConfig.apiKey = process.env.OPENAI_API_KEY;
    return contentGeneratorConfig;
  }

  return contentGeneratorConfig;
}

export async function createContentGenerator(
  config: ContentGeneratorConfig,
  sessionId?: string,
): Promise<ContentGenerator> {
  const version = process.env.CLI_VERSION || process.version;
  const httpOptions = {
    headers: {
      'User-Agent': `GeminiCLI/${version} (${process.platform}; ${process.arch})`,
    },
  };
  if (config.authType === AuthType.LOGIN_WITH_GOOGLE) {
    return createCodeAssistContentGenerator(
      httpOptions,
      config.authType,
      sessionId,
    );
  }

  if (
    config.authType === AuthType.USE_GEMINI ||
    config.authType === AuthType.USE_VERTEX_AI
  ) {
    const googleGenAI = new GoogleGenAI({
      apiKey: config.apiKey === '' ? undefined : config.apiKey,
      vertexai: config.vertexai,
      httpOptions,
    });

    return googleGenAI.models;
  }

  // Support for Writer CLI auth types
  if (
    config.authType === AuthType.USE_OPENROUTER ||
    config.authType === AuthType.USE_ANTHROPIC ||
    config.authType === AuthType.USE_OPENAI
  ) {
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
  // Map Gemini model names to OpenRouter model names
  let mappedModel = config.model;
  if (config.authType === AuthType.USE_OPENROUTER) {
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
  } else if (config.authType === AuthType.USE_ANTHROPIC) {
    switch (config.model) {
      case 'gemini-2.5-pro':
      case 'gemini-pro':
        mappedModel = 'claude-3-5-sonnet-latest';
        break;
      case 'gemini-2.5-flash':
      case 'gemini-flash':
        mappedModel = 'claude-3-haiku-20240307';
        break;
      default:
        if (!mappedModel.startsWith('claude-')) {
          mappedModel = 'claude-3-5-sonnet-latest';
        }
    }
  } else if (config.authType === AuthType.USE_OPENAI) {
    switch (config.model) {
      case 'gemini-2.5-pro':
      case 'gemini-pro':
        mappedModel = 'gpt-4';
        break;
      case 'gemini-2.5-flash':
      case 'gemini-flash':
        mappedModel = 'gpt-3.5-turbo';
        break;
      default:
        if (!mappedModel.startsWith('gpt-')) {
          mappedModel = 'gpt-4';
        }
    }
  }

  const modelConfig = {
    provider: config.authType === AuthType.USE_OPENROUTER ? 'openrouter' : 
             config.authType === AuthType.USE_ANTHROPIC ? 'anthropic' : 
             'openai',
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
