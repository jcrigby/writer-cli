/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Default model for Writer CLI - Claude 3.5 Sonnet via OpenRouter
export const DEFAULT_WRITER_MODEL = 'anthropic/claude-3.5-sonnet';

// Legacy constants for backward compatibility (will map to OpenRouter models)
export const DEFAULT_GEMINI_MODEL = DEFAULT_WRITER_MODEL;
export const DEFAULT_GEMINI_FLASH_MODEL = 'anthropic/claude-3-haiku';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'openai/text-embedding-3-small';
