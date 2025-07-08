#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple writer CLI that works with older Node versions
const command = process.argv[2];
const args = process.argv.slice(3);

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function init(title, type = 'novel', author = 'Unknown Author') {
  const projectDir = process.cwd();
  const writerDir = path.join(projectDir, '.writer');
  
  // Create directory structure
  await ensureDir(writerDir);
  await ensureDir(path.join(projectDir, 'chapters'));
  await ensureDir(path.join(projectDir, 'research'));
  await ensureDir(path.join(projectDir, 'drafts'));
  await ensureDir(path.join(projectDir, 'exports'));
  
  // Create config
  const config = {
    project: {
      title,
      author,
      type,
      targetWordCount: type === 'novel' ? 80000 : 20000,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    },
    structure: {
      chapterNaming: 'Chapter {number}: {title}',
      sceneBreaks: '***',
      fileExtension: '.md'
    },
    characters: [],
    locations: []
  };
  
  fs.writeFileSync(
    path.join(writerDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log(`✅ Initialized ${type} project: "${title}"`);
  console.log(`📁 Project structure created in ${projectDir}`);
  console.log(`📝 Author: ${author}`);
  console.log(`🎯 Target word count: ${config.project.targetWordCount.toLocaleString()}`);
  console.log('');
  console.log('Next steps:');
  console.log('  writer chapter add "Chapter 1: The Beginning"');
  console.log('  writer character create "Protagonist" --role main');
  console.log('  writer write --continue chapter1.md');
}

function parseInitArgs(args) {
  const title = args[0] || 'My Writing Project';
  let type = 'novel';
  let author = 'Unknown Author';
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--type' && args[i + 1]) {
      type = args[i + 1];
      i++;
    } else if (args[i] === '--author' && args[i + 1]) {
      author = args[i + 1];
      i++;
    }
  }
  
  return { title, type, author };
}

// Main command handler
switch (command) {
  case 'init':
    const { title, type, author } = parseInitArgs(args);
    init(title, type, author);
    break;
    
  case 'chapter':
    console.log('Chapter management not yet implemented in standalone mode');
    break;
    
  case 'character':
    console.log('Character management not yet implemented in standalone mode');
    break;
    
  case 'brainstorm':
    console.log('Brainstorming requires OpenRouter API integration');
    console.log('Set OPENROUTER_API_KEY environment variable');
    break;
    
  default:
    console.log('Writer CLI - A writing assistant powered by AI');
    console.log('');
    console.log('Usage: writer <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  init [title]           Initialize a new writing project');
    console.log('  chapter <action>       Manage chapters');
    console.log('  character <action>     Manage characters');
    console.log('  write [file]           AI-assisted writing');
    console.log('  revise <file>          AI-powered revision');
    console.log('  suggest [file]         Get writing suggestions');
    console.log('  brainstorm             Generate creative ideas');
    console.log('');
    console.log('Examples:');
    console.log('  writer init "My Novel" --type novel --author "Your Name"');
}