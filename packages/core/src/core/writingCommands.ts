/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenRouterClient, ModelConfig, WritingContext } from './openrouterClient.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export interface WritingProject {
  type: 'novel' | 'screenplay' | 'academic' | 'technical' | 'blog' | 'poetry';
  title: string;
  author: string;
  characters: string[];
  locations: string[];
  settings: ProjectSettings;
}

export interface ProjectSettings {
  tone?: string;
  style?: string;
  wordCountGoal?: number;
  chapterNaming?: string;
  fileExtension?: string;
}

export class WritingCommandsService {
  private client: OpenRouterClient;
  private project?: WritingProject;

  constructor(config: ModelConfig, project?: WritingProject) {
    this.client = new OpenRouterClient(config);
    this.project = project;
  }

  private getWritingContext(): WritingContext | undefined {
    if (!this.project) return undefined;

    return {
      projectType: this.project.type,
      characters: this.project.characters,
      locations: this.project.locations,
      tone: this.project.settings.tone,
      style: this.project.settings.style,
    };
  }

  async writeCommand(
    instruction: string,
    filePath?: string,
    options?: { continue?: boolean; stream?: boolean }
  ): Promise<string | AsyncIterable<string>> {
    let existingContent = '';
    
    if (filePath) {
      try {
        existingContent = await readFile(filePath, 'utf-8');
      } catch (error) {
        // File doesn't exist, that's okay
      }
    }

    const context = this.getWritingContext();
    
    if (options?.continue && existingContent) {
      return this.client.suggestCommand(existingContent, 'continue', context);
    } else {
      return this.client.writeCommand(instruction, existingContent, context);
    }
  }

  async reviseCommand(
    filePath: string,
    instruction: string,
    options?: { tone?: string; backup?: boolean }
  ): Promise<string | AsyncIterable<string>> {
    const content = await readFile(filePath, 'utf-8');
    
    if (options?.backup) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await writeFile(backupPath, content);
    }

    const context = this.getWritingContext();
    if (options?.tone) {
      context!.tone = options.tone;
    }

    return this.client.reviseCommand(content, instruction, context);
  }

  async suggestCommand(
    filePath: string,
    type: 'improve' | 'continue' | 'dialogue' | 'plot' | 'character'
  ): Promise<string | AsyncIterable<string>> {
    const content = await readFile(filePath, 'utf-8');
    const context = this.getWritingContext();

    return this.client.suggestCommand(content, type, context);
  }

  async brainstormCommand(
    topic: string,
    options?: { character?: string; situation?: string; location?: string }
  ): Promise<string | AsyncIterable<string>> {
    let enhancedTopic = topic;
    
    if (options?.character) {
      enhancedTopic += ` (focusing on character: ${options.character})`;
    }
    
    if (options?.situation) {
      enhancedTopic += ` in situation: ${options.situation}`;
    }
    
    if (options?.location) {
      enhancedTopic += ` at location: ${options.location}`;
    }

    const context = this.getWritingContext();
    return this.client.brainstormCommand(enhancedTopic, context);
  }

  async analyzeCommand(filePath: string, analysisType: 'structure' | 'character' | 'style' | 'pacing'): Promise<string> {
    const content = await readFile(filePath, 'utf-8');
    const context = this.getWritingContext();

    const analysisPrompts = {
      structure: 'Analyze the narrative structure, plot progression, and story organization of this content',
      character: 'Analyze character development, dialogue, and character consistency in this content',
      style: 'Analyze the writing style, voice, tone, and literary techniques used in this content',
      pacing: 'Analyze the pacing, rhythm, and flow of this content',
    };

    const prompt = `${analysisPrompts[analysisType]}:

${content}

Please provide a detailed analysis with specific examples and constructive feedback.`;

    const result = await this.client.generateText(prompt, context);
    return typeof result === 'string' ? result : '';
  }

  async exportCommand(
    inputPaths: string[],
    outputPath: string,
    format: 'markdown' | 'pdf' | 'docx' | 'html'
  ): Promise<void> {
    const contents = await Promise.all(
      inputPaths.map(async (path) => {
        const content = await readFile(path, 'utf-8');
        return { path, content };
      })
    );

    let combinedContent = '';
    
    if (format === 'markdown') {
      combinedContent = contents
        .map(({ path, content }) => `# ${path}\n\n${content}\n\n`)
        .join('---\n\n');
    } else if (format === 'html') {
      combinedContent = `<!DOCTYPE html>
<html>
<head>
    <title>${this.project?.title || 'Writing Project'}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { border-bottom: 2px solid #333; }
        .chapter { page-break-before: always; }
    </style>
</head>
<body>
${contents
  .map(({ path, content }) => `<div class="chapter"><h1>${path}</h1>${content.replace(/\n/g, '<br>')}</div>`)
  .join('\n')}
</body>
</html>`;
    } else {
      // For PDF and DOCX, we'll output markdown for now
      // In a full implementation, we'd use libraries like Puppeteer or docx
      combinedContent = contents
        .map(({ path, content }) => `# ${path}\n\n${content}\n\n`)
        .join('---\n\n');
    }

    await writeFile(outputPath, combinedContent);
  }

  updateProject(project: WritingProject): void {
    this.project = project;
  }
}