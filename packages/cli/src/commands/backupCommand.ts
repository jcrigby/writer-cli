/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ManuscriptGitService } from 'writer-cli-core';
import { ProjectManager } from 'writer-cli-core';

interface BackupArgs {
  tag?: string;
  message?: string;
  restore?: string;
  list?: boolean;
  compare?: (string | number)[];
}

export const backupCommand: CommandModule<{}, BackupArgs> = {
  command: 'backup [tag]',
  describe: 'Create backups and restore previous versions of your manuscript',
  builder: (yargs) => {
    return yargs
      .positional('tag', {
        describe: 'Tag name for the backup (e.g., "draft-v1", "before-edit")',
        type: 'string'
      })
      .option('message', {
        describe: 'Backup message description',
        type: 'string',
        alias: 'm'
      })
      .option('restore', {
        describe: 'Restore from a specific backup tag',
        type: 'string',
        alias: 'r'
      })
      .option('list', {
        describe: 'List all available backups',
        type: 'boolean',
        default: false,
        alias: 'l'
      })
      .option('compare', {
        describe: 'Compare two backup versions (e.g., --compare tag1 tag2)',
        type: 'array',
        alias: 'c'
      })
      .example('$0 backup draft-v1', 'Create backup with tag "draft-v1"')
      .example('$0 backup --message "Before major revision"', 'Create backup with custom message')
      .example('$0 backup --restore draft-v1', 'Restore from backup tag')
      .example('$0 backup --list', 'List all backups')
      .example('$0 backup --compare draft-v1 draft-v2', 'Compare two backups');
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

      if (argv.list) {
        // List all backups (tags)
        console.log('💾 Available Backups:');
        console.log('====================');
        
        // Get all tags (this is a simplified version - in real implementation you'd list git tags)
        const history = await gitService.getHistory(50);
        const backups = history.filter(h => h.message.includes('Backup:') || h.message.includes('Draft:'));
        
        if (backups.length === 0) {
          console.log('No backups found. Create one with: writer backup <tag-name>');
          return;
        }

        backups.forEach(backup => {
          const date = backup.date.toLocaleDateString();
          const time = backup.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const wordInfo = backup.wordCount ? ` (${backup.wordCount.toLocaleString()} words)` : '';
          
          console.log(`📦 ${backup.hash.substring(0, 7)} - ${date} ${time}${wordInfo}`);
          console.log(`   ${backup.message}`);
        });
        return;
      }

      if (argv.restore) {
        // Restore from backup
        console.log(`🔄 Restoring from backup: ${argv.restore}`);
        console.log('⚠️  This will create a new branch with the restored content');
        
        await gitService.restoreFromBackup(argv.restore);
        console.log(`✅ Restored to branch: restore-${argv.restore}`);
        console.log('   Review the restored content and merge if satisfied');
        return;
      }

      if (argv.compare && argv.compare.length === 2) {
        // Compare two backup versions
        const [tag1, tag2] = argv.compare as [string, string];
        console.log(`🔍 Comparing ${tag1} → ${tag2}:`);
        
        const comparison = await gitService.compareVersions(tag1, tag2);
        
        console.log('\n📊 Changes:');
        console.log(`   Files changed: ${comparison.diff.filesChanged}`);
        console.log(`   Lines added: +${comparison.diff.insertions}`);
        console.log(`   Lines removed: -${comparison.diff.deletions}`);
        console.log(`   Net word change: ${comparison.diff.netWordChange > 0 ? '+' : ''}${comparison.diff.netWordChange.toLocaleString()}`);
        
        if (comparison.files.length > 0) {
          console.log('\n📄 Files modified:');
          comparison.files.forEach(file => {
            console.log(`   • ${file}`);
          });
        }
        return;
      }

      // Create backup
      const backupTag = argv.tag ? `draft-${argv.tag}` : undefined;
      const message = argv.message || (argv.tag ? `Draft backup: ${argv.tag}` : undefined);
      
      console.log('💾 Creating backup...');
      const tag = await gitService.backup(message);
      
      console.log(`✅ Backup created: ${tag}`);
      console.log(`   Use 'writer backup --restore ${tag}' to restore later`);
      
      // Show current status
      const status = await gitService.getStatus();
      if (status.files.length > 0) {
        console.log(`\n📝 ${status.files.length} files were included in the backup`);
      }

    } catch (error) {
      console.error('❌ Failed to create/restore backup:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};