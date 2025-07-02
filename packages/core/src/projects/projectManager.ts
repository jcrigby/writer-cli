/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { WritingProject, ProjectSettings } from '../core/writingCommands.js';

export interface ProjectConfig {
  project: {
    title: string;
    author: string;
    type: 'novel' | 'screenplay' | 'academic' | 'technical' | 'blog' | 'poetry';
    genre?: string;
    targetWordCount?: number;
    created: string;
    lastModified: string;
  };
  structure: {
    chapterNaming: string;
    sceneBreaks: string;
    fileExtension: string;
  };
  characters: Array<{
    name: string;
    role?: string;
    description?: string;
    notes?: string;
  }>;
  locations: Array<{
    name: string;
    description?: string;
    notes?: string;
  }>;
  settings: ProjectSettings;
}

export class ProjectManager {
  private projectPath: string;
  private configPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.configPath = join(projectPath, '.writer', 'config.json');
  }

  async initProject(config: {
    title: string;
    author: string;
    type: 'novel' | 'screenplay' | 'academic' | 'technical' | 'blog' | 'poetry';
    genre?: string;
    targetWordCount?: number;
  }): Promise<void> {
    const projectConfig: ProjectConfig = {
      project: {
        title: config.title,
        author: config.author,
        type: config.type,
        genre: config.genre,
        targetWordCount: config.targetWordCount,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
      structure: this.getDefaultStructure(config.type),
      characters: [],
      locations: [],
      settings: this.getDefaultSettings(config.type),
    };

    await this.ensureDirectoryStructure(config.type);
    await this.saveConfig(projectConfig);
  }

  private getDefaultStructure(type: string): any {
    const structures = {
      novel: {
        chapterNaming: 'Chapter {number}: {title}',
        sceneBreaks: '***',
        fileExtension: '.md',
      },
      screenplay: {
        chapterNaming: 'Scene {number}',
        sceneBreaks: 'FADE IN:',
        fileExtension: '.fountain',
      },
      academic: {
        chapterNaming: '{number}. {title}',
        sceneBreaks: '---',
        fileExtension: '.md',
      },
      technical: {
        chapterNaming: '{title}',
        sceneBreaks: '---',
        fileExtension: '.md',
      },
      blog: {
        chapterNaming: '{title}',
        sceneBreaks: '---',
        fileExtension: '.md',
      },
      poetry: {
        chapterNaming: '{title}',
        sceneBreaks: '***',
        fileExtension: '.md',
      },
    };

    return (structures as any)[type] || structures.novel;
  }

  private getDefaultSettings(type: string): ProjectSettings {
    const settings = {
      novel: {
        tone: 'narrative',
        wordCountGoal: 80000,
      },
      screenplay: {
        tone: 'dramatic',
        wordCountGoal: 25000,
      },
      academic: {
        tone: 'formal',
        style: 'academic',
        wordCountGoal: 50000,
      },
      technical: {
        tone: 'clear',
        style: 'instructional',
        wordCountGoal: 30000,
      },
      blog: {
        tone: 'conversational',
        wordCountGoal: 2000,
      },
      poetry: {
        tone: 'lyrical',
        wordCountGoal: 5000,
      },
    };

    return (settings as any)[type] || settings.novel;
  }

  private async ensureDirectoryStructure(type: string): Promise<void> {
    const directories = ['.writer', 'chapters', 'research', 'drafts', 'exports'];
    
    if (type === 'screenplay') {
      directories.push('scenes', 'treatments');
    }

    for (const dir of directories) {
      const dirPath = join(this.projectPath, dir);
      try {
        await access(dirPath);
      } catch {
        await mkdir(dirPath, { recursive: true });
      }
    }
  }

  async loadProject(): Promise<WritingProject | null> {
    try {
      const configData = await readFile(this.configPath, 'utf-8');
      const config: ProjectConfig = JSON.parse(configData);

      return {
        type: config.project.type,
        title: config.project.title,
        author: config.project.author,
        characters: config.characters.map(c => c.name),
        locations: config.locations.map(l => l.name),
        settings: config.settings,
      };
    } catch (error) {
      return null;
    }
  }

  async saveConfig(config: ProjectConfig): Promise<void> {
    const configDir = dirname(this.configPath);
    try {
      await access(configDir);
    } catch {
      await mkdir(configDir, { recursive: true });
    }

    config.project.lastModified = new Date().toISOString();
    await writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  async addCharacter(name: string, role?: string, description?: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config) throw new Error('No project found');

    config.characters.push({ name, role, description });
    await this.saveConfig(config);
  }

  async addLocation(name: string, description?: string): Promise<void> {
    const config = await this.loadConfig();
    if (!config) throw new Error('No project found');

    config.locations.push({ name, description });
    await this.saveConfig(config);
  }

  async updateSettings(settings: Partial<ProjectSettings>): Promise<void> {
    const config = await this.loadConfig();
    if (!config) throw new Error('No project found');

    config.settings = { ...config.settings, ...settings };
    await this.saveConfig(config);
  }

  private async loadConfig(): Promise<ProjectConfig | null> {
    try {
      const configData = await readFile(this.configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      return null;
    }
  }

  async getProjectStats(): Promise<{
    totalFiles: number;
    totalWords: number;
    totalCharacters: number;
    lastModified: string;
  }> {
    const config = await this.loadConfig();
    if (!config) throw new Error('No project found');

    // This is a simplified implementation
    // In a full version, we'd scan all project files
    return {
      totalFiles: 0,
      totalWords: 0,
      totalCharacters: 0,
      lastModified: config.project.lastModified,
    };
  }

  async listChapters(): Promise<string[]> {
    // This would scan the chapters directory
    // For now, return empty array
    return [];
  }

  async createChapter(title: string, number?: number): Promise<string> {
    const config = await this.loadConfig();
    if (!config) throw new Error('No project found');

    const chapterName = config.structure.chapterNaming
      .replace('{number}', String(number || 1))
      .replace('{title}', title);

    const fileName = `${String(number || 1).padStart(2, '0')}-${title.toLowerCase().replace(/\s+/g, '-')}${config.structure.fileExtension}`;
    const filePath = join(this.projectPath, 'chapters', fileName);

    const template = this.getChapterTemplate(config.project.type, chapterName);
    await writeFile(filePath, template);

    return filePath;
  }

  private getChapterTemplate(type: string, title: string): string {
    const templates = {
      novel: `# ${title}

Write your chapter content here...
`,
      screenplay: `${title.toUpperCase()}

FADE IN:

`,
      academic: `# ${title}

## Introduction

Write your section content here...

## Conclusion

`,
      technical: `# ${title}

## Overview

Write your documentation here...

## Examples

`,
      blog: `# ${title}

Write your blog post here...
`,
      poetry: `# ${title}

Write your poem here...
`,
    };

    return (templates as any)[type] || templates.novel;
  }
}