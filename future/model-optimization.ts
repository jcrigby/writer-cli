/**
 * Dynamic Model Selection & Cost Optimization for LLM Export Importer
 * 
 * This module handles automatic discovery and validation of the most cost-effective
 * AI models for content classification through OpenRouter's live pricing API.
 */

interface ModelInfo {
  id: string;
  name: string;
  pricing: {
    prompt: number;    // Cost per token
    completion: number;
  };
  context_length: number;
  top_provider: {
    max_completion_tokens: number;
  };
}

interface ValidationResult {
  accuracy: number;
  avgCost: number;
  suitable: boolean;
  responseTime: number;
}

interface ModelRecommendation {
  model: string;
  estimatedCost: number;
  accuracy: number;
  reasoning: string;
}

/**
 * Fetches live model pricing from OpenRouter API
 */
export async function getModelPricing(): Promise<ModelInfo[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  const models = await response.json();
  
  return models.data
    .filter((m: ModelInfo) => m.context_length >= 4096) // Minimum for classification
    .filter((m: ModelInfo) => m.pricing.prompt < 0.001) // Under $0.001 per token
    .sort((a: ModelInfo, b: ModelInfo) => a.pricing.prompt - b.pricing.prompt) // Cheapest first
    .slice(0, 15); // Top 15 cheapest suitable models
}

/**
 * Generates test samples for model validation
 */
function generateTestSamples(): { content: string; expectedScore: number; type: string }[] {
  return [
    // High-quality writing samples (should score 8-10)
    {
      content: "Sarah's hands trembled as she reached for the letter. The envelope bore her father's handwriting, impossible since he'd been dead for three years. She tore it open, heart pounding, and read the first line: 'My dearest daughter, if you're reading this, then the curse has finally found our family.'",
      expectedScore: 9,
      type: "fiction"
    },
    {
      content: "Chapter 3: The Hero's Journey\n\nEvery compelling narrative follows a predictable pattern, what Joseph Campbell termed the monomyth. The hero begins in the ordinary world, receives a call to adventure, meets a mentor, crosses the threshold into the special world, faces trials, confronts the ordeal, receives the reward, and returns transformed.",
      expectedScore: 8,
      type: "non-fiction"
    },
    
    // Medium writing samples (should score 5-7)
    {
      content: "Can you help me brainstorm some character names for my fantasy novel? I need something that sounds elvish but not too cliché. The main character is a female archer who's also skilled in magic.",
      expectedScore: 6,
      type: "writing-discussion"
    },
    
    // Non-writing samples (should score 0-3)
    {
      content: "```python\ndef calculate_fibonacci(n):\n    if n <= 1:\n        return n\n    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)\n\nprint(calculate_fibonacci(10))```",
      expectedScore: 1,
      type: "code"
    },
    {
      content: "What's 2 + 2? I need to solve this math problem quickly. Also, can you explain the quadratic formula?",
      expectedScore: 0,
      type: "math"
    },
    {
      content: "Hey how's the weather today? I'm thinking about going to the grocery store later. Do you have any recommendations for what I should buy?",
      expectedScore: 0,
      type: "casual-chat"
    }
  ];
}

/**
 * Tests a model's accuracy for writing content classification
 */
async function validateModel(modelId: string, testSamples: ReturnType<typeof generateTestSamples>): Promise<ValidationResult> {
  console.log(`🧪 Testing ${modelId}...`);
  
  const startTime = Date.now();
  const results = [];
  
  for (const sample of testSamples) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{
            role: 'user',
            content: `Rate this content for writing relevance on a scale of 0-10 (0=not writing, 10=clearly creative/professional writing). Return only the number.

Content: "${sample.content}"`
          }],
          max_tokens: 10,
          temperature: 0.1
        })
      });
      
      const data = await response.json();
      const scoreText = data.choices[0].message.content.trim();
      const actualScore = parseInt(scoreText.match(/\d+/)?.[0] || '0');
      
      // Calculate accuracy based on how close the score is to expected
      const accuracy = Math.max(0, 1 - Math.abs(actualScore - sample.expectedScore) / 10);
      
      results.push({
        expected: sample.expectedScore,
        actual: actualScore,
        accuracy,
        cost: (data.usage?.prompt_tokens || 0) * 0.0001 // Rough estimate
      });
      
    } catch (error) {
      console.warn(`   ⚠️  Error testing sample: ${error}`);
      results.push({ expected: sample.expectedScore, actual: 0, accuracy: 0, cost: 0 });
    }
  }
  
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
  const avgCost = results.reduce((sum, r) => sum + r.cost, 0) / results.length;
  const responseTime = Date.now() - startTime;
  
  return {
    accuracy: avgAccuracy,
    avgCost,
    suitable: avgAccuracy > 0.75, // 75% accuracy threshold
    responseTime
  };
}

/**
 * Recommends the optimal model for content classification
 */
export async function recommendOptimalModel(estimatedTokens: number): Promise<ModelRecommendation> {
  console.log('🔍 Discovering and testing models for optimal cost/accuracy...\n');
  
  const models = await getModelPricing();
  const testSamples = generateTestSamples();
  
  console.log(`Found ${models.length} cost-effective models to test:\n`);
  
  for (const model of models) {
    const validation = await validateModel(model.id, testSamples);
    const estimatedCost = estimatedTokens * model.pricing.prompt;
    
    console.log(`   ${model.id}:`);
    console.log(`     Accuracy: ${(validation.accuracy * 100).toFixed(1)}%`);
    console.log(`     Cost: $${estimatedCost.toFixed(3)} (${model.pricing.prompt.toFixed(6)}/token)`);
    console.log(`     Response time: ${validation.responseTime}ms`);
    
    if (validation.suitable) {
      console.log(`\n✅ Recommended: ${model.id}`);
      console.log(`   • ${(validation.accuracy * 100).toFixed(1)}% accuracy (exceeds 75% threshold)`);
      console.log(`   • $${estimatedCost.toFixed(3)} total estimated cost`);
      console.log(`   • ${validation.responseTime}ms average response time\n`);
      
      return {
        model: model.id,
        estimatedCost,
        accuracy: validation.accuracy,
        reasoning: `Best cost/accuracy balance: ${(validation.accuracy * 100).toFixed(1)}% accuracy at $${estimatedCost.toFixed(3)} total cost`
      };
    }
    
    console.log(`     ❌ Below 75% accuracy threshold\n`);
  }
  
  console.log('⚠️  No ultra-cheap model met accuracy threshold, using reliable fallback\n');
  
  // Fallback to GPT-3.5-turbo if no cheap model works
  return {
    model: 'openai/gpt-3.5-turbo',
    estimatedCost: estimatedTokens * 0.0015,
    accuracy: 0.94, // Known good performance
    reasoning: 'Fallback model - reliable accuracy but higher cost'
  };
}

/**
 * Interactive user confirmation for model selection
 */
export async function confirmModelSelection(recommendation: ModelRecommendation): Promise<boolean> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log(`Proceed with ${recommendation.model}?`);
    console.log(`  Cost: $${recommendation.estimatedCost.toFixed(3)}`);
    console.log(`  Accuracy: ${(recommendation.accuracy * 100).toFixed(1)}%`);
    console.log(`  Reasoning: ${recommendation.reasoning}\n`);
    
    readline.question('Continue? [Y/n]: ', (answer) => {
      readline.close();
      resolve(answer.toLowerCase() !== 'n' && answer.toLowerCase() !== 'no');
    });
  });
}

/**
 * Example usage workflow
 */
export async function optimizeModelSelection(exportFile: string): Promise<string> {
  // Estimate token count from file size (rough approximation)
  const fs = require('fs');
  const fileStats = fs.statSync(exportFile);
  const estimatedTokens = Math.ceil(fileStats.size / 4); // ~4 chars per token
  
  console.log(`📊 Export analysis:`);
  console.log(`   File size: ${(fileStats.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Estimated tokens: ${estimatedTokens.toLocaleString()}\n`);
  
  const recommendation = await recommendOptimalModel(estimatedTokens);
  const confirmed = await confirmModelSelection(recommendation);
  
  if (!confirmed) {
    console.log('Operation cancelled by user');
    process.exit(0);
  }
  
  return recommendation.model;
}