/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ManuscriptGitService } from 'writer-cli-core';
import { ProjectManager } from 'writer-cli-core';

interface StatusArgs {
  verbose?: boolean;
  words?: boolean;
  progress?: boolean;
}

export const statusCommand: CommandModule<{}, StatusArgs> = {
  command: 'status',
  describe: 'Show project status, git state, and writing progress',
  builder: (yargs) => {
    return yargs
      .option('verbose', {
        describe: 'Show detailed file status',
        type: 'boolean',
        default: false,
        alias: 'v'
      })
      .option('words', {
        describe: 'Show word count statistics',
        type: 'boolean',
        default: false,
        alias: 'w'
      })
      .option('progress', {
        describe: 'Show progress toward writing goals',
        type: 'boolean',
        default: false,
        alias: 'p'
      })
      .example('$0 status', 'Show basic project status')
      .example('$0 status --verbose', 'Show detailed file status')
      .example('$0 status --words', 'Show word count statistics')
      .example('$0 status --progress', 'Show writing progress');
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

      // Load project configuration
      const project = await projectManager.loadProject();
      if (!project) {
        console.error('❌ Failed to load project configuration');
        process.exit(1);
      }

      const gitService = new ManuscriptGitService(process.cwd());
      await gitService.initialize();

      console.log('📋 Project Status');
      console.log('================');

      // Basic project info
      console.log(`\n📖 Project: ${project.title}`);
      console.log(`👤 Author: ${project.author}`);
      console.log(`📚 Type: ${project.type}`);

      // Git status
      console.log('\n🔄 Git Status:');
      const status = await gitService.getStatus();
      
      if (status.files.length === 0) {
        console.log('   ✅ Working directory clean');
      } else {
        console.log(`   📝 ${status.files.length} files with changes`);
        
        if (argv.verbose) {
          console.log('\n   Modified files:');
          status.files.forEach(file => {
            const statusIcon = file.index === 'M' ? '📝' : 
                             file.index === 'A' ? '➕' : 
                             file.index === 'D' ? '➖' : '❓';
            console.log(`     ${statusIcon} ${file.path}`);
          });
        }
      }

      // Recent commits
      console.log('\n📚 Recent Activity:');
      const history = await gitService.getHistory(3);
      
      if (history.length === 0) {
        console.log('   No commits yet');
      } else {
        history.forEach(commit => {
          const date = commit.date.toLocaleDateString();
          const wordInfo = commit.wordCount ? ` (${commit.wordCount.toLocaleString()} words)` : '';
          console.log(`   🔸 ${commit.hash.substring(0, 7)} ${date} - ${commit.message}${wordInfo}`);
        });
      }

      // Word count statistics
      if (argv.words || argv.progress) {
        console.log('\n📊 Writing Statistics:');
        
        // Get word count from latest commit
        const latestCommit = history[0];
        const currentWords = latestCommit?.wordCount || 0;
        const targetWords = project.settings.wordCountGoal || 0;
        
        console.log(`   Current word count: ${currentWords.toLocaleString()}`);
        if (targetWords > 0) {
          const progress = (currentWords / targetWords) * 100;
          const progressBar = '█'.repeat(Math.round(progress / 5)) + '░'.repeat(20 - Math.round(progress / 5));
          console.log(`   Target: ${targetWords.toLocaleString()} (${progress.toFixed(1)}%)`);
          console.log(`   Progress: [${progressBar}]`);
        }

        // Word count history
        if (argv.words) {
          const wordHistory = await gitService.getWordCountHistory(7);
          if (wordHistory.length > 1) {
            const recentChange = wordHistory[wordHistory.length - 1].change;
            const weeklyChange = wordHistory.reduce((sum, entry) => sum + entry.change, 0);
            
            console.log(`   Recent change: ${recentChange > 0 ? '+' : ''}${recentChange.toLocaleString()} words`);
            console.log(`   Weekly change: ${weeklyChange > 0 ? '+' : ''}${weeklyChange.toLocaleString()} words`);
          }
        }
      }

      // Characters and locations
      console.log('\n👥 Characters:');
      if (project.characters.length === 0) {
        console.log('   No characters defined');
      } else {
        project.characters.forEach(char => {
          console.log(`   • ${char}`);
        });
      }

      console.log('\n🏠 Locations:');
      if (project.locations.length === 0) {
        console.log('   No locations defined');
      } else {
        project.locations.forEach(loc => {
          console.log(`   • ${loc}`);
        });
      }

      // Quick action suggestions
      console.log('\n💡 Quick Actions:');
      if (status.files.length > 0) {
        console.log('   writer commit "Your commit message"  - Commit current changes');
      }
      console.log('   writer backup draft-name            - Create a backup');
      console.log('   writer history                      - View recent changes');
      console.log('   writer write                        - Continue writing');

    } catch (error) {
      console.error('❌ Failed to show status:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};