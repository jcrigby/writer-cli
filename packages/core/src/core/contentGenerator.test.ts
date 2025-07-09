/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createContentGenerator, AuthType } from './contentGenerator.js';

describe('contentGenerator', () => {
  it('should create an OpenRouter content generator', async () => {
    const generator = await createContentGenerator({
      model: 'test-model',
      authType: AuthType.USE_OPENROUTER,
      apiKey: 'test-api-key',
    });
    expect(generator).toBeDefined();
  });

  it('should throw error for unsupported auth type', async () => {
    await expect(
      createContentGenerator({
        model: 'test-model',
        authType: 'unsupported-auth-type' as AuthType,
      }),
    ).rejects.toThrow('Unsupported authType');
  });
});
