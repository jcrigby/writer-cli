/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';

interface WriterMessageContentProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  terminalWidth: number;
}

/*
 * Gemini message content is a semi-hacked component. The intention is to represent a partial
 * of WriterMessage and is only used when a response gets too long. In that instance messages
 * are split into multiple WriterMessageContent's to enable the root <Static> component in
 * App.tsx to be as performant as humanly possible.
 */
export const WriterMessageContent: React.FC<WriterMessageContentProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  terminalWidth,
}) => {
  const originalPrefix = '✦ ';
  const prefixWidth = originalPrefix.length;

  return (
    <Box flexDirection="column" paddingLeft={prefixWidth}>
      <MarkdownDisplay
        text={text}
        isPending={isPending}
        availableTerminalHeight={availableTerminalHeight}
        terminalWidth={terminalWidth}
      />
    </Box>
  );
};
