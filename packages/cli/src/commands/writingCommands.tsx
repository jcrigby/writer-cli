/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { WritingCommandsService, ProjectManager } from 'writer-cli-core';

export interface CommandContext {
  writingService: WritingCommandsService;
  projectManager: ProjectManager;
}

export const WriteCommand = ({ 
  instruction, 
  file, 
  context 
}: { 
  instruction: string; 
  file?: string; 
  context: CommandContext;
}) => {
  const [content, setContent] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function generate() {
      try {
        const result = await context.writingService.writeCommand(instruction, file, { stream: true });
        
        if (typeof result === 'string') {
          setContent(result);
          setIsLoading(false);
        } else {
          // Handle streaming
          for await (const chunk of result) {
            setContent(prev => prev + chunk);
          }
          setIsLoading(false);
        }
      } catch (error) {
        setContent(`Error: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoading(false);
      }
    }
    
    generate();
  }, [instruction, file, context]);

  return (
    <Box flexDirection="column">
      {isLoading && (
        <Box>
          <Spinner type="dots" />
          <Text> Writing...</Text>
        </Box>
      )}
      <Text>{content}</Text>
    </Box>
  );
};

export const InitCommand = async ({ 
  type, 
  title, 
  author,
  context 
}: { 
  type: string; 
  title: string;
  author?: string;
  context: CommandContext;
}) => {
  await context.projectManager.initProject({
    title,
    author: author || 'Unknown Author',
    type: type as any,
  });

  return (
    <Box flexDirection="column">
      <Text color="green">✓ Created {type} project: {title}</Text>
      <Text>  Project structure initialized in .writer/</Text>
      <Text>  Run 'writer chapter add "Chapter 1"' to create your first chapter</Text>
    </Box>
  );
};

export const ChapterCommand = async ({
  action,
  title,
  number,
  context
}: {
  action: 'add' | 'list';
  title?: string;
  number?: number;
  context: CommandContext;
}) => {
  if (action === 'add' && title) {
    const chapterPath = await context.projectManager.createChapter(title, number);
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Created chapter: {title}</Text>
        <Text>  File: {chapterPath}</Text>
      </Box>
    );
  }

  if (action === 'list') {
    const chapters = await context.projectManager.listChapters();
    return (
      <Box flexDirection="column">
        <Text bold underline>Chapters</Text>
        {chapters.length === 0 ? (
          <Text color="gray">No chapters yet. Create one with 'writer chapter add "Title"'</Text>
        ) : (
          chapters.map((chapter, i) => (
            <Text key={i}>  {i + 1}. {chapter}</Text>
          ))
        )}
      </Box>
    );
  }

  return <Text color="red">Invalid chapter command</Text>;
};

export const CharacterCommand = async ({
  action,
  name,
  role,
  description,
  context
}: {
  action: 'create' | 'list' | 'develop';
  name?: string;
  role?: string;
  description?: string;
  context: CommandContext;
}) => {
  if (action === 'create' && name) {
    await context.projectManager.addCharacter(name, role, description);
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Created character: {name}</Text>
        {role && <Text>  Role: {role}</Text>}
      </Box>
    );
  }

  // TODO: Implement list and develop actions
  return <Text>Character {action} not yet implemented</Text>;
};

export const StatusCommand = async ({ context }: { context: CommandContext }) => {
  const project = await context.projectManager.loadProject();
  const stats = await context.projectManager.getProjectStats();

  if (!project) {
    return <Text color="red">No project found. Run 'writer init' to create one.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold underline>{project.title}</Text>
      <Text>Type: {project.type}</Text>
      <Text>Author: {project.author}</Text>
      <Text>Characters: {project.characters.length}</Text>
      <Text>Locations: {project.locations.length}</Text>
      <Text> </Text>
      <Text bold>Statistics</Text>
      <Text>Last modified: {new Date(stats.lastModified).toLocaleDateString()}</Text>
    </Box>
  );
};

export const ReviseCommand = ({ 
  file, 
  instruction,
  tone,
  context 
}: { 
  file: string;
  instruction: string;
  tone?: string;
  context: CommandContext;
}) => {
  const [content, setContent] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function revise() {
      try {
        const result = await context.writingService.reviseCommand(file, instruction, { tone });
        
        if (typeof result === 'string') {
          setContent(result);
          setIsLoading(false);
        } else {
          // Handle streaming
          for await (const chunk of result) {
            setContent(prev => prev + chunk);
          }
          setIsLoading(false);
        }
      } catch (error) {
        setContent(`Error: ${error instanceof Error ? error.message : String(error)}`);
        setIsLoading(false);
      }
    }
    
    revise();
  }, [file, instruction, tone, context]);

  return (
    <Box flexDirection="column">
      {isLoading && (
        <Box>
          <Spinner type="dots" />
          <Text> Revising {file}...</Text>
        </Box>
      )}
      <Text>{content}</Text>
    </Box>
  );
};