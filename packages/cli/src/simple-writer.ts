#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple non-React entry point for writer commands
import { parseWriterCommands, isWriterCommand } from './commands/index.js';

async function main() {
  if (isWriterCommand(process.argv.slice(2))) {
    try {
      await parseWriterCommands();
    } catch (error) {
      console.error('Command failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  } else {
    console.log('Writer CLI - A writing assistant powered by AI');
    console.log('');
    console.log('Usage: writer <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  init [title]           Initialize a new writing project');
    console.log('  chapter <action>       Manage chapters');
    console.log('  character <action>     Manage characters');
    console.log('  write [file]           AI-assisted writing');
    console.log('  revise <file>          AI-powered revision');
    console.log('  suggest [file]         Get writing suggestions');
    console.log('  brainstorm             Generate creative ideas');
    console.log('');
    console.log('Examples:');
    console.log('  writer init "My Novel" --type novel');
    console.log('  writer character create "Hero" --role protagonist');
    console.log('  writer brainstorm --theme adventure');
    console.log('');
    console.log('For help with a specific command: writer <command> --help');
  }
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});