# Project: LLM Export Importer

## Project Overview

A specialized command-line tool designed to extract, classify, and organize writing-related content from AI chat platform exports. This tool addresses the critical problem of valuable writing work being trapped in massive, unstructured JSON export files from platforms like ChatGPT, Claude.ai, Gemini, and Perplexity.

## Core Vision

**"Rescue your writing from AI chat exports"**

Transform chaotic vendor exports into organized, project-based writing archives that can be imported into structured writing tools or used standalone. Bridge the gap between fragmented chat-based assistance and organized writing workflows.

## Architecture

### Project Structure
```
llm-export-importer/
├── src/
│   ├── parsers/              # Platform-specific export parsers
│   │   ├── base/            # Abstract parser interface
│   │   ├── chatgpt.ts       # OpenAI export format parser
│   │   ├── claude.ts        # Anthropic export format parser
│   │   ├── gemini.ts        # Google export format parser
│   │   └── perplexity.ts    # Perplexity export format parser
│   ├── classification/       # Content classification system
│   │   ├── rule-filter.ts   # Fast rule-based pre-filtering
│   │   ├── ai-classifier.ts # LLM-powered classification
│   │   └── pipeline.ts      # Complete classification orchestrator
│   ├── optimization/         # Cost and performance optimization
│   │   ├── model-selector.ts # Dynamic model selection via OpenRouter
│   │   ├── pricing.ts       # Real-time pricing and cost estimation
│   │   └── validator.ts     # Model accuracy validation system
│   ├── organizers/          # Project organization and clustering
│   │   ├── project-detector.ts # Group related conversations
│   │   ├── entity-extractor.ts # Character/location/theme extraction
│   │   └── timeline.ts      # Build writing development timeline
│   ├── exporters/           # Output format generators
│   │   ├── writer-cli.ts    # Writer CLI project format
│   │   ├── markdown.ts      # Organized markdown collections
│   │   ├── scrivener.ts     # Scrivener project files
│   │   └── json.ts          # Structured JSON outputs
│   ├── utils/               # Shared utilities
│   │   ├── file-handler.ts  # File operations and validation
│   │   ├── text-utils.ts    # Text processing helpers
│   │   └── batch-processor.ts # Efficient batch operations
│   └── cli/                 # Command-line interface
│       ├── commands/        # Individual CLI commands
│       ├── interactive.ts   # Interactive organization mode
│       └── progress.ts      # Progress reporting and status
├── config/                  # Configuration and templates
│   ├── platforms.yaml      # Platform format definitions
│   ├── classification.yaml # Classification rules and patterns
│   └── templates/          # Output format templates
├── tests/                   # Comprehensive test suite
│   ├── fixtures/           # Sample export files for testing
│   ├── unit/              # Unit tests for individual components
│   └── integration/       # End-to-end workflow tests
└── docs/                   # Documentation and guides
    ├── platform-formats.md # Export format specifications
    ├── classification.md   # Classification system details
    └── usage-examples.md   # Common usage patterns
```

## Key Design Principles

### 1. Privacy-First Architecture
- **Local Processing Only**: All content analysis happens on user's machine
- **No Cloud Dependencies**: Never send user content to external services for processing
- **API Separation**: Use dedicated API keys for classification, separate from writing work
- **Secure Cleanup**: Automatic cleanup of temporary processing files

### 2. Cost-Optimized Intelligence
- **Hybrid Classification**: Fast rule-based filtering + targeted AI analysis
- **Dynamic Model Selection**: Auto-discover cheapest effective models via OpenRouter API
- **Batch Processing**: Minimize API calls through intelligent batching
- **Accuracy Validation**: Test models before processing to ensure quality

### 3. Multi-Platform Compatibility
- **Universal Import**: Auto-detect and parse all major AI platform exports
- **Format Evolution**: Handle multiple versions of each platform's export format
- **Graceful Degradation**: Partial processing when exports are incomplete/corrupted
- **Extensible Parsers**: Easy addition of new platforms and format versions

### 4. Intelligent Organization
- **Project Detection**: Automatically group related conversations by topic/theme
- **Entity Recognition**: Extract characters, locations, plot elements from content
- **Quality Assessment**: Distinguish substantial work from fragments and test prompts
- **Timeline Construction**: Track writing development over time

## Target Use Cases

### Primary Workflows
1. **Novel Recovery**: Extract character development and plot progression from multiple chat sessions
2. **Screenplay Compilation**: Organize dialogue development and scene work across conversations
3. **Academic Migration**: Consolidate research discussions and paper development
4. **Blog Series Organization**: Group related article drafts and content planning
5. **Creative Project Rescue**: Recover poetry, short stories, and creative writing work

### Secondary Workflows
6. **Research Compilation**: Extract and organize research notes and world-building
7. **Character Development**: Consolidate character sheets and relationship mapping
8. **Writing Process Analysis**: Track writing style evolution and productivity patterns
9. **Collaboration Prep**: Organize content for sharing with editors or collaborators
10. **Archive Creation**: Create permanent, searchable archives of writing development

## Technical Implementation

### Core Commands
```bash
# Basic import operations
llm-import --file chatgpt-export.json
llm-import --dir ~/Downloads/ai-exports/ --auto-detect
llm-import --files export1.json export2.json export3.json

# Classification options
llm-import --file export.json --writing-only --min-confidence 0.8
llm-import --file export.json --categories fiction,screenplay --exclude-fragments

# Model optimization
llm-import --file export.json --optimize-model --budget 1.00
llm-import --file export.json --model deepseek/deepseek-chat --validate

# Output formats
llm-import --file export.json --format writer-cli --template novel
llm-import --file export.json --format markdown --organize-by-project
llm-import --file export.json --format scrivener --include-metadata

# Interactive mode
llm-import --interactive --wizard
llm-import --file export.json --review --manual-classification
```

### Classification System

#### Stage 1: Rule-Based Pre-Filter
```typescript
// Fast elimination patterns
const NON_WRITING_PATTERNS = {
  code: /```[\s\S]*?```|function\s+\w+|class\s+\w+|import\s+/,
  math: /\d+\s*[+\-*/]\s*\d+|\b(equation|formula|solve)\b/,
  system: /^(Error|Warning|DEBUG):/,
  fragments: /.{0,100}$/  // Too short for meaningful writing
};

const WRITING_INDICATORS = {
  creative: /\b(character|plot|scene|dialogue|narrative|story)\b/i,
  process: /\b(draft|revision|edit|manuscript|writing|author)\b/i,
  literary: /\b(theme|metaphor|voice|tone|genre|fiction)\b/i
};
```

#### Stage 2: AI Classification
```typescript
// Optimized batch classification prompt
const CLASSIFICATION_PROMPT = `
Analyze conversations for writing content. Return JSON:
{
  "conversations": [
    {
      "id": "conv_id",
      "isWriting": true/false,
      "confidence": 0.0-1.0,
      "category": "fiction|non-fiction|screenplay|poetry|technical|academic",
      "quality": "fragment|draft|substantial",
      "entities": {
        "characters": ["name1", "name2"],
        "locations": ["place1", "place2"],
        "themes": ["theme1", "theme2"]
      }
    }
  ]
}
`;
```

### Dynamic Model Selection
```typescript
interface ModelRecommendation {
  model: string;           // e.g., "deepseek/deepseek-chat"
  estimatedCost: number;   // Total processing cost
  accuracy: number;        // Validated accuracy (0-1)
  reasoning: string;       // Why this model was chosen
  alternatives: ModelOption[]; // Other viable options
}

// Cost optimization targets
const OPTIMIZATION_TARGETS = {
  ultraCheap: { maxCost: 0.50, minAccuracy: 0.75 },  // DeepSeek, Qwen
  balanced: { maxCost: 2.00, minAccuracy: 0.85 },    // GPT-3.5, Claude Haiku
  quality: { maxCost: 10.00, minAccuracy: 0.95 }     // GPT-4, Claude Sonnet
};
```

## Platform-Specific Handling

### ChatGPT (OpenAI) Export Format
```typescript
interface ChatGPTExport {
  title: string;
  create_time: number;
  mapping: {
    [uuid: string]: {
      message?: {
        author: { role: "user" | "assistant" };
        content: { parts: string[] };
        create_time: number;
      }
    }
  }
}
```

### Claude.ai (Anthropic) Export Format
```typescript
interface ClaudeExport {
  conversations: Array<{
    id: string;
    name: string;
    created_at: string;
    messages: Array<{
      role: "human" | "assistant";
      content: string;
      timestamp: string;
    }>
  }>
}
```

### Gemini (Google) Export Format
```typescript
interface GeminiExport {
  chats: Array<{
    title: string;
    create_time: string;
    messages: Array<{
      author: "user" | "model";
      text: string;
      timestamp: string;
    }>
  }>
}
```

### Perplexity Export Format
```typescript
interface PerplexityExport {
  threads: Array<{
    title: string;
    created_at: string;
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      created_at: string;
    }>
  }>
}
```

## Output Formats

### Writer CLI Project Format
```
my-novel-project/
├── .claude/
│   ├── config.json          # Project metadata and settings
│   ├── characters.json      # Extracted character information
│   ├── locations.json       # World-building and setting details
│   └── timeline.json        # Writing development timeline
├── chapters/
│   ├── 01-opening.md        # Organized writing content
│   ├── 02-conflict.md
│   └── 03-resolution.md
├── research/
│   ├── background-notes.md  # Research conversations
│   └── world-building.md
├── conversations/           # Original conversation exports
│   ├── chat-001.json
│   └── chat-002.json
└── metadata.json           # Import processing metadata
```

### Markdown Collection Format
```
imported-writing/
├── projects/
│   ├── novel-project/
│   │   ├── README.md        # Project summary
│   │   ├── conversations/   # Individual conversation files
│   │   └── extracted/       # Organized content
│   └── screenplay-project/
├── categories/
│   ├── fiction/
│   ├── non-fiction/
│   └── poetry/
└── timeline.md             # Chronological development
```

### Scrivener Import Format
```
project.scriv/
├── project.scrivx          # Scrivener project file
├── Files/
│   ├── Data/              # Individual document files
│   └── search.indexes     # Search indexing
└── Settings/
    ├── ui.plist           # Interface settings
    └── compile.plist      # Compile settings
```

## Configuration System

### Global Configuration
```yaml
# ~/.llm-importer/config.yaml
api:
  openrouter_key: "${OPENROUTER_API_KEY}"
  max_cost_per_import: 5.00
  
classification:
  min_confidence: 0.7
  prefer_models: ["deepseek/deepseek-chat", "qwen/qwen-2.5-72b"]
  batch_size: 5
  
output:
  default_format: "markdown"
  organize_by_project: true
  include_metadata: true
  
privacy:
  local_processing_only: true
  secure_cleanup: true
  no_content_logging: true
```

### Project-Specific Configuration
```yaml
# Per-import configuration
import:
  source_file: "./chatgpt-export-2024.json"
  platform: "auto-detect"
  
filters:
  date_range:
    after: "2024-01-01"
    before: "2024-12-31"
  categories: ["fiction", "screenplay"]
  min_length: 200
  
classification:
  model: "deepseek/deepseek-chat"
  writing_only: true
  extract_entities: true
  
output:
  format: "writer-cli"
  template: "novel"
  destination: "./imported-projects/"
```

## Quality Assurance

### Accuracy Metrics
- **Classification Precision**: >90% accuracy in identifying writing content
- **Category Assignment**: >85% accuracy in genre/type classification
- **Entity Extraction**: >80% accuracy in character/location identification
- **Project Grouping**: >75% accuracy in related conversation clustering

### Performance Targets
- **Processing Speed**: <5 minutes for 100MB export files
- **Memory Efficiency**: <2GB RAM usage during processing
- **Cost Efficiency**: <$1.00 for processing 50,000 conversations
- **Reliability**: >99% successful parsing of well-formed exports

### Testing Strategy
```typescript
// Comprehensive test suite
describe('LLM Export Importer', () => {
  describe('Platform Parsers', () => {
    test('ChatGPT export parsing');
    test('Claude export parsing');
    test('Gemini export parsing');
    test('Perplexity export parsing');
  });
  
  describe('Classification Pipeline', () => {
    test('Rule-based filtering accuracy');
    test('AI classification accuracy');
    test('Batch processing efficiency');
  });
  
  describe('Model Optimization', () => {
    test('OpenRouter pricing integration');
    test('Model validation workflow');
    test('Cost estimation accuracy');
  });
  
  describe('Output Generation', () => {
    test('Writer CLI project format');
    test('Markdown collection organization');
    test('Scrivener import compatibility');
  });
});
```

## Environment Setup

### Required Environment Variables
```bash
# Primary API access
export OPENROUTER_API_KEY="your-openrouter-key"

# Optional fallback APIs
export ANTHROPIC_API_KEY="your-anthropic-key"
export OPENAI_API_KEY="your-openai-key"

# Configuration
export LLM_IMPORTER_CONFIG_DIR="~/.llm-importer"
export LLM_IMPORTER_CACHE_DIR="/tmp/llm-importer"
export LLM_IMPORTER_MAX_COST="5.00"

# Development/debugging
export DEBUG_CLASSIFICATION=true
export VERBOSE_PROCESSING=true
```

### Installation and Quick Start
```bash
# Install the tool
npm install -g llm-export-importer

# Configure API access
llm-import config --openrouter-key your-key-here

# Process your first export
llm-import --file chatgpt-export.json --interactive

# Review results
ls ./imported-*/
```

## Success Metrics

### Quantitative Goals
- **Content Recovery**: Successfully extract 95%+ of actual writing content
- **Organization Accuracy**: Correctly group 85%+ of related conversations
- **Processing Speed**: Complete imports in <5 minutes for typical exports
- **Cost Efficiency**: Average processing cost <$0.50 per export
- **User Adoption**: 1000+ successful imports in first 6 months

### Qualitative Goals
- **Workflow Integration**: Seamless import into existing writing tools
- **Content Preservation**: Maintain all context and development history
- **User Satisfaction**: Positive feedback on content organization quality
- **Time Savings**: Reduce manual organization time by 90%+

## Security and Privacy

### Privacy Protection
- **Local-Only Processing**: No content ever sent to external services
- **API Key Security**: Secure credential storage and transmission
- **Temporary File Cleanup**: Automatic removal of processing artifacts
- **Content Isolation**: API classification uses separate, dedicated keys

### Data Security
- **No Persistent Storage**: Content not cached or logged
- **Encryption Support**: Optional encryption of output files
- **Audit Trail**: Processing logs without content exposure
- **User Control**: Complete control over what content is processed

## Future Extensions

### Advanced Features
- **Real-Time Sync**: Continuous import from platform APIs (when available)
- **Collaborative Organization**: Multi-user project organization and review
- **AI-Enhanced Organization**: Use AI to improve project detection and categorization
- **Version Control**: Git integration for tracking import and organization changes

### Platform Extensions
- **Additional Platforms**: Support for niche writing AI tools and platforms
- **Writing Software Integration**: Direct import into Scrivener, Ulysses, etc.
- **Cloud Storage**: Integration with Dropbox, Google Drive for backup and sync
- **Publishing Platforms**: Direct export to Medium, Substack, WordPress

### Ecosystem Integration
- **Plugin Architecture**: Extensible system for custom parsers and exporters
- **API Access**: Programmatic access for integration with other tools
- **Community Templates**: Shared organization patterns and export templates
- **Analytics**: Writing productivity insights and development tracking

This tool bridges the critical gap between fragmented AI-assisted writing and organized, project-based writing workflows, enabling writers to preserve and build upon their AI collaboration history while maintaining full control over their content and creative process.