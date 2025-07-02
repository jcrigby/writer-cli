/**
 * @license
 * Copyright 2025 Writer CLI
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface ModelConfig {
  provider: 'openrouter' | 'anthropic' | 'openai';
  model: string;
  apiKey: string;
  baseURL?: string;
}

export interface WritingContext {
  projectType?: 'novel' | 'screenplay' | 'academic' | 'technical' | 'blog' | 'poetry';
  characters?: string[];
  locations?: string[];
  tone?: string;
  style?: string;
}

export class OpenRouterClient {
  private openai!: OpenAI;
  private anthropic?: Anthropic;
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;

    if (config.provider === 'openrouter') {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://github.com/jcrigby/writer-cli',
          'X-Title': 'Writer CLI',
        },
      });
    } else if (config.provider === 'anthropic') {
      this.anthropic = new Anthropic({
        apiKey: config.apiKey,
      });
    } else if (config.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
      });
    }
  }

  async generateText(
    prompt: string,
    context?: WritingContext,
    options?: {
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
    }
  ): Promise<string | AsyncIterable<string>> {
    const systemPrompt = this.buildSystemPrompt(context);
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 4096;

    if (this.config.provider === 'anthropic' && this.anthropic) {
      if (options?.stream) {
        const stream = await this.anthropic.messages.stream({
          model: this.config.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        });

        return (async function* () {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              yield chunk.delta.text;
            }
          }
        })();
      } else {
        const response = await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
      }
    } else {
      // OpenRouter or OpenAI
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: prompt },
      ];

      if (options?.stream) {
        const stream = await this.openai.chat.completions.create({
          model: this.config.model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: true,
        });

        return (async function* () {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          }
        })();
      } else {
        const response = await this.openai.chat.completions.create({
          model: this.config.model,
          messages,
          max_tokens: maxTokens,
          temperature,
        });

        return response.choices[0]?.message?.content || '';
      }
    }
  }

  private buildSystemPrompt(context?: WritingContext): string {
    let prompt = 'You are a professional writing assistant designed to help with creative and technical writing projects.';

    if (context?.projectType) {
      const typePrompts = {
        novel: 'You specialize in novel writing, including character development, plot structure, dialogue, and narrative flow.',
        screenplay: 'You specialize in screenplay writing, including proper formatting, scene structure, character arcs, and dialogue.',
        academic: 'You specialize in academic writing, including research integration, citation management, and scholarly tone.',
        technical: 'You specialize in technical writing, including documentation, API references, and clear instructional content.',
        blog: 'You specialize in blog writing, including engaging content, SEO optimization, and audience engagement.',
        poetry: 'You specialize in poetry, including form, meter, imagery, and emotional expression.',
      };
      prompt += ' ' + typePrompts[context.projectType];
    }

    if (context?.characters?.length) {
      prompt += ` Key characters in this project: ${context.characters.join(', ')}.`;
    }

    if (context?.locations?.length) {
      prompt += ` Important locations: ${context.locations.join(', ')}.`;
    }

    if (context?.tone) {
      prompt += ` Maintain a ${context.tone} tone throughout.`;
    }

    if (context?.style) {
      prompt += ` Follow the ${context.style} writing style.`;
    }

    prompt += ' Always provide helpful, constructive feedback and suggestions that improve the quality of the writing.';

    return prompt;
  }

  async writeCommand(
    instruction: string,
    content?: string,
    context?: WritingContext
  ): Promise<string | AsyncIterable<string>> {
    let prompt = `Writing instruction: ${instruction}`;
    
    if (content) {
      prompt += `\n\nCurrent content:\n${content}`;
    }

    prompt += '\n\nPlease provide the requested writing assistance.';

    return this.generateText(prompt, context, { stream: true });
  }

  async reviseCommand(
    content: string,
    instruction: string,
    context?: WritingContext
  ): Promise<string | AsyncIterable<string>> {
    const prompt = `Please revise the following content according to this instruction: ${instruction}

Content to revise:
${content}

Provide the revised version.`;

    return this.generateText(prompt, context, { stream: true });
  }

  async suggestCommand(
    content: string,
    type: 'improve' | 'continue' | 'dialogue' | 'plot' | 'character',
    context?: WritingContext
  ): Promise<string | AsyncIterable<string>> {
    const suggestions = {
      improve: 'Suggest specific improvements to make this content better',
      continue: 'Continue writing from where this content leaves off',
      dialogue: 'Improve the dialogue in this content',
      plot: 'Suggest plot developments or improvements',
      character: 'Suggest character development or improvements',
    };

    const prompt = `${suggestions[type]}:

${content}

Please provide your suggestions or continuation.`;

    return this.generateText(prompt, context, { stream: true });
  }

  async brainstormCommand(
    topic: string,
    context?: WritingContext
  ): Promise<string | AsyncIterable<string>> {
    const prompt = `Help me brainstorm ideas about: ${topic}

Please provide creative ideas, plot points, character developments, or other relevant suggestions for this topic.`;

    return this.generateText(prompt, context);
  }
}