# Writer CLI

A powerful command-line interface for writers that brings AI assistance directly to your terminal. Built on the Gemini CLI foundation, Writer CLI supports multiple AI models through OpenRouter, including Claude, GPT-4, and more.

## Features

- **Multi-Model Support**: Use Claude 3.5, GPT-4, Gemini, and other models through OpenRouter
- **Project Management**: Organize novels, screenplays, academic papers, technical docs, blogs, and poetry
- **Writing Commands**: Write, revise, suggest improvements, brainstorm ideas
- **Character & World Building**: Track characters, locations, and story elements
- **Version Control**: Git integration for manuscript versioning
- **Export Formats**: Generate PDFs, EPUB, DOCX, HTML from your manuscripts
- **Context-Aware**: Maintains awareness of your characters, plot, and writing style

## Installation

```bash
npm install -g writer-cli
```

## Quick Start

### 1. Set up API Key

Get an API key from [OpenRouter](https://openrouter.ai/) and set it:

```bash
export OPENROUTER_API_KEY="your-api-key"
```

Or use direct provider keys:
```bash
export ANTHROPIC_API_KEY="your-anthropic-key"
export OPENAI_API_KEY="your-openai-key"
```

### 2. Initialize a Writing Project

```bash
# Create a new novel project
writer init --type novel "My Great Novel"

# Create a screenplay project
writer init --type screenplay "My Movie Script"

# Create an academic paper
writer init --type academic "Research Paper"
```

### 3. Start Writing

```bash
# Write a new chapter
writer write "Write an opening chapter about a mysterious stranger arriving in town"

# Continue writing from where you left off
writer write --continue chapter1.md

# Revise existing content
writer revise --tone dramatic chapter1.md "Make the opening more suspenseful"

# Get suggestions
writer suggest --improve-dialogue chapter1.md
```

## Core Commands

### Project Management
```bash
writer init --type <type> "<title>"          # Initialize new project
writer chapter add "Chapter Title"           # Add new chapter
writer character create "John Doe" --role protagonist
writer location add "Castle Blackstone" --description "Ancient fortress"
writer status                                # View project statistics
```

### Writing Assistance
```bash
writer write <instruction> [file]            # Write new content
writer revise <file> <instruction>           # Revise existing content
writer suggest --<type> <file>               # Get suggestions
writer brainstorm "<topic>"                  # Brainstorm ideas
writer analyze --<type> <file>               # Analyze writing
```

### File Management
```bash
writer export --format pdf                   # Export to PDF
writer backup --create-tag "draft-v1"        # Create backup
writer list chapters                         # List all chapters
```

## Configuration

Create a `.writer/config.json` in your project:

```json
{
  "model": "claude-3.5-sonnet",
  "writing": {
    "tone": "narrative",
    "style": "literary",
    "wordCountGoal": 80000
  }
}
```

### Available Models

- `claude-3.5-sonnet` - Best for creative writing (default)
- `claude-3-opus` - Advanced reasoning and analysis
- `gpt-4-turbo` - Fast and versatile
- `gpt-4o` - Optimized GPT-4
- `gemini-pro` - Google's Gemini model

Or use any OpenRouter model ID directly:
```bash
writer --model anthropic/claude-3.5-sonnet-20241022 write "..."
```

## Project Structure

### Novel Project
```
my-novel/
├── .writer/              # Project configuration
│   ├── config.json
│   ├── characters.json
│   └── locations.json
├── chapters/             # Chapter files
│   ├── 01-beginning.md
│   └── 02-conflict.md
├── research/             # Research notes
├── drafts/               # Version history
└── exports/              # Generated files
```

### Screenplay Project
```
my-screenplay/
├── .writer/
├── screenplay.fountain   # Main screenplay
├── scenes/              # Individual scenes
├── treatments/          # Synopses and treatments
└── exports/
```

## Environment Variables

- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `ANTHROPIC_API_KEY` - Direct Anthropic API key
- `OPENAI_API_KEY` - Direct OpenAI API key
- `WRITER_MODEL` - Default model to use
- `WRITER_CONFIG_DIR` - Configuration directory (default: `.writer`)

## Writing-Specific Features

### Character Consistency
The CLI maintains awareness of your characters across chapters:
```bash
writer character develop "Jane Smith" --add-backstory
writer analyze --character chapter3.md
```

### World Building
Track locations and maintain consistency:
```bash
writer location add "Mystic Forest" --notes "Dark, enchanted, dangerous"
writer worldbuild --location "Mystic Forest" --add-details
```

### Style Analysis
Get feedback on your writing style:
```bash
writer analyze --style chapter1.md
writer analyze --pacing full-manuscript.md
```

## Tips for Best Results

1. **Be Specific**: Give clear instructions for better results
2. **Use Context**: The CLI remembers your characters and world
3. **Iterate**: Use revise and suggest commands to refine
4. **Back Up**: Regular git commits or backup tags
5. **Experiment**: Try different models for different tasks

## Differences from Original Gemini CLI

- Multi-model support through OpenRouter
- Writing-focused commands and workflows
- Project types for different writing genres
- Character and world-building databases
- Export to publishing formats
- Manuscript organization features

## Contributing

Contributions welcome! This is a fork of [Gemini CLI](https://github.com/google-gemini/gemini-cli) adapted for writers.

## License

Apache 2.0 - See LICENSE file for details.