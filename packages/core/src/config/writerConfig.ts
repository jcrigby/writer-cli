/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WriterModelConfig {
  provider: 'openrouter' | 'anthropic' | 'openai';
  model: string;
  apiKey?: string;
  baseURL?: string;
}

export const DEFAULT_MODELS: Record<string, WriterModelConfig> = {
  'claude-3.5-sonnet': {
    provider: 'openrouter',
    model: 'anthropic/claude-3.5-sonnet-20241022',
  },
  'claude-3-opus': {
    provider: 'openrouter',
    model: 'anthropic/claude-3-opus-20240229',
  },
  'gpt-4-turbo': {
    provider: 'openrouter',
    model: 'openai/gpt-4-turbo',
  },
  'gpt-4o': {
    provider: 'openrouter',
    model: 'openai/gpt-4o',
  },
  'gemini-pro': {
    provider: 'openrouter',
    model: 'google/gemini-pro',
  },
};

export function getModelConfig(modelName: string): WriterModelConfig {
  // Check if it's a predefined model
  if (DEFAULT_MODELS[modelName]) {
    return DEFAULT_MODELS[modelName];
  }

  // Otherwise treat it as a raw OpenRouter model name
  return {
    provider: 'openrouter',
    model: modelName,
  };
}

export function getApiKey(provider: string): string {
  switch (provider) {
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY || '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    default:
      return '';
  }
}

export const DEFAULT_WRITER_MODEL = 'claude-3.5-sonnet';
export const WRITER_CONFIG_DIR = '.writer';