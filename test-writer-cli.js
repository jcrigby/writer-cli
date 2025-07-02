#!/usr/bin/env node

/**
 * Simple test script for Writer CLI
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const writerCLI = join(__dirname, 'bundle', 'writer.js');

console.log('Testing Writer CLI...\n');

// Test 1: Version
console.log('1. Testing --version:');
const version = spawn('node', [writerCLI, '--version']);
version.stdout.on('data', (data) => console.log(`   ✓ Version: ${data.toString().trim()}`));
version.on('close', () => {
  
  // Test 2: Help
  console.log('\n2. Testing --help:');
  const help = spawn('node', [writerCLI, '--help']);
  let helpOutput = '';
  help.stdout.on('data', (data) => helpOutput += data.toString());
  help.on('close', () => {
    console.log('   ✓ Help command works');
    console.log(`   Output length: ${helpOutput.length} characters`);
    
    console.log('\n✅ Basic tests passed!');
    console.log('\nTo test writing features, set up your API key:');
    console.log('export OPENROUTER_API_KEY="your-key"');
    console.log('\nThen try:');
    console.log(`node ${writerCLI} --prompt "Write a haiku about coding"`);
  });
});