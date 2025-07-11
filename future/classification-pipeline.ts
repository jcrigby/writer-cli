/**
 * Hybrid Content Classification Pipeline for LLM Export Importer
 * 
 * Two-stage classification system:
 * 1. Fast rule-based pre-filtering to eliminate obvious non-writing content
 * 2. AI-powered classification for nuanced writing detection and categorization
 */

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

interface ClassificationResult {
  id: string;
  isWriting: boolean;
  confidence: number;
  category: 'fiction' | 'non-fiction' | 'screenplay' | 'poetry' | 'technical' | 'academic' | 'casual';
  quality: 'fragment' | 'draft' | 'substantial';
  extractedEntities?: {
    characters?: string[];
    locations?: string[];
    themes?: string[];
  };
  reasoning?: string;
}

/**
 * Stage 1: Fast rule-based pre-filtering
 * Quickly eliminates obvious non-writing content to reduce AI processing costs
 */
export class RuleBasedFilter {
  private codePatterns = [
    /```[\s\S]*?```/g,                    // Code blocks
    /function\s+\w+\s*\(/,                // Function definitions
    /class\s+\w+/,                        // Class definitions
    /import\s+.+from\s+['"`]/,            // Import statements
    /\bdef\s+\w+\s*\(/,                    // Python functions
    /console\.log\s*\(/,                  // Console logging
    /\bif\s*\(\s*.+\s*\)\s*{/,            // Conditional statements
    /\w+\[\d+\]\s*=/,                     // Array assignments
  ];

  private mathPatterns = [
    /\d+\s*[+\-*/]\s*\d+/,                // Basic arithmetic
    /\b(equation|formula|calculate|solve)\b/i, // Math keywords
    /\b\d+\s*=\s*\d+/,                    // Equations
    /\b(sin|cos|tan|log|ln)\s*\(/,        // Math functions
    /\∫|\∑|\∏/,                           // Math symbols
  ];

  private systemPatterns = [
    /^Error:/,                            // Error messages
    /^Warning:/,                          // Warning messages  
    /^System:/,                           // System messages
    /^DEBUG:/,                            // Debug output
    /^\[.*\]\s*\d{4}-\d{2}-\d{2}/,       // Log entries
  ];

  private writingIndicators = [
    /\b(character|protagonist|antagonist|plot|scene|chapter)\b/i,
    /\b(dialogue|narrative|story|novel|screenplay|script)\b/i,
    /\b(draft|revision|edit|manuscript|writing|author)\b/i,
    /\b(theme|metaphor|symbolism|imagery|voice|tone)\b/i,
    /\b(fiction|non-fiction|poetry|creative writing)\b/i,
  ];

  /**
   * Quick assessment of conversation content
   */
  public assessConversation(conversation: ConversationData): {
    skip: boolean;
    reason?: string;
    writingScore: number;
  } {
    const fullText = conversation.messages.map(m => m.content).join(' ');
    
    // Check for obvious non-writing patterns
    if (this.hasCodePatterns(fullText)) {
      return { skip: true, reason: 'Contains code patterns', writingScore: 0 };
    }
    
    if (this.hasMathPatterns(fullText)) {
      return { skip: true, reason: 'Contains mathematical content', writingScore: 0 };
    }
    
    if (this.hasSystemPatterns(fullText)) {
      return { skip: true, reason: 'Contains system messages', writingScore: 0 };
    }
    
    // Too short to be meaningful writing
    if (fullText.length < 100) {
      return { skip: true, reason: 'Content too short', writingScore: 0 };
    }
    
    // Calculate basic writing score
    const writingScore = this.calculateWritingScore(fullText);
    
    // Skip if very low writing indicators
    if (writingScore < 0.2) {
      return { skip: true, reason: 'Low writing indicators', writingScore };
    }
    
    return { skip: false, writingScore };
  }

  private hasCodePatterns(text: string): boolean {
    return this.codePatterns.some(pattern => pattern.test(text));
  }

  private hasMathPatterns(text: string): boolean {
    return this.mathPatterns.some(pattern => pattern.test(text));
  }

  private hasSystemPatterns(text: string): boolean {
    return this.systemPatterns.some(pattern => pattern.test(text));
  }

  private calculateWritingScore(text: string): number {
    const matches = this.writingIndicators.reduce((count, pattern) => {
      const found = text.match(pattern);
      return count + (found ? found.length : 0);
    }, 0);
    
    // Normalize by text length (indicators per 1000 characters)
    return Math.min(1, (matches / (text.length / 1000)) * 0.5);
  }
}

/**
 * Stage 2: AI-powered classification for nuanced analysis
 */
export class AIClassifier {
  private model: string;
  private batchSize: number = 5; // Process multiple conversations per API call

  constructor(modelId: string) {
    this.model = modelId;
  }

  /**
   * Classify conversations using AI in batches for cost efficiency
   */
  public async classifyBatch(conversations: ConversationData[]): Promise<ClassificationResult[]> {
    const batches = this.createBatches(conversations, this.batchSize);
    const results: ClassificationResult[] = [];

    for (let i = 0; i < batches.length; i++) {
      console.log(`Processing batch ${i + 1}/${batches.length} (${batches[i].length} conversations)`);
      
      try {
        const batchResults = await this.processBatch(batches[i]);
        results.push(...batchResults);
      } catch (error) {
        console.warn(`Error processing batch ${i + 1}:`, error);
        // Add failed results with default values
        results.push(...batches[i].map(conv => this.createFailedResult(conv.id)));
      }
      
      // Small delay to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  private createBatches<T>(array: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  private async processBatch(conversations: ConversationData[]): Promise<ClassificationResult[]> {
    const prompt = this.createBatchPrompt(conversations);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return this.parseClassificationResults(content, conversations);
  }

  private createBatchPrompt(conversations: ConversationData[]): string {
    const conversationSummaries = conversations.map((conv, index) => {
      const messagePreview = conv.messages
        .slice(0, 3) // First 3 messages for context
        .map(m => `${m.role}: ${m.content.substring(0, 200)}...`)
        .join('\n');
      
      return `--- Conversation ${index + 1} (ID: ${conv.id}) ---
Title: ${conv.title}
Messages preview:
${messagePreview}`;
    }).join('\n\n');

    return `Analyze these conversations and classify each for writing content. For each conversation, determine:

1. Is this primarily about creative or professional writing? (true/false)
2. Writing category: fiction, non-fiction, screenplay, poetry, technical, academic, or casual
3. Content quality: fragment, draft, or substantial
4. Confidence level: 0.0-1.0

${conversationSummaries}

Return JSON array with exactly ${conversations.length} objects:
[
  {
    "id": "conversation_id",
    "isWriting": true/false,
    "confidence": 0.0-1.0,
    "category": "fiction|non-fiction|screenplay|poetry|technical|academic|casual",
    "quality": "fragment|draft|substantial",
    "reasoning": "brief explanation"
  }
]`;
  }

  private parseClassificationResults(content: string, conversations: ConversationData[]): ClassificationResult[] {
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and map results
      return conversations.map((conv, index) => {
        const result = parsed[index];
        if (!result || !result.id) {
          return this.createFailedResult(conv.id);
        }

        return {
          id: conv.id,
          isWriting: Boolean(result.isWriting),
          confidence: Math.max(0, Math.min(1, parseFloat(result.confidence) || 0)),
          category: this.validateCategory(result.category),
          quality: this.validateQuality(result.quality),
          reasoning: result.reasoning || 'AI classification'
        };
      });

    } catch (error) {
      console.warn('Failed to parse AI classification results:', error);
      return conversations.map(conv => this.createFailedResult(conv.id));
    }
  }

  private validateCategory(category: string): ClassificationResult['category'] {
    const validCategories = ['fiction', 'non-fiction', 'screenplay', 'poetry', 'technical', 'academic', 'casual'];
    return validCategories.includes(category) ? category as ClassificationResult['category'] : 'casual';
  }

  private validateQuality(quality: string): ClassificationResult['quality'] {
    const validQualities = ['fragment', 'draft', 'substantial'];
    return validQualities.includes(quality) ? quality as ClassificationResult['quality'] : 'fragment';
  }

  private createFailedResult(id: string): ClassificationResult {
    return {
      id,
      isWriting: false,
      confidence: 0,
      category: 'casual',
      quality: 'fragment',
      reasoning: 'Classification failed'
    };
  }
}

/**
 * Complete classification pipeline orchestrator
 */
export class ClassificationPipeline {
  private ruleFilter: RuleBasedFilter;
  private aiClassifier: AIClassifier;

  constructor(aiModel: string) {
    this.ruleFilter = new RuleBasedFilter();
    this.aiClassifier = new AIClassifier(aiModel);
  }

  /**
   * Process all conversations through the complete pipeline
   */
  public async processConversations(conversations: ConversationData[]): Promise<ClassificationResult[]> {
    console.log(`\n🔍 Starting classification pipeline for ${conversations.length} conversations...\n`);
    
    // Stage 1: Rule-based filtering
    console.log('📋 Stage 1: Rule-based pre-filtering...');
    const filterResults = conversations.map(conv => ({
      conversation: conv,
      assessment: this.ruleFilter.assessConversation(conv)
    }));

    const skipped = filterResults.filter(r => r.assessment.skip);
    const remaining = filterResults.filter(r => !r.assessment.skip);

    console.log(`   ✅ Filtered out ${skipped.length} non-writing conversations`);
    console.log(`   🎯 ${remaining.length} conversations proceeding to AI classification\n`);

    // Stage 2: AI classification for remaining conversations
    console.log('🤖 Stage 2: AI-powered classification...');
    const aiResults = await this.aiClassifier.classifyBatch(
      remaining.map(r => r.conversation)
    );

    // Combine results
    const allResults: ClassificationResult[] = [];
    
    // Add skipped conversations as non-writing
    skipped.forEach(({ conversation, assessment }) => {
      allResults.push({
        id: conversation.id,
        isWriting: false,
        confidence: 1.0,
        category: 'casual',
        quality: 'fragment',
        reasoning: `Rule-based filter: ${assessment.reason}`
      });
    });

    // Add AI-classified results
    allResults.push(...aiResults);

    // Sort by original order
    const orderedResults = conversations.map(conv => 
      allResults.find(result => result.id === conv.id)!
    );

    console.log('\n📊 Classification Summary:');
    const writingCount = orderedResults.filter(r => r.isWriting).length;
    const categoryBreakdown = this.summarizeCategories(orderedResults.filter(r => r.isWriting));
    
    console.log(`   📝 Writing conversations: ${writingCount}/${conversations.length} (${(writingCount/conversations.length*100).toFixed(1)}%)`);
    console.log(`   🗂️  Category breakdown: ${categoryBreakdown}`);
    console.log(`   💰 AI API calls: ${Math.ceil(remaining.length / 5)} (${remaining.length} conversations in batches)\n`);

    return orderedResults;
  }

  private summarizeCategories(writingResults: ClassificationResult[]): string {
    const counts = writingResults.reduce((acc, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([category, count]) => `${category}:${count}`)
      .join(', ');
  }
}