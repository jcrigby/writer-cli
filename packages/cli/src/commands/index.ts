/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { initCommand } from './initCommand.js';
import { chapterCommand } from './chapterCommand.js';
import { characterCommand } from './characterCommand.js';
import { writeCommand } from './writeCommand.js';
import { reviseCommand } from './reviseCommand.js';
import { suggestCommand } from './suggestCommand.js';
import { brainstormCommand } from './brainstormCommand.js';
import { commitCommand } from './commitCommand.js';
import { historyCommand } from './historyCommand.js';
import { backupCommand } from './backupCommand.js';
import { statusCommand } from './statusCommand.js';
import { syncCommand } from './syncCommand.js';
import { publishCommand } from './publishCommand.js';

export interface WriterCliArgs {
  command?: string;
  [key: string]: any;
}

export async function parseWriterCommands(): Promise<WriterCliArgs> {
  const argv = await yargs(hideBin(process.argv))
    .scriptName('writer')
    .usage('$0 <command> [options]')
    .command(initCommand)
    .command(chapterCommand)
    .command(characterCommand)
    .command(writeCommand)
    .command(reviseCommand)
    .command(suggestCommand)
    .command(brainstormCommand)
    .command(commitCommand)
    .command(historyCommand)
    .command(backupCommand)
    .command(statusCommand)
    .command(syncCommand)
    .command(publishCommand)
    .demandCommand(1, 'You must specify a command')
    .help()
    .alias('h', 'help')
    .version()
    .alias('v', 'version')
    .parse();

  return argv as WriterCliArgs;
}

export function isWriterCommand(args: string[]): boolean {
  const writerCommands = [
    'init',
    'chapter',
    'character', 
    'write',
    'revise',
    'suggest',
    'brainstorm',
    'commit',
    'history',
    'backup',
    'status',
    'sync',
    'publish',
    'outline',
    'research',
    'export'
  ];
  
  return args.length > 0 && writerCommands.includes(args[0]);
}