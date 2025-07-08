/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ManuscriptGitService } from 'writer-cli-core';
import { ProjectManager } from 'writer-cli-core';

interface HistoryArgs {
  limit?: number;
  chapter?: string;
  graph?: boolean;
  words?: boolean;
  stats?: boolean;
}

export const historyCommand: CommandModule<{}, HistoryArgs> = {
  command: 'history',
  describe: 'View manuscript version history and writing progress',
  builder: (yargs) => {
    return yargs
      .option('limit', {
        describe: 'Number of commits to show',
        type: 'number',
        default: 10,
        alias: 'n'
      })
      .option('chapter', {
        describe: 'Show history for a specific chapter',
        type: 'string',
        alias: 'c'
      })
      .option('graph', {
        describe: 'Show visual progress graph',
        type: 'boolean',
        default: false,
        alias: 'g'
      })
      .option('words', {
        describe: 'Show word count history',
        type: 'boolean',
        default: false,
        alias: 'w'
      })
      .option('stats', {
        describe: 'Show detailed statistics',
        type: 'boolean',
        default: false,
        alias: 's'
      })
      .example('$0 history', 'Show recent commits')
      .example('$0 history --chapter chapters/01-beginning.md', 'Show history for specific chapter')
      .example('$0 history --graph', 'Show visual progress graph')
      .example('$0 history --words --limit 30', 'Show word count changes over last 30 commits');
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

      console.log('📚 Manuscript History');
      console.log('===================');

      if (argv.graph) {
        // Show visual progress graph
        console.log('\n📊 Writing Progress:');
        const progress = await gitService.visualizeProgress();
        console.log(progress);
        return;
      }

      if (argv.words) {
        // Show word count history
        console.log('\n📈 Word Count History:');
        const wordHistory = await gitService.getWordCountHistory(argv.limit || 30);
        
        if (wordHistory.length === 0) {
          console.log('No word count history found.');
          return;
        }

        console.log('Date       | Words    | Change');
        console.log('-----------|----------|--------');
        
        wordHistory.forEach(entry => {
          const change = entry.change > 0 ? `+${entry.change}` : `${entry.change}`;
          const changeColor = entry.change > 0 ? '\x1b[32m' : entry.change < 0 ? '\x1b[31m' : '\x1b[33m';
          console.log(`${entry.date} | ${entry.wordCount.toLocaleString().padStart(8)} | ${changeColor}${change}\x1b[0m`);
        });
        return;
      }

      // Show commit history
      let history;
      if (argv.chapter) {
        console.log(`\n📄 Chapter: ${argv.chapter}`);
        history = await gitService.getChapterHistory(argv.chapter);
      } else {
        console.log(`\n📝 Project History (last ${argv.limit} commits):`);
        history = await gitService.getHistory(argv.limit || 10);
      }

      if (history.length === 0) {
        console.log('No commits found.');
        return;
      }

      history.forEach(commit => {
        const date = commit.date.toLocaleDateString();
        const time = commit.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const wordInfo = commit.wordCount ? ` (${commit.wordCount.toLocaleString()} words)` : '';
        
        console.log(`\n🔸 ${commit.hash.substring(0, 7)} - ${date} ${time}`);
        console.log(`   ${commit.message}${wordInfo}`);
        console.log(`   Author: ${commit.author}`);
      });

      if (argv.stats) {
        // Show additional statistics
        console.log('\n📊 Statistics:');
        const allHistory = await gitService.getHistory(1000);
        const totalCommits = allHistory.length;
        const wordCounts = allHistory.filter(h => h.wordCount).map(h => h.wordCount!);
        
        if (wordCounts.length > 0) {
          const currentWords = wordCounts[0] || 0;
          const firstWords = wordCounts[wordCounts.length - 1] || 0;
          const totalWordsAdded = currentWords - firstWords;
          
          console.log(`   Total commits: ${totalCommits}`);
          console.log(`   Current word count: ${currentWords.toLocaleString()}`);
          console.log(`   Total words added: ${totalWordsAdded.toLocaleString()}`);
          console.log(`   Average words per commit: ${Math.round(totalWordsAdded / totalCommits).toLocaleString()}`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to show history:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};