/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType } from 'writer-cli-core';
import { loadEnvironment } from './config.js';

export const validateAuthMethod = (authMethod: AuthType | string): string | null => {
  loadEnvironment();
  
  // Only OpenRouter is supported
  if (authMethod === AuthType.USE_OPENROUTER) {
    if (!process.env.OPENROUTER_API_KEY) {
      return 'OPENROUTER_API_KEY environment variable not found. Add that to your .env and try again, no reload needed!';
    }
    return null;
  }

  return 'Only OpenRouter authentication is supported. Please use AuthType.USE_OPENROUTER.';
};
