/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ManuscriptGitService } from 'writer-cli-core';
import { ProjectManager } from 'writer-cli-core';
import { simpleGit } from 'simple-git';
import { fetch } from 'undici';
import * as path from 'path';

interface PublishArgs {
  name?: string;
  description?: string;
  private?: boolean;
  token?: string;
  push?: boolean;
}

export const publishCommand: CommandModule<{}, PublishArgs> = {
  command: 'publish [name]',
  describe: 'Create a new GitHub repository and publish your manuscript',
  builder: (yargs) => {
    return yargs
      .positional('name', {
        describe: 'Repository name (defaults to project folder name)',
        type: 'string'
      })
      .option('description', {
        describe: 'Repository description',
        type: 'string',
        alias: 'd'
      })
      .option('private', {
        describe: 'Make repository private',
        type: 'boolean',
        default: true
      })
      .option('token', {
        describe: 'GitHub personal access token (or set GITHUB_TOKEN env var)',
        type: 'string'
      })
      .option('push', {
        describe: 'Push existing commits after creating repo',
        type: 'boolean',
        default: true
      })
      .example('$0 publish', 'Create GitHub repo with current folder name')
      .example('$0 publish my-novel --description "My first novel"', 'Create with custom name')
      .example('$0 publish --private false', 'Create public repository');
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

      // Get GitHub token
      const token = argv.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
      if (!token) {
        console.error('❌ GitHub token required');
        console.error('   Set token with: export GITHUB_TOKEN=your-token');
        console.error('   Or use: writer publish --token your-token');
        console.error('   Create a token at: https://github.com/settings/tokens');
        console.error('   Required scopes: repo (for private) or public_repo (for public)');
        process.exit(1);
      }

      const git = simpleGit(process.cwd());
      const gitService = new ManuscriptGitService(process.cwd());
      await gitService.initialize();

      // Load project info
      const project = await projectManager.loadProject();
      const projectTitle = project?.title || 'Untitled Project';
      const projectType = project?.type || 'manuscript';

      // Determine repository name
      const repoName = argv.name || path.basename(process.cwd()).toLowerCase().replace(/\s+/g, '-');
      const description = argv.description || `${projectTitle} - A ${projectType} project created with Writer CLI`;

      console.log('🚀 Creating GitHub repository...');
      console.log(`   Name: ${repoName}`);
      console.log(`   Description: ${description}`);
      console.log(`   Visibility: ${argv.private ? 'Private' : 'Public'}`);

      // Get current user info
      let username: string;
      try {
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!userResponse.ok) {
          throw new Error(`Failed to get user info: ${userResponse.statusText}`);
        }

        const userData = await userResponse.json() as { login: string };
        username = userData.login;
      } catch (error) {
        console.error('❌ Failed to authenticate with GitHub');
        console.error('   Please check your token has the required permissions');
        process.exit(1);
      }

      // Create repository
      try {
        const createResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repoName,
            description: description,
            private: argv.private,
            auto_init: false, // Don't initialize with README
            gitignore_template: 'Node',
            license_template: null
          })
        });

        if (!createResponse.ok) {
          const error = await createResponse.json() as { message: string; errors?: any[] };
          if (error.message.includes('already exists')) {
            console.error(`❌ Repository '${repoName}' already exists`);
            console.error('   Choose a different name with: writer publish <new-name>');
          } else {
            console.error('❌ Failed to create repository:', error.message);
            if (error.errors) {
              console.error('   Details:', JSON.stringify(error.errors, null, 2));
            }
          }
          process.exit(1);
        }

        const repoData = await createResponse.json() as { 
          html_url: string; 
          clone_url: string;
          ssh_url: string;
        };

        console.log('✅ Repository created successfully!');
        console.log(`   URL: ${repoData.html_url}`);

        // Configure remote
        const remoteUrl = repoData.clone_url.replace('https://github.com/', `https://${token}@github.com/`);
        
        // Check if remote already exists
        const remotes = await git.getRemotes();
        const hasOrigin = remotes.some(r => r.name === 'origin');

        if (hasOrigin) {
          console.log('🔄 Updating existing remote...');
          await git.remote(['set-url', 'origin', remoteUrl]);
        } else {
          console.log('🔗 Adding remote...');
          await git.addRemote('origin', remoteUrl);
        }

        // Create initial commit if needed
        const status = await git.status();
        const log = await git.log().catch(() => ({ all: [] }));
        
        if (log.all.length === 0) {
          console.log('📝 Creating initial commit...');
          
          // Ensure we have a .gitignore
          const gitignorePath = path.join(process.cwd(), '.gitignore');
          const fs = await import('fs/promises');
          try {
            await fs.access(gitignorePath);
          } catch {
            // Create a basic .gitignore
            const gitignoreContent = `# Writer CLI
.writer/cache/
.env
.env.local
node_modules/
*.log
.DS_Store
exports/*.tmp
*.backup.*
`;
            await fs.writeFile(gitignorePath, gitignoreContent);
            await git.add('.gitignore');
          }

          // Add all files and commit
          await git.add('.');
          await gitService.commitAll('Initial commit: Project setup');
        }

        // Push to GitHub if requested
        if (argv.push) {
          console.log('⬆️  Pushing to GitHub...');
          
          try {
            await git.push('origin', 'main', ['--set-upstream']);
            console.log('✅ Successfully pushed to GitHub!');
          } catch (pushError: any) {
            // Try 'master' branch if 'main' fails
            if (pushError.message.includes("src refspec main does not match")) {
              console.log('🔄 Trying master branch...');
              const currentBranch = status.current;
              if (currentBranch && currentBranch !== 'main' && currentBranch !== 'master') {
                await git.branch(['--move', currentBranch, 'main']);
              }
              await git.push('origin', 'main', ['--set-upstream']);
              console.log('✅ Successfully pushed to GitHub!');
            } else {
              throw pushError;
            }
          }
        }

        // Show next steps
        console.log('\n📚 Your manuscript is now on GitHub!');
        console.log('\n💡 Next steps:');
        console.log(`   Visit: ${repoData.html_url}`);
        console.log('   Daily backup: writer sync');
        console.log('   Share with beta readers: Invite them as collaborators');
        
        if (argv.private) {
          console.log('\n🔒 Note: Repository is private');
          console.log('   To make public later: Go to Settings → Change visibility');
        }

      } catch (error) {
        console.error('❌ Failed to create repository:', error instanceof Error ? error.message : error);
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Publish failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};