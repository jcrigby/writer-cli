/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import { CommandModule } from 'yargs';
import { ProjectManager } from 'writer-cli-core';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { createInterface } from 'readline';
import * as mammoth from 'mammoth';

interface ImportArgs {
  source?: string;
  type?: string;
  chapters?: boolean;
  organize?: boolean;
  preserve?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

interface ImportableFile {
  path: string;
  name: string;
  size: number;
  type: 'document' | 'text' | 'screenplay' | 'unknown';
  wordCount?: number;
  preview?: string;
}

export const importCommand: CommandModule<{}, ImportArgs> = {
  command: 'import [source]',
  describe: 'Import existing manuscripts and documents into Writer CLI project',
  builder: (yargs) => {
    return yargs
      .positional('source', {
        describe: 'Source directory or file to import from',
        type: 'string',
        default: '.'
      })
      .option('type', {
        describe: 'Type of import to perform',
        choices: ['auto', 'folder', 'docx', 'txt', 'md', 'fountain', 'scrivener'],
        default: 'auto',
        alias: 't'
      })
      .option('chapters', {
        describe: 'Organize imported files as chapters',
        type: 'boolean',
        default: true,
        alias: 'c'
      })
      .option('organize', {
        describe: 'Auto-organize files by type and content',
        type: 'boolean',
        default: true,
        alias: 'o'
      })
      .option('preserve', {
        describe: 'Preserve original file structure',
        type: 'boolean',
        default: false,
        alias: 'p'
      })
      .option('dry-run', {
        describe: 'Show what would be imported without doing it',
        type: 'boolean',
        default: false,
        alias: 'd'
      })
      .option('force', {
        describe: 'Overwrite existing files without asking',
        type: 'boolean',
        default: false,
        alias: 'f'
      })
      .example('$0 import', 'Scan current directory for importable files')
      .example('$0 import ~/Documents/MyNovel', 'Import from specific directory')
      .example('$0 import manuscript.docx --type docx', 'Import specific DOCX file')
      .example('$0 import --dry-run', 'Preview what would be imported');
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

      const sourcePath = path.resolve(argv.source || '.');
      
      console.log('📥 Writer CLI Import Tool');
      console.log('========================');
      console.log(`Source: ${sourcePath}`);
      console.log(`Type: ${argv.type}`);
      console.log(argv.dryRun ? '🔍 DRY RUN - No files will be modified' : '');
      console.log();

      // Discover importable files
      console.log('🔍 Scanning for importable files...');
      const files = await discoverFiles(sourcePath, argv.type as string);
      
      if (files.length === 0) {
        console.log('❌ No importable files found');
        console.log('\n💡 Supported formats:');
        console.log('   📄 .docx (Word documents)');
        console.log('   📝 .txt (Plain text)');
        console.log('   📖 .md (Markdown)');
        console.log('   🎬 .fountain (Screenplays)');
        console.log('   📁 Folders with multiple text files');
        return;
      }

      // Show discovered files
      console.log(`\n📋 Found ${files.length} importable files:`);
      console.log('─'.repeat(80));
      
      let totalWords = 0;
      for (const [index, file] of files.entries()) {
        const wordCount = file.wordCount || 0;
        totalWords += wordCount;
        const icon = getFileIcon(file.type);
        const sizeKB = Math.round(file.size / 1024);
        
        console.log(`${index + 1}. ${icon} ${file.name}`);
        console.log(`   Path: ${file.path}`);
        console.log(`   Size: ${sizeKB}KB | Words: ${wordCount.toLocaleString()} | Type: ${file.type}`);
        
        if (file.preview) {
          console.log(`   Preview: ${file.preview}...`);
        }
        console.log();
      }
      
      console.log(`📊 Total: ${files.length} files, ${totalWords.toLocaleString()} words`);

      // Ask for confirmation if not dry run
      if (!argv.dryRun) {
        const confirmed = await askConfirmation('\nProceed with import? (y/N): ');
        if (!confirmed) {
          console.log('❌ Import cancelled');
          return;
        }
      }

      // Perform import
      console.log('\n📥 Importing files...');
      
      for (const [index, file] of files.entries()) {
        if (argv.dryRun) {
          console.log(`${index + 1}/${files.length} Would import: ${file.name}`);
          continue;
        }

        console.log(`${index + 1}/${files.length} Importing: ${file.name}`);
        
        try {
          await importFile(file, {
            organize: argv.organize || false,
            chapters: argv.chapters || false,
            preserve: argv.preserve || false,
            force: argv.force || false
          });
          
          console.log(`   ✅ Success`);
        } catch (error) {
          console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}`);
        }
      }

      if (!argv.dryRun) {
        console.log('\n🎉 Import complete!');
        console.log('\n💡 Next steps:');
        console.log('   writer status              - Check project status');
        console.log('   writer chapter list        - View imported chapters');
        console.log('   writer commit "Import existing manuscripts" - Save changes');
      }

    } catch (error) {
      console.error('❌ Import failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
};

async function discoverFiles(sourcePath: string, type: string): Promise<ImportableFile[]> {
  const files: ImportableFile[] = [];
  
  try {
    const stats = await fs.stat(sourcePath);
    
    if (stats.isFile()) {
      // Single file import
      const file = await analyzeFile(sourcePath);
      if (file) files.push(file);
    } else if (stats.isDirectory()) {
      // Directory import
      let patterns: string[] = [];
      
      switch (type) {
        case 'docx':
          patterns = ['**/*.docx'];
          break;
        case 'txt':
          patterns = ['**/*.txt'];
          break;
        case 'md':
          patterns = ['**/*.md', '**/*.markdown'];
          break;
        case 'fountain':
          patterns = ['**/*.fountain', '**/*.spmd'];
          break;
        case 'scrivener':
          patterns = ['**/*.scriv/**/*.rtf', '**/*.scriv/**/*.txt', '**/*.scriv/**/*.md'];
          break;
        case 'auto':
        default:
          patterns = [
            '**/*.docx',
            '**/*.txt',
            '**/*.md',
            '**/*.markdown',
            '**/*.fountain',
            '**/*.spmd'
          ];
          break;
      }
      
      for (const pattern of patterns) {
        const matches = await glob(pattern, { 
          cwd: sourcePath,
          ignore: ['**/node_modules/**', '**/.git/**', '**/.writer/**']
        });
        
        for (const match of matches) {
          const fullPath = path.join(sourcePath, match);
          const file = await analyzeFile(fullPath);
          if (file) files.push(file);
        }
      }
    }
  } catch (error) {
    throw new Error(`Cannot access source: ${error instanceof Error ? error.message : error}`);
  }
  
  // Sort by name for consistent ordering
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

async function analyzeFile(filePath: string): Promise<ImportableFile | null> {
  try {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    
    // Skip very small files (likely not content)
    if (stats.size < 100) return null;
    
    let type: ImportableFile['type'] = 'unknown';
    let wordCount = 0;
    let preview = '';
    
    // Determine file type and extract preview
    if (ext === '.docx') {
      type = 'document';
      try {
        const buffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        wordCount = countWords(text);
        preview = text.substring(0, 100).replace(/\n/g, ' ').trim();
      } catch {
        // Fallback if DOCX can't be read
        wordCount = Math.round(stats.size / 6);
        preview = 'DOCX document - could not preview content';
      }
    } else if (['.txt', '.md', '.markdown'].includes(ext)) {
      type = 'text';
      const content = await fs.readFile(filePath, 'utf-8');
      wordCount = countWords(content);
      preview = content.substring(0, 100).replace(/\n/g, ' ').trim();
    } else if (['.fountain', '.spmd'].includes(ext)) {
      type = 'screenplay';
      const content = await fs.readFile(filePath, 'utf-8');
      wordCount = countWords(content);
      preview = content.substring(0, 100).replace(/\n/g, ' ').trim();
    }
    
    return {
      path: filePath,
      name,
      size: stats.size,
      type,
      wordCount,
      preview
    };
  } catch {
    return null;
  }
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function getFileIcon(type: ImportableFile['type']): string {
  switch (type) {
    case 'document': return '📄';
    case 'text': return '📝';
    case 'screenplay': return '🎬';
    default: return '📄';
  }
}

async function askConfirmation(prompt: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

interface ImportOptions {
  organize: boolean;
  chapters: boolean;
  preserve: boolean;
  force: boolean;
}

async function importFile(file: ImportableFile, options: ImportOptions): Promise<void> {
  let content = '';
  
  // Extract content based on file type
  if (file.type === 'document') {
    // Handle DOCX files
    const buffer = await fs.readFile(file.path);
    const result = await mammoth.convertToHtml({ buffer });
    content = htmlToMarkdown(result.value);
    
    if (result.messages.length > 0) {
      console.log(`   ⚠️  DOCX conversion warnings: ${result.messages.length} issues`);
    }
  } else {
    content = await fs.readFile(file.path, 'utf-8');
  }
  
  // Determine target path
  let targetPath: string;
  
  if (options.preserve) {
    // Keep original structure
    const relativePath = path.relative(process.cwd(), file.path);
    targetPath = path.join(process.cwd(), relativePath);
  } else if (options.chapters) {
    // Organize as chapters
    const chapterNumber = await getNextChapterNumber();
    const chapterName = sanitizeFilename(path.basename(file.name, path.extname(file.name)));
    targetPath = path.join(process.cwd(), 'chapters', `${String(chapterNumber).padStart(2, '0')}-${chapterName}.md`);
  } else {
    // Default organization
    const subdir = file.type === 'screenplay' ? 'scenes' : 
                   file.type === 'text' ? 'chapters' : 'imported';
    targetPath = path.join(process.cwd(), subdir, `${file.name}.md`);
  }
  
  // Ensure target directory exists
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  
  // Check if file exists
  if (!options.force) {
    try {
      await fs.access(targetPath);
      throw new Error(`File exists: ${path.basename(targetPath)} (use --force to overwrite)`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  
  // Convert content to markdown if needed
  let finalContent = content;
  if (path.extname(targetPath) === '.md' && !file.path.endsWith('.md')) {
    finalContent = convertToMarkdown(content, file.type);
  }
  
  // Write file
  await fs.writeFile(targetPath, finalContent, 'utf-8');
}

async function getNextChapterNumber(): Promise<number> {
  try {
    const chaptersDir = path.join(process.cwd(), 'chapters');
    const files = await fs.readdir(chaptersDir);
    const chapterNumbers = files
      .filter(f => f.match(/^\d+/))
      .map(f => parseInt(f.split('-')[0], 10))
      .filter(n => !isNaN(n));
    
    return chapterNumbers.length > 0 ? Math.max(...chapterNumbers) + 1 : 1;
  } catch {
    return 1;
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function htmlToMarkdown(html: string): string {
  return html
    // Headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n')
    
    // Text formatting
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    
    // Paragraphs and breaks
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    
    // Lists
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    
    // Clean up extra whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function convertToMarkdown(content: string, type: ImportableFile['type']): string {
  switch (type) {
    case 'screenplay':
      // Basic fountain to markdown conversion
      return content
        .replace(/^([A-Z\s]+):$/gm, '**$1:**') // Character names
        .replace(/^\s*FADE IN:/gm, '*FADE IN:*')
        .replace(/^\s*FADE OUT:/gm, '*FADE OUT:*');
    
    case 'text':
      // Add some basic markdown formatting
      return content
        .replace(/^(.+)$/gm, (match, line) => {
          // Convert lines that are all caps to headers (probably titles)
          if (line.trim().length > 0 && line === line.toUpperCase() && line.length < 100) {
            return `# ${line}`;
          }
          return line;
        });
    
    default:
      return content;
  }
}