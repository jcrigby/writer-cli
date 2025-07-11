/**
 * Usage Example: Complete LLM Export Import Workflow
 * 
 * Demonstrates the full pipeline from export file to organized writing projects
 * using dynamic model optimization and hybrid classification.
 */

import { recommendOptimalModel, confirmModelSelection } from './model-optimization.js';
import { ClassificationPipeline } from './classification-pipeline.js';

interface ExportFile {
  path: string;
  platform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
  conversations: ConversationData[];
}

interface ConversationData {
  id: string;
  title: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'human' | 'model';
    content: string;
    timestamp: string;
  }>;
  platform: 'chatgpt' | 'claude' | 'gemini' | 'perplexity';
}

/**
 * Main import workflow demonstrating the complete pipeline
 */
async function main() {
  console.log('🚀 LLM Export Importer - Dynamic Model Optimization Demo\n');

  // Example: Processing a large ChatGPT export
  const exportFile = './exports/chatgpt-export-2024.json';
  
  try {
    // Step 1: Parse the export file
    console.log('📂 Loading export file...');
    const exportData = await loadExportFile(exportFile);
    console.log(`   Found ${exportData.conversations.length} conversations from ${exportData.platform}\n`);

    // Step 2: Estimate processing requirements and find optimal model
    console.log('⚡ Optimizing model selection for cost and accuracy...');
    const estimatedTokens = estimateTokenCount(exportData.conversations);
    const recommendation = await recommendOptimalModel(estimatedTokens);
    
    // Step 3: Get user confirmation
    const confirmed = await confirmModelSelection(recommendation);
    if (!confirmed) {
      console.log('❌ Import cancelled by user');
      return;
    }

    // Step 4: Run classification pipeline with optimized model
    console.log(`🤖 Starting classification with ${recommendation.model}...\n`);
    const pipeline = new ClassificationPipeline(recommendation.model);
    const results = await pipeline.processConversations(exportData.conversations);

    // Step 5: Organize and export results
    console.log('📁 Organizing classified content...');
    const projects = await organizeIntoProjects(results, exportData.conversations);
    
    // Step 6: Generate outputs
    console.log('💾 Generating organized outputs...\n');
    await generateOutputs(projects, exportData.platform);
    
    // Step 7: Show final summary
    showFinalSummary(results, recommendation, projects);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

/**
 * Load and parse export file based on platform format
 */
async function loadExportFile(filePath: string): Promise<ExportFile> {
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Auto-detect platform and normalize format
  if (data.mapping) {
    // ChatGPT format
    return {
      path: filePath,
      platform: 'chatgpt',
      conversations: parseChatGPTExport(data)
    };
  } else if (data.conversations) {
    // Claude format
    return {
      path: filePath,
      platform: 'claude',
      conversations: parseClaudeExport(data)
    };
  } else if (data.chats) {
    // Gemini format
    return {
      path: filePath,
      platform: 'gemini',
      conversations: parseGeminiExport(data)
    };
  } else {
    throw new Error('Unknown export format');
  }
}

/**
 * Estimate token count for cost calculation
 */
function estimateTokenCount(conversations: ConversationData[]): number {
  const totalChars = conversations.reduce((sum, conv) => {
    return sum + conv.messages.reduce((msgSum, msg) => msgSum + msg.content.length, 0);
  }, 0);
  
  // Rough approximation: 4 characters per token
  return Math.ceil(totalChars / 4);
}

/**
 * Organize classified conversations into writing projects
 */
async function organizeIntoProjects(
  results: ClassificationResult[],
  conversations: ConversationData[]
): Promise<WritingProject[]> {
  const writingConversations = results
    .filter(r => r.isWriting && r.confidence > 0.6)
    .map(r => ({
      classification: r,
      conversation: conversations.find(c => c.id === r.id)!
    }));

  console.log(`📝 Found ${writingConversations.length} writing conversations to organize`);

  // Group by category and detect projects
  const projectGroups = new Map<string, typeof writingConversations>();
  
  writingConversations.forEach(({ classification, conversation }) => {
    const key = `${classification.category}-${detectProjectTheme(conversation)}`;
    
    if (!projectGroups.has(key)) {
      projectGroups.set(key, []);
    }
    projectGroups.get(key)!.push({ classification, conversation });
  });

  // Convert groups to projects
  const projects: WritingProject[] = [];
  let projectId = 1;

  for (const [groupKey, conversations] of projectGroups) {
    const [category, theme] = groupKey.split('-');
    
    projects.push({
      id: `project-${projectId++}`,
      title: generateProjectTitle(category, theme, conversations.length),
      category: category as any,
      conversations: conversations.map(c => c.conversation),
      classifications: conversations.map(c => c.classification),
      stats: {
        conversationCount: conversations.length,
        totalMessages: conversations.reduce((sum, c) => sum + c.conversation.messages.length, 0),
        estimatedWords: estimateWordCount(conversations.map(c => c.conversation))
      }
    });
  }

  return projects.sort((a, b) => b.stats.conversationCount - a.stats.conversationCount);
}

/**
 * Generate organized output files
 */
async function generateOutputs(projects: WritingProject[], platform: string): Promise<void> {
  const fs = require('fs').promises;
  const path = require('path');

  // Create output directory structure
  const baseDir = `./imported-${platform}-${Date.now()}`;
  await fs.mkdir(baseDir, { recursive: true });

  for (const project of projects) {
    const projectDir = path.join(baseDir, sanitizeFilename(project.title));
    await fs.mkdir(projectDir, { recursive: true });

    // Generate project metadata
    await fs.writeFile(
      path.join(projectDir, 'project-info.json'),
      JSON.stringify(project, null, 2)
    );

    // Generate markdown files for conversations
    const conversationsDir = path.join(projectDir, 'conversations');
    await fs.mkdir(conversationsDir, { recursive: true });

    for (let i = 0; i < project.conversations.length; i++) {
      const conv = project.conversations[i];
      const markdown = generateConversationMarkdown(conv);
      const filename = `${i + 1}-${sanitizeFilename(conv.title)}.md`;
      
      await fs.writeFile(path.join(conversationsDir, filename), markdown);
    }

    // Generate summary files
    await generateProjectSummary(projectDir, project);
  }

  console.log(`   ✅ Created ${projects.length} organized projects in ${baseDir}`);
}

/**
 * Show final import summary
 */
function showFinalSummary(
  results: ClassificationResult[],
  recommendation: any,
  projects: WritingProject[]
): void {
  const writingCount = results.filter(r => r.isWriting).length;
  const totalWords = projects.reduce((sum, p) => sum + p.stats.estimatedWords, 0);

  console.log('🎉 Import Complete!\n');
  console.log('📊 Final Summary:');
  console.log(`   📝 Writing conversations found: ${writingCount}/${results.length}`);
  console.log(`   📁 Projects created: ${projects.length}`);
  console.log(`   📖 Estimated total words: ${totalWords.toLocaleString()}`);
  console.log(`   💰 Total cost: $${recommendation.estimatedCost.toFixed(3)}`);
  console.log(`   🤖 Model used: ${recommendation.model}`);
  console.log(`   🎯 Classification accuracy: ${(recommendation.accuracy * 100).toFixed(1)}%\n`);

  console.log('🚀 Next steps:');
  console.log('   • Review generated projects for accuracy');
  console.log('   • Import projects into Writer CLI or other tools');
  console.log('   • Continue developing your writing projects!\n');
}

// Helper functions and types
interface WritingProject {
  id: string;
  title: string;
  category: string;
  conversations: ConversationData[];
  classifications: ClassificationResult[];
  stats: {
    conversationCount: number;
    totalMessages: number;
    estimatedWords: number;
  };
}

interface ClassificationResult {
  id: string;
  isWriting: boolean;
  confidence: number;
  category: 'fiction' | 'non-fiction' | 'screenplay' | 'poetry' | 'technical' | 'academic' | 'casual';
  quality: 'fragment' | 'draft' | 'substantial';
  reasoning?: string;
}

function detectProjectTheme(conversation: ConversationData): string {
  // Simple theme detection based on title and content
  const text = (conversation.title + ' ' + conversation.messages.map(m => m.content).join(' ')).toLowerCase();
  
  if (text.includes('novel') || text.includes('book') || text.includes('chapter')) return 'novel';
  if (text.includes('script') || text.includes('screenplay') || text.includes('dialogue')) return 'screenplay';
  if (text.includes('article') || text.includes('blog') || text.includes('post')) return 'article';
  if (text.includes('poem') || text.includes('poetry') || text.includes('verse')) return 'poetry';
  if (text.includes('research') || text.includes('paper') || text.includes('thesis')) return 'academic';
  
  return 'general';
}

function generateProjectTitle(category: string, theme: string, count: number): string {
  const categoryMap: Record<string, string> = {
    fiction: 'Fiction Writing',
    'non-fiction': 'Non-Fiction Writing',
    screenplay: 'Screenplay Development',
    poetry: 'Poetry Collection',
    technical: 'Technical Writing',
    academic: 'Academic Research'
  };

  const base = categoryMap[category] || 'Writing Project';
  const themeStr = theme !== 'general' ? ` - ${theme.charAt(0).toUpperCase() + theme.slice(1)}` : '';
  return `${base}${themeStr} (${count} conversations)`;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9\-_\s]/gi, '').replace(/\s+/g, '-').toLowerCase();
}

function estimateWordCount(conversations: ConversationData[]): number {
  const totalChars = conversations.reduce((sum, conv) => {
    return sum + conv.messages.reduce((msgSum, msg) => msgSum + msg.content.length, 0);
  }, 0);
  
  // Rough approximation: 5 characters per word
  return Math.ceil(totalChars / 5);
}

function generateConversationMarkdown(conversation: ConversationData): string {
  const messages = conversation.messages.map(msg => {
    const role = msg.role === 'user' || msg.role === 'human' ? 'Human' : 'Assistant';
    return `## ${role}\n\n${msg.content}\n`;
  }).join('\n');

  return `# ${conversation.title}\n\n${messages}`;
}

async function generateProjectSummary(projectDir: string, project: WritingProject): Promise<void> {
  const fs = require('fs').promises;
  const path = require('path');

  const summary = `# ${project.title}

## Project Overview
- **Category**: ${project.category}
- **Conversations**: ${project.stats.conversationCount}
- **Messages**: ${project.stats.totalMessages}
- **Estimated Words**: ${project.stats.estimatedWords.toLocaleString()}

## Conversations
${project.conversations.map((conv, i) => `${i + 1}. ${conv.title}`).join('\n')}

## Classification Details
${project.classifications.map(c => 
  `- **${c.category}** (${(c.confidence * 100).toFixed(0)}% confidence): ${c.reasoning || 'AI classified'}`
).join('\n')}

Generated by LLM Export Importer
`;

  await fs.writeFile(path.join(projectDir, 'README.md'), summary);
}

// Platform-specific parsers (simplified examples)
function parseChatGPTExport(data: any): ConversationData[] {
  // Implementation would parse ChatGPT's nested mapping structure
  return [];
}

function parseClaudeExport(data: any): ConversationData[] {
  // Implementation would parse Claude's conversations array
  return [];
}

function parseGeminiExport(data: any): ConversationData[] {
  // Implementation would parse Gemini's chats array
  return [];
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main, loadExportFile, organizeIntoProjects, generateOutputs };