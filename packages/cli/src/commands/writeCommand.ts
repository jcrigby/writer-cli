/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { WritingCommandsService, ProjectManager } from 'writer-cli-core';

interface WriteArgs {
  file?: string;
  continue?: boolean;
  prompt?: string;
}

export const writeCommand: CommandModule<{}, WriteArgs> = {
  command: 'write [file]',
  describe: 'AI-assisted writing for your project',
  builder: (yargs) => {
    return yargs
      .positional('file', {
        describe: 'File to write to (e.g., chapter1.md)',
        type: 'string'
      })
      .option('continue', {
        describe: 'Continue writing from where the file left off',
        type: 'boolean',
        default: false
      })
      .option('prompt', {
        describe: 'Specific writing prompt or direction',
        type: 'string'
      })
      .example('$0 write chapter1.md --continue', 'Continue writing chapter 1')
      .example('$0 write --prompt "Write a dramatic scene"', 'Write based on prompt');
  },
  handler: async (argv) => {
    try {
      const projectManager = new ProjectManager();
      
      if (!await projectManager.isProjectDirectory(process.cwd())) {
        console.error('❌ Not in a writing project directory. Run "claude init" first.');
        process.exit(1);
      }

      const project = await projectManager.loadProject();
      
      if (!project) {
        console.error('❌ Could not load project configuration.');
        process.exit(1);
      }

      // Need to create WritingCommandsService with proper model config
      const modelConfig = {
        provider: 'openrouter' as const,
        model: 'anthropic/claude-3.5-sonnet',
        apiKey: process.env.OPENROUTER_API_KEY || ''
      };
      
      const writingService = new WritingCommandsService(modelConfig, project);

      console.log('✍️  Starting AI-assisted writing...');
      
      const instruction = argv.prompt || 'Continue the story naturally.';
      const options = {
        continue: argv.continue || false
      };

      const result = await writingService.writeCommand(instruction, argv.file, options);
      
      if (argv.file) {
        console.log(`✅ Writing completed for ${argv.file}`);
      } else {
        console.log('\n--- Generated Content ---');
        console.log(typeof result === 'string' ? result : 'Streaming response completed');
        console.log('\n✅ Writing completed');
      }
      
    } catch (error) {
      console.error('❌ Writing failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};