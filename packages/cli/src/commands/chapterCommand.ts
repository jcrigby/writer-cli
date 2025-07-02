/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ProjectManager } from 'writer-cli-core';

interface ChapterArgs {
  action?: 'add' | 'list' | 'remove';
  title?: string;
  number?: number;
}

export const chapterCommand: CommandModule<{}, ChapterArgs> = {
  command: 'chapter <action> [title]',
  describe: 'Manage chapters in your writing project',
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        choices: ['add', 'list', 'remove'] as const
      })
      .positional('title', {
        describe: 'Chapter title',
        type: 'string'
      })
      .option('number', {
        describe: 'Chapter number (auto-assigned if not specified)',
        type: 'number'
      })
      .example('$0 chapter add "The Beginning"', 'Add a new chapter')
      .example('$0 chapter list', 'List all chapters')
      .example('$0 chapter remove --number 3', 'Remove chapter 3');
  },
  handler: async (argv) => {
    try {
      const projectManager = new ProjectManager();
      
      if (!await projectManager.isProjectDirectory(process.cwd())) {
        console.error('❌ Not in a writing project directory. Run "writer init" first.');
        process.exit(1);
      }

      if (!argv.action) {
        console.error('❌ Action is required');
        process.exit(1);
      }

      switch (argv.action) {
        case 'add':
          if (!argv.title) {
            console.error('❌ Chapter title is required for "add" action');
            process.exit(1);
          }
          await projectManager.addChapter(process.cwd(), {
            title: argv.title,
            number: argv.number
          });
          console.log(`✅ Added chapter: "${argv.title}"`);
          break;
          
        case 'list':
          const chapters = await projectManager.listChapters(process.cwd());
          if (chapters.length === 0) {
            console.log('📚 No chapters found. Add one with: writer chapter add "Chapter Title"');
          } else {
            console.log('📚 Chapters:');
            chapters.forEach(chapter => {
              const wordCount = chapter.wordCount || 0;
              console.log(`  ${chapter.number}. ${chapter.title} (${wordCount.toLocaleString()} words)`);
            });
          }
          break;
          
        case 'remove':
          if (!argv.number) {
            console.error('❌ Chapter number is required for "remove" action');
            process.exit(1);
          }
          await projectManager.removeChapter(process.cwd(), argv.number);
          console.log(`✅ Removed chapter ${argv.number}`);
          break;
      }
      
    } catch (error) {
      console.error('❌ Chapter operation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};