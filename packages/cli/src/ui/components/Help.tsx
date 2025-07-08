/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { SlashCommand } from '../hooks/slashCommandProcessor.js';
import { WritingProject } from 'writer-cli-core';

interface Help {
  commands: SlashCommand[];
  writingProject?: WritingProject | null;
}

export const Help: React.FC<Help> = ({ commands, writingProject }) => (
  <Box
    flexDirection="column"
    marginBottom={1}
    borderColor={Colors.Gray}
    borderStyle="round"
    padding={1}
  >
    {/* Writing Project Context */}
    {writingProject && (
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={Colors.AccentPurple}>
          📚 Writing Project: {writingProject.title}
        </Text>
        <Text color={Colors.Foreground}>
          📝 {writingProject.author} • {writingProject.type} • {writingProject.characters?.length || 0} characters
        </Text>
        <Text color={Colors.Foreground}>
          🎯 Target: {writingProject.settings?.wordCountGoal?.toLocaleString() || 'No target set'} words
        </Text>
        <Box marginTop={1}>
          <Text bold color={Colors.AccentPurple}>
            ✦ I can help with your {writingProject.type}! Try asking me to:
          </Text>
        </Box>
        <Text color={Colors.Foreground}>
          • Continue writing or brainstorm plot ideas
        </Text>
        <Text color={Colors.Foreground}>
          • Develop characters or improve dialogue
        </Text>
        <Text color={Colors.Foreground}>
          • Review and revise your writing
        </Text>
        <Text color={Colors.Foreground}>
          • Suggest improvements for pacing or style
        </Text>
      </Box>
    )}

    {/* Basics */}
    <Text bold color={Colors.Foreground}>
      {writingProject ? 'Commands:' : 'Basics:'}
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Add context
      </Text>
      : Use{' '}
      <Text bold color={Colors.AccentPurple}>
        @
      </Text>{' '}
      to specify files for context (e.g.,{' '}
      <Text bold color={Colors.AccentPurple}>
        @src/myFile.ts
      </Text>
      ) to target specific files or folders.
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Shell mode
      </Text>
      : Execute shell commands via{' '}
      <Text bold color={Colors.AccentPurple}>
        !
      </Text>{' '}
      (e.g.,{' '}
      <Text bold color={Colors.AccentPurple}>
        !npm run start
      </Text>
      ) or use natural language (e.g.{' '}
      <Text bold color={Colors.AccentPurple}>
        start server
      </Text>
      ).
    </Text>

    <Box height={1} />

    {/* Commands */}
    <Text bold color={Colors.Foreground}>
      Commands:
    </Text>
    {commands
      .filter((command) => command.description)
      .map((command: SlashCommand) => (
        <Text key={command.name} color={Colors.Foreground}>
          <Text bold color={Colors.AccentPurple}>
            {' '}
            /{command.name}
          </Text>
          {command.description && ' - ' + command.description}
        </Text>
      ))}
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        {' '}
        !{' '}
      </Text>
      - shell command
    </Text>

    <Box height={1} />

    {/* Shortcuts */}
    <Text bold color={Colors.Foreground}>
      Keyboard Shortcuts:
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Enter
      </Text>{' '}
      - Send message
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        {process.platform === 'win32' ? 'Ctrl+Enter' : 'Ctrl+J'}
      </Text>{' '}
      {process.platform === 'linux'
        ? '- New line (Alt+Enter works for certain linux distros)'
        : '- New line'}
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Up/Down
      </Text>{' '}
      - Cycle through your prompt history
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Alt+Left/Right
      </Text>{' '}
      - Jump through words in the input
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Shift+Tab
      </Text>{' '}
      - Toggle auto-accepting edits
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Esc
      </Text>{' '}
      - Cancel operation
    </Text>
    <Text color={Colors.Foreground}>
      <Text bold color={Colors.AccentPurple}>
        Ctrl+C
      </Text>{' '}
      - Quit application
    </Text>
  </Box>
);
