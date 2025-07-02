/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { ManuscriptGitService } from 'writer-cli-core';
import { Box, Text } from 'ink';
import React from 'react';

export interface GitCommandProps {
  gitService: ManuscriptGitService;
}

export const CommitCommand = async (
  args: { message?: string; all?: boolean },
  gitService: ManuscriptGitService
): Promise<string> => {
  if (args.all) {
    const commitHash = await gitService.commitAll(args.message || 'Update manuscript');
    return `Committed all changes: ${commitHash}`;
  } else {
    const status = await gitService.getStatus();
    if (status.files.length === 0) {
      return 'No changes to commit';
    }
    
    // Commit only staged files
    const commitHash = await gitService.commitAll(args.message || 'Update manuscript');
    return `Created commit: ${commitHash}`;
  }
};

export const BackupCommand = async (
  args: { tag?: string; message?: string },
  gitService: ManuscriptGitService
): Promise<string> => {
  const backupTag = await gitService.backup(args.message);
  return `Created backup: ${backupTag}`;
};

export const StatusCommand = async (
  gitService: ManuscriptGitService
): Promise<React.ReactElement> => {
  const status = await gitService.getStatus();
  
  return (
    <Box flexDirection="column">
      <Text bold underline>Git Status</Text>
      <Text>Branch: {status.current || 'main'}</Text>
      
      {status.files.length > 0 && (
        <>
          <Text> </Text>
          <Text bold>Changed Files:</Text>
          {status.files.map((file, i) => (
            <Text key={i} color={getStatusColor(file.working_dir)}>
              {file.working_dir} {file.path}
            </Text>
          ))}
        </>
      )}
      
      {status.files.length === 0 && (
        <Text color="green">✓ Working directory clean</Text>
      )}
    </Box>
  );
};

export const HistoryCommand = async (
  args: { limit?: number; wordCount?: boolean },
  gitService: ManuscriptGitService
): Promise<React.ReactElement> => {
  const history = await gitService.getHistory(args.limit || 10);
  
  return (
    <Box flexDirection="column">
      <Text bold underline>Commit History</Text>
      {history.map((commit, i) => (
        <Box key={i} marginTop={i > 0 ? 1 : 0}>
          <Text color="yellow">{commit.hash.substring(0, 7)}</Text>
          <Text> - </Text>
          <Text>{commit.message}</Text>
          {args.wordCount && commit.wordCount && (
            <Text color="gray"> ({commit.wordCount} words)</Text>
          )}
        </Box>
      ))}
    </Box>
  );
};

export const BranchCommand = async (
  args: { name: string; chapter?: boolean },
  gitService: ManuscriptGitService
): Promise<string> => {
  if (args.chapter) {
    await gitService.branchChapter(args.name);
    return `Created and switched to chapter branch: chapter/${args.name.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  // For now, just use chapter branching
  await gitService.branchChapter(args.name);
  return `Created and switched to branch: ${args.name}`;
};

export const TagCommand = async (
  args: { name: string; message?: string },
  gitService: ManuscriptGitService
): Promise<string> => {
  await gitService.createDraftTag(args.name, args.message);
  return `Created tag: ${args.name}`;
};

export const ProgressCommand = async (
  gitService: ManuscriptGitService
): Promise<string> => {
  return await gitService.visualizeProgress();
};

export const DiffCommand = async (
  args: { from?: string; to?: string },
  gitService: ManuscriptGitService
): Promise<React.ReactElement> => {
  const diff = await gitService.getDiff(args.from, args.to);
  
  return (
    <Box flexDirection="column">
      <Text bold underline>Manuscript Changes</Text>
      <Text>Files changed: {diff.filesChanged}</Text>
      <Text color="green">Words added: ~{Math.round(diff.insertions / 5)}</Text>
      <Text color="red">Words removed: ~{Math.round(diff.deletions / 5)}</Text>
      <Text bold>Net change: {diff.netWordChange > 0 ? '+' : ''}{diff.netWordChange} words</Text>
    </Box>
  );
};

export const RestoreCommand = async (
  args: { tag: string },
  gitService: ManuscriptGitService
): Promise<string> => {
  await gitService.restoreFromBackup(args.tag);
  return `Restored from backup: ${args.tag} (on new branch: restore-${args.tag})`;
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'M': return 'yellow';  // Modified
    case 'A': return 'green';   // Added
    case 'D': return 'red';     // Deleted
    case '?': return 'gray';    // Untracked
    default: return 'white';
  }
}