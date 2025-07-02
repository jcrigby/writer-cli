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
    'outline',
    'research',
    'export',
    'status'
  ];
  
  return args.length > 0 && writerCommands.includes(args[0]);
}