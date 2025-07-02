/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ProjectManager, ProjectType } from 'writer-cli-core';

interface InitArgs {
  type: ProjectType;
  title?: string;
  author?: string;
}

export const initCommand: CommandModule<{}, InitArgs> = {
  command: 'init [title]',
  describe: 'Initialize a new writing project',
  builder: (yargs) => {
    return yargs
      .positional('title', {
        describe: 'Project title',
        type: 'string',
        default: 'My Writing Project'
      })
      .option('type', {
        describe: 'Type of writing project',
        choices: ['novel', 'screenplay', 'academic', 'technical', 'blog', 'poetry'] as const,
        default: 'novel' as ProjectType
      })
      .option('author', {
        describe: 'Author name',
        type: 'string'
      })
      .example('$0 init "My Great Novel" --type novel --author "Jane Writer"', 'Initialize a novel project');
  },
  handler: async (argv) => {
    try {
      const projectManager = new ProjectManager();
      
      const projectConfig = {
        title: argv.title || 'My Writing Project',
        author: argv.author || 'Unknown Author',
        type: argv.type,
        targetWordCount: getDefaultWordCount(argv.type),
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      await projectManager.initializeProject(process.cwd(), projectConfig);
      
      console.log(`✅ Initialized ${argv.type} project: "${projectConfig.title}"`);
      console.log(`📁 Project structure created in ${process.cwd()}`);
      console.log(`📝 Author: ${projectConfig.author}`);
      console.log(`🎯 Target word count: ${projectConfig.targetWordCount.toLocaleString()}`);
      console.log('');
      console.log('Next steps:');
      console.log('  writer chapter add "Chapter 1: The Beginning"');
      console.log('  writer character create "Protagonist" --role main');
      console.log('  writer write --continue chapter1.md');
      
    } catch (error) {
      console.error('❌ Failed to initialize project:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};

function getDefaultWordCount(type: ProjectType): number {
  switch (type) {
    case 'novel': return 80000;
    case 'screenplay': return 20000; // ~90-120 pages
    case 'academic': return 10000;
    case 'technical': return 15000;
    case 'blog': return 1000;
    case 'poetry': return 5000;
    default: return 10000;
  }
}