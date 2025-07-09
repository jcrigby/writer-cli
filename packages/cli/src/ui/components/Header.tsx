/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { Colors } from '../colors.js';
import { shortAsciiLogo, longAsciiLogo, writerLongLogo, writerShortLogo } from './AsciiArt.js';
import { getAsciiArtWidth } from '../utils/textUtils.js';
import { WritingProject } from 'writer-cli-core';

interface HeaderProps {
  customAsciiArt?: string; // For user-defined ASCII art
  terminalWidth: number; // For responsive logo
  writingProject?: WritingProject | null; // For project-aware branding
}

export const Header: React.FC<HeaderProps> = ({
  customAsciiArt,
  terminalWidth,
  writingProject,
}) => {
  let displayTitle;
  
  // Always use Writer logos
  const longLogo = writerLongLogo;
  const shortLogo = writerShortLogo;
  const widthOfLongLogo = getAsciiArtWidth(longLogo);

  if (customAsciiArt) {
    displayTitle = customAsciiArt;
  } else {
    displayTitle = terminalWidth >= widthOfLongLogo ? longLogo : shortLogo;
  }

  const artWidth = getAsciiArtWidth(displayTitle);

  return (
    <Box
      marginBottom={1}
      alignItems="flex-start"
      flexDirection="column"
      flexShrink={0}
    >
      <Box width={artWidth}>
        {Colors.GradientColors ? (
          <Gradient colors={Colors.GradientColors}>
            <Text>{displayTitle}</Text>
          </Gradient>
        ) : (
          <Text>{displayTitle}</Text>
        )}
      </Box>
      
      {/* Project Information */}
      {writingProject && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color={Colors.AccentPurple}>
            📚 {writingProject.title}
          </Text>
          <Text color={Colors.Foreground}>
            📝 by {writingProject.author} • {writingProject.type}
          </Text>
          {writingProject.settings?.wordCountGoal && (
            <Text color={Colors.Foreground}>
              🎯 Target: {writingProject.settings.wordCountGoal.toLocaleString()} words
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};
