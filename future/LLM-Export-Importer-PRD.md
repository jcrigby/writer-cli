# Product Requirements Document: LLM Export Importer

## Executive Summary

LLM Export Importer is a standalone command-line tool designed to extract, organize, and convert writing-related content from AI chat platform exports. The tool addresses the critical problem of valuable writing work being trapped in massive, unstructured JSON export files from platforms like ChatGPT, Claude.ai, Gemini, and Perplexity.

## Problem Statement

### The Scattered Writing Problem

Modern writers increasingly use AI chat platforms for writing assistance, resulting in:

- **Fragmented Work**: Writing projects scattered across multiple chat sessions
- **Export Complexity**: Vendor exports are manual, delivered as email links to massive files
- **Unstructured Data**: JSON exports contain everything mixed together (coding, research, writing)
- **Lost Context**: No organization by project, character, or topic
- **Platform Lock-in**: Content effectively trapped in each platform's ecosystem
- **Scale Issues**: Export files can be 100MB+ with thousands of conversations

### Current User Pain Points

1. **Manual Export Process**: Each platform requires separate export initiation
2. **Email Delivery Lag**: Exports delivered hours/days later via email links
3. **Massive File Sizes**: Single JSON files containing entire account history
4. **No Content Filtering**: Writing mixed with coding, research, casual chat
5. **No Organization**: No grouping by project, date, or topic
6. **Format Complexity**: Each vendor uses different JSON structures
7. **Context Loss**: Character development, plot notes scattered across sessions

## Solution Overview

### Core Value Proposition

Transform chaotic AI chat exports into organized, project-based writing archives that can be imported into structured writing tools or used standalone.

### Key Capabilities

- **Multi-Platform Support**: Parse exports from all major AI platforms
- **Intelligent Content Classification**: Identify writing vs. non-writing content
- **Project Detection**: Group related conversations by topic/theme
- **Context Extraction**: Pull out characters, locations, plot elements
- **Format Conversion**: Output to multiple structured formats
- **Metadata Preservation**: Maintain timestamps, conversation flow, context

## Target Users

### Primary Users

1. **Fiction Writers**: 
   - Novelists using AI for character development, plot brainstorming
   - Need to consolidate character sheets and story development

2. **Screenwriters**:
   - Script development across multiple AI sessions
   - Dialogue refinement and character voice development

3. **Content Creators**:
   - Blog post drafts and article development
   - Series planning and content calendars

4. **Academic Writers**:
   - Research paper development
   - Thesis planning and chapter organization

### Secondary Users

5. **Technical Writers**: Documentation development
6. **Poets**: Collection organization and theme development
7. **Game Writers**: Narrative design and character development
8. **Writing Coaches**: Client work organization

## Supported Platforms & Formats

### ChatGPT (OpenAI)
```json
{
  "title": "Conversation Title",
  "create_time": 1234567890,
  "mapping": {
    "uuid": {
      "message": {
        "author": {"role": "user|assistant"},
        "content": {"parts": ["text"]},
        "create_time": 1234567890
      }
    }
  }
}
```

### Claude.ai (Anthropic)
```json
{
  "conversations": [{
    "id": "conv_uuid",
    "name": "Conversation Name",
    "created_at": "2024-01-01T00:00:00Z",
    "messages": [{
      "role": "human|assistant",
      "content": "text",
      "timestamp": "2024-01-01T00:00:00Z"
    }]
  }]
}
```

### Gemini (Google)
```json
{
  "chats": [{
    "title": "Chat Title",
    "create_time": "2024-01-01T00:00:00Z",
    "messages": [{
      "author": "user|model",
      "text": "content",
      "timestamp": "2024-01-01T00:00:00Z"
    }]
  }]
}
```

### Perplexity
```json
{
  "threads": [{
    "title": "Thread Title", 
    "created_at": "2024-01-01T00:00:00Z",
    "messages": [{
      "role": "user|assistant",
      "content": "text",
      "created_at": "2024-01-01T00:00:00Z"
    }]
  }]
}
```

## Core Features

### 1. Multi-Format Parser Engine

**Universal Import**
- Auto-detect export format from file structure
- Robust parsing with error recovery
- Support for partial/corrupted exports
- Batch processing of multiple files

**Format Validation**
- Schema validation for each platform
- Version detection and compatibility
- Warning system for unsupported formats

### 2. Content Classification System

**Hybrid Classification Pipeline**
The system uses a two-stage approach combining fast rule-based filtering with AI-powered classification for optimal accuracy and cost efficiency.

**Stage 1: Rule-Based Pre-Filter**
```
Fast elimination of obvious non-writing content:
- Code patterns (functions, classes, imports, syntax)
- Mathematical content (equations, calculations)  
- System messages and error outputs
- Very short fragments (< 50 characters)
- Non-English content (if specified)
```

**Stage 2: AI Classification**
```
LLM-powered analysis for nuanced content detection:
- Context-aware writing identification
- Genre classification (fiction, non-fiction, technical, etc.)
- Quality assessment (fragment vs substantial work)
- Character/plot element recognition
- Writing development tracking across conversations
```

**Dynamic Model Selection & Cost Optimization**
The system automatically discovers and validates the most cost-effective AI models through OpenRouter's live pricing API:

1. **Real-time Pricing Query**: Fetches current model costs from OpenRouter
2. **Accuracy Validation**: Tests cheapest models against known writing samples  
3. **Cost Estimation**: Calculates total processing cost before execution
4. **Smart Recommendation**: Suggests optimal model balancing accuracy vs cost
5. **User Approval**: Transparent cost/accuracy tradeoffs with user consent

**Content Categories**
- **Fiction Writing**: Novels, short stories, creative pieces
- **Non-Fiction**: Essays, articles, blog posts
- **Scripts**: Screenplays, stage plays, dialogue
- **Poetry**: Poems, song lyrics, creative verse
- **Academic**: Papers, theses, research writing
- **Technical**: Documentation, manuals, tutorials
- **Personal**: Journals, memoirs, personal essays

### 3. Project Detection & Organization

**Clustering Algorithm**
- Topic modeling using conversation titles and content
- Character name recognition and grouping
- Location/setting identification
- Temporal analysis (writing sessions over time)
- Manual project assignment override

**Project Structure**
```
project-name/
├── metadata.json           # Project info, characters, locations
├── conversations/          # Original conversation exports
├── content/               # Extracted writing content
│   ├── chapters/         # Organized by chapter/section
│   ├── characters/       # Character development notes
│   ├── research/         # Background research
│   └── drafts/          # Various draft versions
└── timeline.json         # Development timeline
```

### 4. Context Extraction Engine

**Entity Recognition**
- **Characters**: Names, descriptions, relationships, development
- **Locations**: Settings, world-building details
- **Themes**: Recurring topics and motifs
- **Plot Elements**: Events, conflicts, resolutions

**Relationship Mapping**
- Character interaction networks
- Location connections
- Plot thread dependencies
- Thematic development over time

### 5. Export & Conversion System

**Output Formats**
- **Writer CLI Projects**: Native integration
- **Markdown Collections**: Organized folder structures
- **Scrivener Import**: .scriv project files
- **JSON/YAML**: Structured data for custom tools
- **HTML Reports**: Web-based browsing interface
- **Plain Text**: Simple, portable format

**Metadata Preservation**
- Original timestamps and conversation flow
- Platform source information
- Export processing metadata
- Version history and changes

## Technical Architecture

### Core Components

```
llm-export-importer/
├── src/
│   ├── parsers/              # Platform-specific parsers
│   │   ├── base/            # Abstract parser interface
│   │   ├── chatgpt.js       # OpenAI export parser
│   │   ├── claude.js        # Anthropic export parser
│   │   ├── gemini.js        # Google export parser
│   │   └── perplexity.js    # Perplexity export parser
│   ├── classifiers/          # Content classification
│   │   ├── writing-detector.js    # Identify writing content
│   │   ├── project-clusterer.js  # Group related content
│   │   └── entity-extractor.js   # Extract characters/locations
│   ├── processors/           # Data processing pipeline
│   │   ├── conversation.js   # Process individual conversations
│   │   ├── project.js       # Organize into projects
│   │   └── timeline.js      # Build development timeline
│   ├── exporters/           # Output format generators
│   │   ├── writer-cli.js    # Writer CLI project format
│   │   ├── markdown.js      # Markdown collection
│   │   ├── scrivener.js     # Scrivener project
│   │   └── html.js          # HTML report
│   ├── utils/               # Shared utilities
│   │   ├── file-handler.js  # File operations
│   │   ├── text-utils.js    # Text processing
│   │   └── validation.js    # Data validation
│   └── cli/                 # Command-line interface
│       ├── commands/        # CLI commands
│       └── interactive.js   # Interactive mode
├── config/                  # Configuration files
│   ├── platforms.yaml      # Platform definitions
│   ├── classifiers.yaml    # Classification rules
│   └── templates/          # Output templates
├── tests/                  # Test suite
└── docs/                   # Documentation
```

### Technology Stack

**Core Dependencies**
- **Node.js 18+**: Runtime environment
- **TypeScript**: Type-safe development
- **Commander.js**: CLI framework
- **natural**: Natural language processing
- **json-schema**: Data validation
- **yaml**: Configuration files
- **chalk**: Terminal styling

**Optional Dependencies**
- **ml-matrix**: Machine learning for clustering
- **compromise**: Advanced NLP for entity extraction
- **archiver**: Archive creation for exports
- **csv-writer**: CSV export functionality

## User Workflows

### 1. Single File Import
```bash
# Basic import
llm-import --file chatgpt-export.json

# Specify platform and output
llm-import --file export.json --platform chatgpt --output ~/writing-projects/

# Custom configuration
llm-import --file export.json --config custom-rules.yaml --verbose
```

### 2. Batch Processing
```bash
# Process entire directory
llm-import --dir ~/Downloads/ai-exports/ --auto-detect

# Multiple specific files
llm-import --files export1.json export2.json export3.json

# Recursive directory search
llm-import --dir ~/exports/ --recursive --pattern "*.json"
```

### 3. Interactive Mode
```bash
# Launch interactive wizard
llm-import --interactive

# Guided project organization
llm-import --file export.json --organize
```

### 4. Advanced Processing
```bash
# Writing-only filter
llm-import --file export.json --writing-only --min-score 0.8

# Specific date range
llm-import --file export.json --after 2024-01-01 --before 2024-06-30

# Custom output format
llm-import --file export.json --format writer-cli --template novel
```

## Content Processing Pipeline

### Stage 1: Import & Validation
1. **File Detection**: Identify platform and format version
2. **Schema Validation**: Ensure data structure integrity
3. **Data Extraction**: Parse JSON into normalized format
4. **Error Handling**: Report and recover from parsing issues

### Stage 2: Content Analysis
1. **Writing Detection**: Score each conversation for writing relevance
2. **Content Classification**: Categorize by writing type
3. **Quality Assessment**: Identify substantial vs. fragmentary content
4. **Language Detection**: Handle multilingual content

### Stage 3: Entity Extraction
1. **Character Identification**: Extract names and descriptions
2. **Location Mapping**: Identify settings and places
3. **Theme Analysis**: Detect recurring topics
4. **Relationship Modeling**: Map character and plot relationships

### Stage 4: Project Organization
1. **Clustering**: Group related conversations
2. **Project Creation**: Define project boundaries
3. **Content Assignment**: Organize content within projects
4. **Timeline Construction**: Build development history

### Stage 5: Export Generation
1. **Format Selection**: Choose output format
2. **Template Application**: Apply formatting templates
3. **Metadata Integration**: Include extracted metadata
4. **File Generation**: Create organized output structure

## Performance Requirements

### Scale Targets
- **File Size**: Handle exports up to 1GB
- **Conversation Count**: Process 10,000+ conversations
- **Memory Usage**: Stay under 2GB RAM during processing
- **Processing Time**: Complete 100MB file in under 5 minutes

### Optimization Strategies
- **Streaming Parsing**: Process large files without full memory load
- **Parallel Processing**: Utilize multiple CPU cores
- **Incremental Processing**: Resume interrupted operations
- **Smart Caching**: Cache parsed results for re-processing

## Security & Privacy

### Data Protection
- **Local Processing**: All operations performed locally
- **No Cloud Dependencies**: No data sent to external services
- **Temporary Files**: Secure cleanup of processing artifacts
- **Encryption**: Optional encryption of sensitive outputs

### Content Privacy
- **No Logging**: Sensitive content not logged or cached
- **Selective Export**: Choose which content to include in outputs
- **Redaction**: Optional PII removal and content sanitization

## Success Metrics

### Quantitative Metrics
- **Parsing Accuracy**: 99%+ successful parsing of well-formed exports
- **Classification Precision**: 95%+ accuracy in writing content detection
- **Processing Speed**: Sub-linear scaling with file size
- **Memory Efficiency**: Handle files 10x larger than available RAM

### Qualitative Metrics
- **User Satisfaction**: Successful project recovery and organization
- **Content Preservation**: Maintain context and relationships
- **Workflow Integration**: Smooth import into target writing tools

## Development Roadmap

### Phase 1: Core Foundation (Months 1-2)
- **Basic Parser Framework**: Support ChatGPT and Claude exports
- **Simple Classification**: Rule-based writing detection
- **Markdown Export**: Basic organized output
- **CLI Interface**: Command-line tool with essential features

### Phase 2: Enhanced Processing (Months 3-4)
- **All Platform Support**: Gemini, Perplexity, others
- **Advanced Classification**: ML-based content scoring
- **Entity Extraction**: Character and location identification
- **Project Clustering**: Automatic project organization

### Phase 3: Professional Features (Months 5-6)
- **Writer CLI Integration**: Native project export
- **Scrivener Support**: Direct .scriv project generation
- **Interactive Mode**: Guided organization workflow
- **Batch Processing**: Handle multiple exports efficiently

### Phase 4: Advanced Analytics (Months 7-8)
- **Timeline Visualization**: Track writing development over time
- **Relationship Mapping**: Character and plot relationship graphs
- **Writing Analytics**: Style and productivity insights
- **Custom Templates**: User-defined output formats

### Phase 5: Ecosystem Integration (Months 9-12)
- **Plugin System**: Extensible format support
- **API Interface**: Programmatic access to functionality
- **Web Interface**: Browser-based processing option
- **Community Features**: Shared templates and configurations

## Technical Challenges

### Data Structure Variations
- **Format Evolution**: Platforms change export formats over time
- **Incomplete Exports**: Handle partial or corrupted data
- **Size Limitations**: Platform-imposed export restrictions
- **Encoding Issues**: Character encoding and Unicode handling

### Content Classification
- **Context Dependency**: Writing identification requires conversation context
- **Multilingual Support**: Handle content in multiple languages
- **Domain Specificity**: Different writing styles and genres
- **False Positives**: Avoid classifying non-writing as writing content

### Performance Optimization
- **Memory Management**: Handle massive files efficiently
- **Processing Speed**: Balance accuracy with performance
- **Incremental Updates**: Re-process only changed content
- **Parallel Processing**: Safely parallelize without conflicts

## Competitive Analysis

### Direct Competitors
- **None**: No existing tools specifically target this use case
- **General Converters**: Generic JSON processors lack domain knowledge
- **Platform Tools**: Limited to single-platform exports

### Indirect Competitors
- **Manual Process**: Copy-paste from web interfaces
- **Web Scrapers**: Browser automation tools
- **API Integrations**: Direct platform API access (where available)

### Competitive Advantages
- **Writing-Specific**: Purpose-built for writing content
- **Multi-Platform**: Support all major AI platforms
- **Intelligent Organization**: Automated project detection
- **Format Flexibility**: Multiple output formats
- **Privacy-First**: Local processing only

## Business Model

### Open Source Strategy
- **MIT License**: Permissive open-source licensing
- **Community Driven**: Accept contributions and extensions
- **Corporate Friendly**: Allow commercial integration
- **Documentation**: Comprehensive guides and examples

### Monetization Options (Future)
- **Hosted Service**: Cloud-based processing for non-technical users
- **Premium Features**: Advanced analytics and integrations
- **Consulting**: Custom integration and migration services
- **Enterprise**: On-premises deployments with support

## Risk Assessment

### Technical Risks
- **Format Changes**: Platform export formats may change
- **Scale Challenges**: Very large exports may exceed processing capacity
- **Classification Accuracy**: False positives/negatives in content detection
- **Performance Issues**: Memory or speed limitations with massive files

### Mitigation Strategies
- **Format Versioning**: Support multiple format versions per platform
- **Graceful Degradation**: Partial processing when full processing fails
- **User Feedback**: Allow manual correction of classification errors
- **Optimization**: Continuous performance improvements

### Market Risks
- **Platform API Changes**: Platforms might change export functionality
- **User Adoption**: Writers may not have large export backlogs
- **Competition**: Major platforms might build similar tools
- **Technical Barriers**: CLI tools may be too technical for some users

## Future Extensions

### Advanced Features
- **Real-time Sync**: Continuous import from platform APIs
- **Version Control**: Git integration for tracking changes
- **Collaboration**: Multi-user project organization
- **AI Enhancement**: Use AI to improve organization and categorization

### Platform Extensions
- **Specialized Platforms**: Support niche writing AI tools
- **Writing Software**: Import from Scrivener, Ulysses, etc.
- **Note-taking Apps**: Notion, Obsidian, Roam Research
- **Cloud Storage**: Direct integration with Dropbox, Google Drive

### Integration Ecosystem
- **Writing Tools**: Native plugins for popular writing software
- **Publishing Platforms**: Direct export to Medium, Substack, etc.
- **Analytics**: Writing productivity and development insights
- **Backup Solutions**: Automated archival and versioning

## Implementation Priority

### Must-Have (MVP)
1. ChatGPT and Claude export parsing
2. Basic writing content detection
3. Simple project organization
4. Markdown export format
5. Command-line interface

### Should-Have (v1.0)
1. All major platform support
2. Entity extraction (characters, locations)
3. Writer CLI project export
4. Interactive organization mode
5. Batch processing capabilities

### Nice-to-Have (Future)
1. Advanced analytics and insights
2. Web-based interface
3. Real-time synchronization
4. Plugin ecosystem
5. Enterprise features

## Conclusion

LLM Export Importer addresses a critical gap in the modern writer's workflow: recovering and organizing valuable writing content trapped in AI chat platform exports. By providing intelligent parsing, classification, and organization of this content, the tool enables writers to transition from fragmented chat-based assistance to structured, project-based writing workflows.

The tool's success will be measured by its ability to accurately identify and preserve writing content while organizing it in ways that enhance rather than disrupt the creative process. As AI assistance becomes increasingly central to writing workflows, tools like this become essential infrastructure for maintaining creative continuity and project organization.