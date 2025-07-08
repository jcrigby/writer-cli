/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createInterface } from 'readline';

interface AuthArgs {
  token?: string;
  show?: boolean;
  remove?: boolean;
  test?: boolean;
}

export const authCommand: CommandModule<{}, AuthArgs> = {
  command: 'auth',
  describe: 'Manage GitHub authentication for Writer CLI',
  builder: (yargs) => {
    return yargs
      .option('token', {
        describe: 'Set GitHub personal access token',
        type: 'string',
        alias: 't'
      })
      .option('show', {
        describe: 'Show current authentication status',
        type: 'boolean',
        default: false,
        alias: 's'
      })
      .option('remove', {
        describe: 'Remove stored authentication',
        type: 'boolean',
        default: false,
        alias: 'r'
      })
      .option('test', {
        describe: 'Test GitHub authentication',
        type: 'boolean',
        default: false
      })
      .example('$0 auth', 'Interactive setup for GitHub token')
      .example('$0 auth --token ghp_xxxxx', 'Set token directly')
      .example('$0 auth --show', 'Show authentication status')
      .example('$0 auth --test', 'Test GitHub connection');
  },
  handler: async (argv) => {
    try {
      const writerConfigDir = path.join(os.homedir(), '.writer');
      const tokenFile = path.join(writerConfigDir, 'github-token');
      const envFile = path.join(process.cwd(), '.env');

      // Show current status
      if (argv.show) {
        console.log('🔐 Writer CLI Authentication Status');
        console.log('==================================');
        
        // Check environment variable
        const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        if (envToken) {
          console.log('✅ Token found in environment variable');
          console.log(`   Token: ${maskToken(envToken)}`);
        }

        // Check .writer config
        try {
          const storedToken = await fs.readFile(tokenFile, 'utf-8');
          console.log('✅ Token found in ~/.writer/github-token');
          console.log(`   Token: ${maskToken(storedToken.trim())}`);
        } catch {
          console.log('❌ No token in ~/.writer/github-token');
        }

        // Check local .env
        try {
          const envContent = await fs.readFile(envFile, 'utf-8');
          if (envContent.includes('GITHUB_TOKEN=')) {
            console.log('✅ Token found in local .env file');
          }
        } catch {
          // No .env file
        }

        return;
      }

      // Remove authentication
      if (argv.remove) {
        console.log('🗑️  Removing stored authentication...');
        
        try {
          await fs.unlink(tokenFile);
          console.log('✅ Removed token from ~/.writer/github-token');
        } catch {
          // File doesn't exist
        }

        console.log('\n⚠️  Note: This does not remove tokens from:');
        console.log('   - Environment variables (GITHUB_TOKEN)');
        console.log('   - Local .env files');
        console.log('   - Your shell configuration (.bashrc, .zshrc, etc.)');
        return;
      }

      // Test authentication
      if (argv.test) {
        const token = await getToken(tokenFile);
        if (!token) {
          console.error('❌ No GitHub token found');
          console.error('   Run: writer auth');
          process.exit(1);
        }

        console.log('🧪 Testing GitHub authentication...');
        
        try {
          const { fetch } = await import('undici');
          const response = await fetch('https://api.github.com/user', {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });

          if (response.ok) {
            const data = await response.json() as { login: string; name?: string };
            console.log('✅ Authentication successful!');
            console.log(`   Logged in as: ${data.login}${data.name ? ` (${data.name})` : ''}`);
          } else {
            console.error('❌ Authentication failed');
            console.error(`   Status: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error('❌ Failed to connect to GitHub');
          console.error(`   Error: ${error instanceof Error ? error.message : error}`);
        }
        return;
      }

      // Set token directly
      if (argv.token) {
        await saveToken(tokenFile, argv.token);
        console.log('✅ GitHub token saved successfully!');
        console.log('   Location: ~/.writer/github-token');
        return;
      }

      // Interactive setup
      console.log('🔐 Writer CLI GitHub Authentication Setup');
      console.log('========================================');
      console.log();
      console.log('To sync your manuscripts with GitHub, you need a personal access token.');
      console.log();
      console.log('📋 How to create a GitHub token:');
      console.log();
      console.log('1. Go to: https://github.com/settings/tokens/new');
      console.log('2. Give it a name: "Writer CLI" ');
      console.log('3. Select expiration (90 days recommended)');
      console.log('4. Select scopes:');
      console.log('   ✓ repo (Full control of private repositories)');
      console.log('   - OR if you only use public repos:');
      console.log('   ✓ public_repo (Access public repositories)');
      console.log('5. Click "Generate token"');
      console.log('6. Copy the token (starts with ghp_)');
      console.log();
      console.log('⚠️  IMPORTANT: You can only see the token once!');
      console.log();

      // Check if token exists in environment
      const existingToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
      if (existingToken) {
        console.log('📌 Note: Token already found in environment variable');
        console.log(`   Current token: ${maskToken(existingToken)}`);
        console.log();
      }

      const rl = createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const askQuestion = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
          rl.question(prompt, (answer) => {
            resolve(answer);
          });
        });
      };

      try {
        const token = await askQuestion('Paste your GitHub token (or press Enter to skip): ');
        
        if (!token.trim()) {
          console.log('\n📝 Skipping token setup. You can run this command again later.');
          rl.close();
          return;
        }

        // Validate token format
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
          console.error('\n❌ Invalid token format. GitHub tokens start with ghp_ or github_pat_');
          rl.close();
          process.exit(1);
        }

        // Save token
        await saveToken(tokenFile, token.trim());
        console.log('\n✅ Token saved to ~/.writer/github-token');

        // Ask about .env file
        const saveToEnv = await askQuestion('\nAlso save to local .env file? (y/N): ');
        
        if (saveToEnv.toLowerCase() === 'y') {
          await saveToEnvFile(envFile, token.trim());
          console.log('✅ Token saved to .env file');
          
          // Check .gitignore
          await ensureGitignore();
        }

        // Show shell configuration options
        console.log('\n📚 Additional Setup Options:');
        console.log('===========================');
        console.log();
        console.log('Option 1: Add to shell configuration (persistent across sessions)');
        console.log();
        console.log('Add this line to your ~/.bashrc or ~/.zshrc:');
        console.log(`export GITHUB_TOKEN="${maskToken(token.trim())}"`);
        console.log();
        console.log('Then reload: source ~/.bashrc');
        console.log();
        console.log('⚠️  Security Warnings:');
        console.log('   - Anyone with access to your account can read this');
        console.log('   - The token will be visible in shell history');
        console.log('   - Consider using Option 2 instead for better security');
        console.log();
        console.log('Option 2: Use Writer CLI secure storage (recommended)');
        console.log();
        console.log('✅ Already done! Token is stored in ~/.writer/github-token');
        console.log('   - Automatically loaded by Writer CLI');
        console.log('   - Not visible in shell history');
        console.log('   - Separate from shell configuration');
        console.log();
        console.log('Option 3: Per-session only (most secure)');
        console.log();
        console.log('Set temporarily for current session:');
        console.log(`export GITHUB_TOKEN="${maskToken(token.trim())}"`);
        console.log();
        console.log('📌 Token Priority Order:');
        console.log('1. Command line --token flag');
        console.log('2. GITHUB_TOKEN environment variable');
        console.log('3. ~/.writer/github-token file');
        console.log('4. .env file in project directory');
        console.log();
        console.log('🎉 Setup complete! You can now use:');
        console.log('   writer publish      - Create a new GitHub repo');
        console.log('   writer sync         - Sync with GitHub');
        console.log('   writer auth --test  - Test your authentication');

        rl.close();
      } catch (error) {
        rl.close();
        throw error;
      }

    } catch (error) {
      console.error('❌ Authentication setup failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};

function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return token.substring(0, 8) + '...' + token.substring(token.length - 4);
}

async function getToken(tokenFile: string): Promise<string | null> {
  // Check environment first
  const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (envToken) return envToken;

  // Check stored token
  try {
    const token = await fs.readFile(tokenFile, 'utf-8');
    return token.trim();
  } catch {
    // Check .env file
    try {
      const envContent = await fs.readFile(path.join(process.cwd(), '.env'), 'utf-8');
      const match = envContent.match(/GITHUB_TOKEN=(.+)/);
      if (match) return match[1].trim();
    } catch {
      // No .env file
    }
  }

  return null;
}

async function saveToken(tokenFile: string, token: string): Promise<void> {
  const dir = path.dirname(tokenFile);
  
  // Create directory if it doesn't exist
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  // Save token with restricted permissions
  await fs.writeFile(tokenFile, token, { mode: 0o600 });
}

async function saveToEnvFile(envFile: string, token: string): Promise<void> {
  let content = '';
  
  try {
    content = await fs.readFile(envFile, 'utf-8');
  } catch {
    // File doesn't exist, create new
  }

  // Check if GITHUB_TOKEN already exists
  if (content.includes('GITHUB_TOKEN=')) {
    // Replace existing
    content = content.replace(/GITHUB_TOKEN=.*/g, `GITHUB_TOKEN=${token}`);
  } else {
    // Add new
    content += (content && !content.endsWith('\n') ? '\n' : '') + `GITHUB_TOKEN=${token}\n`;
  }

  await fs.writeFile(envFile, content);
}

async function ensureGitignore(): Promise<void> {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let content = '';
  
  try {
    content = await fs.readFile(gitignorePath, 'utf-8');
  } catch {
    // File doesn't exist
  }

  // Check if .env is already ignored
  if (!content.includes('.env')) {
    content += (content && !content.endsWith('\n') ? '\n' : '') + '# Environment variables\n.env\n.env.local\n';
    await fs.writeFile(gitignorePath, content);
    console.log('✅ Added .env to .gitignore');
  }
}