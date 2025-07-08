/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { type Config, WritingProject } from 'writer-cli-core';

interface TipsProps {
  config: Config;
  writingProject?: WritingProject | null;
}

export const Tips: React.FC<TipsProps> = ({ config, writingProject }) => {
  const geminiMdFileCount = config.getGeminiMdFileCount();
  
  if (writingProject) {
    // Writing-specific tips
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color={Colors.Foreground}>✍️  Getting started with your {writingProject.type}:</Text>
        <Text color={Colors.Foreground}>
          1. Ask me to continue writing, brainstorm ideas, or develop characters
        </Text>
        <Text color={Colors.Foreground}>
          2. Use <Text bold color={Colors.AccentPurple}>writer</Text> commands for project management
        </Text>
        <Text color={Colors.Foreground}>
          3. <Text bold color={Colors.AccentPurple}>/help</Text> for more information
        </Text>
      </Box>
    );
  }
  
  // Default tips for non-writing projects
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={Colors.Foreground}>Tips for getting started:</Text>
      <Text color={Colors.Foreground}>
        1. Ask questions, edit files, or run commands.
      </Text>
      <Text color={Colors.Foreground}>
        2. Be specific for the best results.
      </Text>
      {geminiMdFileCount === 0 && (
        <Text color={Colors.Foreground}>
          3. Create{' '}
          <Text bold color={Colors.AccentPurple}>
            GEMINI.md
          </Text>{' '}
          files to customize your interactions with Gemini.
        </Text>
      )}
      <Text color={Colors.Foreground}>
        {geminiMdFileCount === 0 ? '4.' : '3.'}{' '}
        <Text bold color={Colors.AccentPurple}>
          /help
        </Text>{' '}
        for more information.
      </Text>
    </Box>
  );
};
