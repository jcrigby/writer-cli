/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { WritingCommandsService, ProjectManager } from 'writer-cli-core';

interface ReviseArgs {
  file: string;
  tone?: string;
  focus?: string;
}

export const reviseCommand: CommandModule<{}, ReviseArgs> = {
  command: 'revise <file>',
  describe: 'AI-assisted revision of your writing',
  builder: (yargs) => {
    return yargs
      .positional('file', {
        describe: 'File to revise',
        type: 'string',
        demandOption: true
      })
      .option('tone', {
        describe: 'Adjust tone (formal, casual, dramatic, etc.)',
        type: 'string'
      })
      .option('focus', {
        describe: 'Revision focus (dialogue, pacing, clarity, etc.)',
        type: 'string'
      })
      .example('$0 revise chapter1.md --tone formal', 'Make chapter 1 more formal')
      .example('$0 revise scene2.md --focus dialogue', 'Improve dialogue in scene 2');
  },
  handler: async (argv) => {
    try {
      const projectManager = new ProjectManager();
      
      if (!await projectManager.isProjectDirectory(process.cwd())) {
        console.error('❌ Not in a writing project directory. Run "writer init" first.');
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

      console.log(`🔄 Revising ${argv.file}...`);
      
      const instruction = `Revise this content${argv.tone ? ` with a ${argv.tone} tone` : ''}${argv.focus ? ` focusing on ${argv.focus}` : ''}.`;
      const options = {
        tone: argv.tone,
        backup: true
      };

      const result = await writingService.reviseCommand(argv.file, instruction, options);
      
      console.log(`✅ Revision completed for ${argv.file}`);
      console.log('\n--- Revised Content ---');
      console.log(typeof result === 'string' ? result : 'Streaming response completed');
      
    } catch (error) {
      console.error('❌ Revision failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};