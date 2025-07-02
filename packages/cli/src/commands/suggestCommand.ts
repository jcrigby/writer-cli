/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { WritingCommandsService, ProjectManager } from 'writer-cli-core';

interface SuggestArgs {
  file?: string;
  type?: string;
}

export const suggestCommand: CommandModule<{}, SuggestArgs> = {
  command: 'suggest [file]',
  describe: 'Get AI suggestions for improving your writing',
  builder: (yargs) => {
    return yargs
      .positional('file', {
        describe: 'File to analyze for suggestions',
        type: 'string'
      })
      .option('type', {
        describe: 'Type of suggestions',
        choices: ['plot', 'character', 'dialogue', 'pacing', 'style', 'structure'],
        default: 'general'
      })
      .example('$0 suggest chapter1.md --type dialogue', 'Get dialogue suggestions')
      .example('$0 suggest --type plot', 'Get plot development suggestions');
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

      console.log(`💡 Generating ${argv.type} suggestions...`);
      
      if (!argv.file) {
        console.error('❌ File path is required for suggestions');
        process.exit(1);
      }

      // Map suggestion types to the expected format
      const suggestionTypeMap: Record<string, 'improve' | 'continue' | 'dialogue' | 'plot' | 'character'> = {
        'plot': 'plot',
        'character': 'character',
        'dialogue': 'dialogue',
        'pacing': 'improve',
        'style': 'improve',
        'structure': 'improve',
        'general': 'improve'
      };

      const mappedType = suggestionTypeMap[argv.type || 'general'] || 'improve';
      const result = await writingService.suggestCommand(argv.file, mappedType);
      
      console.log('✅ Suggestions generated:');
      console.log('\n--- AI Suggestions ---');
      console.log(typeof result === 'string' ? result : 'Streaming response completed');
      
    } catch (error) {
      console.error('❌ Suggestion generation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};