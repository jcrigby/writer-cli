/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

export interface GitCommitInfo {
  hash: string;
  author: string;
  date: Date;
  message: string;
  wordCount?: number;
  chapterCount?: number;
}

export interface ManuscriptDiff {
  filesChanged: number;
  insertions: number;
  deletions: number;
  netWordChange: number;
}

export class ManuscriptGitService {
  private git: SimpleGit;
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.git = simpleGit(projectPath);
    
    // Set up authentication if GitHub token is available
    this.setupAuthentication();
  }

  private async setupAuthentication(): Promise<void> {
    const token = await this.getGitHubToken();
    if (token) {
      this.git.env({
        ...process.env,
        GIT_ASKPASS: 'echo',
        GIT_USERNAME: token,
        GIT_PASSWORD: token
      });
    }
  }

  private async getGitHubToken(): Promise<string | null> {
    // Check environment variables first
    const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (envToken) return envToken;

    // Check stored token file
    try {
      const tokenFile = path.join(os.homedir(), '.writer', 'github-token');
      const token = await readFile(tokenFile, 'utf-8');
      return token.trim();
    } catch {
      // Check .env file in project
      try {
        const envFile = path.join(this.projectPath, '.env');
        const envContent = await readFile(envFile, 'utf-8');
        const match = envContent.match(/GITHUB_TOKEN=(.+)/);
        if (match) return match[1].trim();
      } catch {
        // No .env file
      }
    }

    return null;
  }

  async initialize(): Promise<void> {
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      await this.git.init();
      await this.createGitignore();
      await this.git.add('.gitignore');
      await this.git.commit('Initial commit: Writer project setup');
    }
  }

  private async createGitignore(): Promise<void> {
    const gitignoreContent = `# Writer CLI
.writer/cache/
exports/*.tmp
*.backup.*
.DS_Store
node_modules/
*.log
.env
`;
    await writeFile(join(this.projectPath, '.gitignore'), gitignoreContent);
  }

  async commitChapter(
    chapterPath: string,
    message?: string
  ): Promise<string> {
    const wordCount = await this.getWordCount(chapterPath);
    const defaultMessage = `Update ${chapterPath} (${wordCount} words)`;
    
    await this.git.add(chapterPath);
    const result = await this.git.commit(message || defaultMessage);
    
    return result.commit;
  }

  async commitAll(message: string): Promise<string> {
    const status = await this.git.status();
    const totalWordCount = await this.getTotalWordCount();
    
    const enhancedMessage = `${message} (${totalWordCount} total words)`;
    
    await this.git.add('.');
    const result = await this.git.commit(enhancedMessage);
    
    return result.commit;
  }

  async createDraftTag(tagName: string, message?: string): Promise<void> {
    const totalWordCount = await this.getTotalWordCount();
    const defaultMessage = `Draft: ${tagName} (${totalWordCount} words)`;
    
    await this.git.addTag(tagName);
  }

  async branchChapter(chapterName: string): Promise<void> {
    const branchName = `chapter/${chapterName.toLowerCase().replace(/\s+/g, '-')}`;
    await this.git.checkoutLocalBranch(branchName);
  }

  async mergeChapter(chapterBranch: string): Promise<void> {
    await this.git.checkout('main');
    await this.git.merge([chapterBranch]);
  }

  async getStatus(): Promise<StatusResult> {
    return await this.git.status();
  }

  async getHistory(limit: number = 20): Promise<GitCommitInfo[]> {
    const log = await this.git.log(['-n', String(limit), '--oneline']);
    
    const commits: GitCommitInfo[] = [];
    for (const commit of log.all) {
      const wordCount = await this.extractWordCountFromMessage(commit.message);
      commits.push({
        hash: commit.hash,
        author: commit.author_name,
        date: new Date(commit.date),
        message: commit.message,
        wordCount,
      });
    }
    
    return commits;
  }

  async getChapterHistory(chapterPath: string): Promise<GitCommitInfo[]> {
    const log = await this.git.log(['--follow', '--', chapterPath]);
    
    return log.all.map(commit => ({
      hash: commit.hash,
      author: commit.author_name,
      date: new Date(commit.date),
      message: commit.message,
    }));
  }

  async getDiff(fromCommit?: string, toCommit?: string): Promise<ManuscriptDiff> {
    const args = ['--stat'];
    if (fromCommit) args.push(fromCommit);
    if (toCommit) args.push(toCommit);
    
    const diffStat = await this.git.diffSummary(args);
    
    // Calculate word changes (rough estimate)
    const netWordChange = Math.round((diffStat.insertions - diffStat.deletions) / 5);
    
    return {
      filesChanged: diffStat.files.length,
      insertions: diffStat.insertions,
      deletions: diffStat.deletions,
      netWordChange,
    };
  }

  async compareVersions(tag1: string, tag2: string): Promise<{
    diff: ManuscriptDiff;
    files: string[];
  }> {
    const diff = await this.getDiff(tag1, tag2);
    const files = await this.git.diff(['--name-only', tag1, tag2]);
    
    return {
      diff,
      files: files.split('\n').filter(f => f),
    };
  }

  async backup(message?: string): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupTag = `backup-${timestamp}`;
    
    await this.commitAll(message || `Backup: ${timestamp}`);
    await this.createDraftTag(backupTag);
    
    return backupTag;
  }

  async restoreFromBackup(tag: string): Promise<void> {
    await this.git.checkout(tag);
    await this.git.checkoutLocalBranch(`restore-${tag}`);
  }

  async stashWork(message?: string): Promise<void> {
    await this.git.stash(['push', '-m', message || 'Work in progress']);
  }

  async unstashWork(): Promise<void> {
    await this.git.stash(['pop']);
  }

  async getWordCountHistory(days: number = 30): Promise<Array<{
    date: string;
    wordCount: number;
    change: number;
  }>> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const log = await this.git.log([
      '--since=' + since.toISOString(),
      '--pretty=format:%h|%ai|%s',
    ]);
    
    const history: Array<{ date: string; wordCount: number; change: number }> = [];
    let previousCount = 0;
    
    for (const commit of [...log.all].reverse()) {
      const [hash, date, message] = commit.hash.split('|');
      const wordCount = await this.extractWordCountFromMessage(message) || 0;
      
      history.push({
        date: date.split(' ')[0],
        wordCount,
        change: wordCount - previousCount,
      });
      
      previousCount = wordCount;
    }
    
    return history;
  }

  private async getWordCount(filePath: string): Promise<number> {
    try {
      const content = await readFile(join(this.projectPath, filePath), 'utf-8');
      return content.split(/\s+/).filter(word => word.length > 0).length;
    } catch {
      return 0;
    }
  }

  private async getTotalWordCount(): Promise<number> {
    const status = await this.git.status();
    const files = status.files.map(f => f.path);
    
    let total = 0;
    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.fountain')) {
        total += await this.getWordCount(file);
      }
    }
    
    return total;
  }

  private async extractWordCountFromMessage(message: string): Promise<number | undefined> {
    const match = message.match(/\((\d+)\s+(?:total\s+)?words?\)/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  async visualizeProgress(): Promise<string> {
    const history = await this.getWordCountHistory(30);
    
    if (history.length === 0) {
      return 'No writing history found.';
    }
    
    const maxWords = Math.max(...history.map(h => h.wordCount));
    const scale = 50 / maxWords;
    
    let output = 'Writing Progress (Last 30 Days)\n';
    output += '='.repeat(60) + '\n';
    
    for (const entry of history) {
      const barLength = Math.round(entry.wordCount * scale);
      const bar = '█'.repeat(barLength);
      const change = entry.change > 0 ? `+${entry.change}` : `${entry.change}`;
      
      output += `${entry.date} ${bar} ${entry.wordCount} words (${change})\n`;
    }
    
    return output;
  }

  // Remote repository methods
  async hasRemote(): Promise<boolean> {
    const remotes = await this.git.getRemotes();
    return remotes.length > 0;
  }

  async addRemote(name: string, url: string): Promise<void> {
    await this.git.addRemote(name, url);
  }

  async pushToRemote(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    await this.git.push(remote, branch);
  }

  async pullFromRemote(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    await this.git.pull(remote, branch);
  }

  async getRemoteUrl(): Promise<string | null> {
    const remotes = await this.git.getRemotes(true);
    if (remotes.length > 0) {
      return remotes[0].refs.push || remotes[0].refs.fetch || null;
    }
    return null;
  }

  async configureGitHub(repoUrl: string, token?: string): Promise<void> {
    let authenticatedUrl = repoUrl;
    
    // If token provided, embed it in the URL
    if (token && repoUrl.startsWith('https://github.com/')) {
      authenticatedUrl = repoUrl.replace('https://github.com/', `https://${token}@github.com/`);
    }

    // Check if origin already exists
    const remotes = await this.git.getRemotes();
    const hasOrigin = remotes.some(r => r.name === 'origin');

    if (hasOrigin) {
      await this.git.remote(['set-url', 'origin', authenticatedUrl]);
    } else {
      await this.git.addRemote('origin', authenticatedUrl);
    }
  }
}