/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ManuscriptGitService } from 'writer-cli-core';
import { ProjectManager } from 'writer-cli-core';
import { simpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SyncArgs {
  push?: boolean;
  pull?: boolean;
  setup?: boolean;
  remote?: string;
  branch?: string;
  token?: string;
}

export const syncCommand: CommandModule<{}, SyncArgs> = {
  command: 'sync',
  describe: 'Sync your manuscript with GitHub or other Git remotes',
  builder: (yargs) => {
    return yargs
      .option('push', {
        describe: 'Push changes to remote repository',
        type: 'boolean',
        default: false
      })
      .option('pull', {
        describe: 'Pull changes from remote repository',
        type: 'boolean',
        default: false
      })
      .option('setup', {
        describe: 'Setup GitHub repository for the project',
        type: 'boolean',
        default: false
      })
      .option('remote', {
        describe: 'Remote repository URL (e.g., https://github.com/username/my-novel.git)',
        type: 'string'
      })
      .option('branch', {
        describe: 'Branch name',
        type: 'string',
        default: 'main'
      })
      .option('token', {
        describe: 'GitHub personal access token (or set GITHUB_TOKEN env var)',
        type: 'string'
      })
      .example('$0 sync --setup --remote https://github.com/user/my-novel.git', 'Setup GitHub remote')
      .example('$0 sync --push', 'Push changes to GitHub')
      .example('$0 sync --pull', 'Pull latest changes from GitHub')
      .example('$0 sync', 'Push and pull (full sync)');
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

      const git = simpleGit(process.cwd());
      const gitService = new ManuscriptGitService(process.cwd());
      await gitService.initialize();

      // Get GitHub token from args or environment
      const token = argv.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

      if (argv.setup) {
        // Setup GitHub remote
        if (!argv.remote) {
          console.error('❌ Please provide a remote repository URL with --remote');
          console.error('   Example: writer sync --setup --remote https://github.com/username/my-novel.git');
          process.exit(1);
        }

        console.log('🔧 Setting up GitHub remote...');

        // Configure remote with authentication if token is provided
        let remoteUrl = argv.remote;
        if (token && remoteUrl.startsWith('https://github.com/')) {
          // Insert token into URL for authentication
          remoteUrl = remoteUrl.replace('https://github.com/', `https://${token}@github.com/`);
        }

        // Check if remote already exists
        const remotes = await git.getRemotes();
        const existingRemote = remotes.find(r => r.name === 'origin');

        if (existingRemote) {
          console.log('🔄 Updating existing remote...');
          await git.remote(['set-url', 'origin', remoteUrl]);
        } else {
          console.log('➕ Adding new remote...');
          await git.addRemote('origin', remoteUrl);
        }

        // Create .env file if token was provided
        if (token && argv.token) {
          const envPath = path.join(process.cwd(), '.env');
          let envContent = '';
          
          try {
            envContent = await fs.readFile(envPath, 'utf-8');
          } catch {
            // File doesn't exist, that's okay
          }

          if (!envContent.includes('GITHUB_TOKEN=')) {
            envContent += (envContent ? '\n' : '') + `GITHUB_TOKEN=${token}\n`;
            await fs.writeFile(envPath, envContent);
            console.log('💾 Saved GitHub token to .env file');
          }
        }

        console.log('✅ GitHub remote configured successfully!');
        console.log('   You can now use: writer sync --push');
        return;
      }

      // Check if we have a remote configured
      const remotes = await git.getRemotes();
      if (remotes.length === 0) {
        console.error('❌ No remote repository configured');
        console.error('   Setup a remote with: writer sync --setup --remote <url>');
        process.exit(1);
      }

      // If no specific action, do both push and pull
      const doPush = argv.push || (!argv.push && !argv.pull);
      const doPull = argv.pull || (!argv.push && !argv.pull);

      if (doPull) {
        console.log('⬇️  Pulling changes from GitHub...');
        
        try {
          // Stash any uncommitted changes
          const status = await git.status();
          const hasChanges = status.files.length > 0;
          
          if (hasChanges) {
            console.log('📦 Stashing local changes...');
            await git.stash(['push', '-m', 'Writer CLI: Auto-stash before pull']);
          }

          // Pull changes
          await git.pull('origin', argv.branch || 'main');
          console.log('✅ Successfully pulled latest changes');

          // Restore stashed changes if any
          if (hasChanges) {
            console.log('📦 Restoring local changes...');
            await git.stash(['pop']);
          }
        } catch (error: any) {
          if (error.message.includes('no tracking information')) {
            console.log('🔗 Setting up tracking for branch...');
            await git.branch(['--set-upstream-to', `origin/${argv.branch || 'main'}`, argv.branch || 'main']);
            await git.pull('origin', argv.branch || 'main');
            console.log('✅ Successfully pulled latest changes');
          } else {
            throw error;
          }
        }
      }

      if (doPush) {
        console.log('⬆️  Pushing changes to GitHub...');

        // Check if we have commits to push
        const status = await git.status();
        
        // Commit any uncommitted changes first
        if (status.files.length > 0) {
          console.log('📝 Committing local changes...');
          await gitService.commitAll('Auto-commit before sync');
        }

        try {
          // Push changes
          await git.push('origin', argv.branch || 'main');
          console.log('✅ Successfully pushed changes to GitHub');
        } catch (error: any) {
          if (error.message.includes('no upstream branch')) {
            console.log('🔗 Creating remote branch...');
            await git.push('origin', argv.branch || 'main', ['--set-upstream']);
            console.log('✅ Successfully pushed changes to GitHub');
          } else if (error.message.includes('authentication') || error.message.includes('401')) {
            console.error('❌ Authentication failed. Please check your GitHub token.');
            console.error('   Set token with: export GITHUB_TOKEN=your-token');
            console.error('   Or use: writer sync --token your-token');
            console.error('   Create a token at: https://github.com/settings/tokens');
            process.exit(1);
          } else {
            throw error;
          }
        }

        // Show GitHub URL
        const remotesWithRefs = await git.getRemotes(true);
        if (remotesWithRefs.length > 0) {
          const remoteUrl = remotesWithRefs[0].refs.push || remotesWithRefs[0].refs.fetch || '';
          const cleanUrl = remoteUrl.replace(/https:\/\/[^@]+@/, 'https://');
          if (cleanUrl.includes('github.com')) {
            console.log(`\n🌐 View on GitHub: ${cleanUrl}`);
          }
        }
      }

      // Show sync status
      const finalStatus = await git.status();
      console.log('\n📊 Sync Status:');
      console.log(`   Branch: ${finalStatus.current}`);
      console.log(`   Clean: ${finalStatus.files.length === 0 ? '✅ Yes' : `❌ No (${finalStatus.files.length} uncommitted files)`}`);
      console.log(`   Ahead: ${finalStatus.ahead} commits`);
      console.log(`   Behind: ${finalStatus.behind} commits`);

    } catch (error) {
      console.error('❌ Sync failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};