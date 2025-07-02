/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ProjectManager } from 'writer-cli-core';

interface CharacterArgs {
  action?: 'create' | 'list' | 'update' | 'remove';
  name?: string;
  role?: string;
  description?: string;
}

export const characterCommand: CommandModule<{}, CharacterArgs> = {
  command: 'character <action> [name]',
  describe: 'Manage characters in your writing project',
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        choices: ['create', 'list', 'update', 'remove'] as const
      })
      .positional('name', {
        describe: 'Character name',
        type: 'string'
      })
      .option('role', {
        describe: 'Character role (protagonist, antagonist, supporting, etc.)',
        type: 'string'
      })
      .option('description', {
        describe: 'Character description',
        type: 'string'
      })
      .example('$0 character create "John Doe" --role protagonist', 'Create a new character')
      .example('$0 character list', 'List all characters')
      .example('$0 character update "John Doe" --description "A brave knight"', 'Update character');
  },
  handler: async (argv) => {
    try {
      const projectManager = new ProjectManager();
      
      if (!await projectManager.isProjectDirectory(process.cwd())) {
        console.error('❌ Not in a writing project directory. Run "claude init" first.');
        process.exit(1);
      }

      if (!argv.action) {
        console.error('❌ Action is required');
        process.exit(1);
      }

      switch (argv.action) {
        case 'create':
          if (!argv.name) {
            console.error('❌ Character name is required for "create" action');
            process.exit(1);
          }
          await projectManager.addCharacterToProject(process.cwd(), {
            name: argv.name,
            role: argv.role || 'supporting',
            description: argv.description || '',
            traits: [],
            backstory: ''
          });
          console.log(`✅ Created character: "${argv.name}" (${argv.role || 'supporting'})`);
          break;
          
        case 'list':
          const characters = await projectManager.listCharacters(process.cwd());
          if (characters.length === 0) {
            console.log('👥 No characters found. Create one with: claude character create "Name" --role protagonist');
          } else {
            console.log('👥 Characters:');
            characters.forEach(character => {
              console.log(`  • ${character.name} (${character.role})`);
              if (character.description) {
                console.log(`    ${character.description}`);
              }
            });
          }
          break;
          
        case 'update':
          if (!argv.name) {
            console.error('❌ Character name is required for "update" action');
            process.exit(1);
          }
          const updates: any = {};
          if (argv.role) updates.role = argv.role;
          if (argv.description) updates.description = argv.description;
          
          await projectManager.updateCharacter(process.cwd(), argv.name, updates);
          console.log(`✅ Updated character: "${argv.name}"`);
          break;
          
        case 'remove':
          if (!argv.name) {
            console.error('❌ Character name is required for "remove" action');
            process.exit(1);
          }
          await projectManager.removeCharacter(process.cwd(), argv.name);
          console.log(`✅ Removed character: "${argv.name}"`);
          break;
      }
      
    } catch (error) {
      console.error('❌ Character operation failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};