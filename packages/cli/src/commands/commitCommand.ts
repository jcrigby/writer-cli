/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ManuscriptGitService } from 'writer-cli-core';
import { ProjectManager } from 'writer-cli-core';

interface CommitArgs {
  message: string;
  all?: boolean;
  chapter?: string;
  auto?: boolean;
}

export const commitCommand: CommandModule<{}, CommitArgs> = {
  command: 'commit <message>',
  describe: 'Commit changes to your manuscript with version control',
  builder: (yargs) => {
    return yargs
      .positional('message', {
        describe: 'Commit message describing the changes',
        type: 'string',
        demandOption: true
      })
      .option('all', {
        describe: 'Commit all changes in the project',
        type: 'boolean',
        default: false,
        alias: 'a'
      })
      .option('chapter', {
        describe: 'Commit only a specific chapter file',
        type: 'string',
        alias: 'c'
      })
      .option('auto', {
        describe: 'Auto-generate commit message based on changes',
        type: 'boolean',
        default: false
      })
      .example('$0 commit "Complete first draft of Chapter 1"', 'Commit all changes with message')
      .example('$0 commit "Fix dialogue in opening scene" --chapter chapters/01-beginning.md', 'Commit specific chapter')
      .example('$0 commit --auto', 'Auto-generate commit message');
  },
  handler: async (argv) => {
    try {
      const projectManager = new ProjectManager();
      const isProject = await projectManager.isProjectDirectory(process.cwd());
      
      if (!isProject) {
        console.error('❌ This command must be run from a Writer CLI project directory');
        console.error('   Initialize a project with: writer init "My Project"');
        process.exit(1);
      }

      const gitService = new ManuscriptGitService(process.cwd());
      await gitService.initialize();

      let commitHash: string;
      
      if (argv.chapter) {
        // Commit specific chapter
        console.log(`📝 Committing changes to ${argv.chapter}...`);
        commitHash = await gitService.commitChapter(argv.chapter, argv.message);
        console.log(`✅ Chapter committed: ${commitHash.substring(0, 7)}`);
      } else if (argv.all || !argv.chapter) {
        // Commit all changes
        console.log('📝 Committing all project changes...');
        commitHash = await gitService.commitAll(argv.message);
        console.log(`✅ All changes committed: ${commitHash.substring(0, 7)}`);
      }

      // Show status after commit
      const status = await gitService.getStatus();
      if (status.files.length === 0) {
        console.log('📂 Working directory is clean');
      } else {
        console.log(`📂 ${status.files.length} files still have uncommitted changes`);
      }

      // Show latest commits
      console.log('\n📚 Recent commits:');
      const history = await gitService.getHistory(3);
      history.forEach(commit => {
        const date = commit.date.toLocaleDateString();
        const wordInfo = commit.wordCount ? ` (${commit.wordCount.toLocaleString()} words)` : '';
        console.log(`  ${commit.hash.substring(0, 7)} ${date} - ${commit.message}${wordInfo}`);
      });

    } catch (error) {
      console.error('❌ Failed to commit changes:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};