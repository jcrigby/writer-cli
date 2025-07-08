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
    console.log('  commit <message>       Commit changes with version control');
    console.log('  history                View manuscript history');
    console.log('  backup [tag]           Create backups and restore versions');
    console.log('  status                 Show project status and progress');
    console.log('  sync                   Sync with GitHub (push/pull)');
    console.log('  publish [name]         Create GitHub repo and publish');
    console.log('  auth                   Setup GitHub authentication');
    console.log('  import [source]        Import existing manuscripts');
    console.log('');
    console.log('Examples:');
    console.log('  writer init "My Novel" --type novel');
    console.log('  writer character create "Hero" --role protagonist');
    console.log('  writer commit "Complete Chapter 1 draft"');
    console.log('  writer backup draft-v1');
    console.log('');
    console.log('For help with a specific command: writer <command> --help');
  }
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});