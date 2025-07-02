/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { WritingCommandsService, ProjectManager } from 'writer-cli-core';

interface BrainstormArgs {
  character?: string;
  situation?: string;
  theme?: string;
  count?: number;
}

export const brainstormCommand: CommandModule<{}, BrainstormArgs> = {
  command: 'brainstorm',
  describe: 'AI-powered brainstorming for your writing project',
  builder: (yargs) => {
    return yargs
      .option('character', {
        describe: 'Focus brainstorming on a specific character',
        type: 'string'
      })
      .option('situation', {
        describe: 'Brainstorm scenarios for a situation',
        type: 'string'
      })
      .option('theme', {
        describe: 'Explore ideas around a theme',
        type: 'string'
      })
      .option('count', {
        describe: 'Number of ideas to generate',
        type: 'number',
        default: 5
      })
      .example('$0 brainstorm --character "John Doe" --situation "confronts villain"', 'Character scenario ideas')
      .example('$0 brainstorm --theme "redemption" --count 10', 'Theme exploration');
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

      console.log('🧠 Brainstorming ideas...');
      
      let topic = `Generate ${argv.count} creative ideas for this ${project.type} project.`;
      
      if (argv.theme) {
        topic = `${argv.theme} theme ideas for ${project.type}`;
      }
      
      const options = {
        character: argv.character,
        situation: argv.situation
      };

      const result = await writingService.brainstormCommand(topic, options);
      
      console.log('✅ Brainstorming complete!');
      console.log('\n--- Generated Ideas ---');
      console.log(typeof result === 'string' ? result : 'Streaming response completed');
      
    } catch (error) {
      console.error('❌ Brainstorming failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};