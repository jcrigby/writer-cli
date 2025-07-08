# Writer CLI

A powerful command-line tool that brings AI-powered writing assistance directly to your terminal. Built on Claude's advanced language capabilities, Writer CLI streamlines creative writing workflows with intelligent project management, version control, and multi-format export capabilities.

## Features

- **Multi-Model AI Support**: Access Claude (via Anthropic), GPT-4 (via OpenAI), and other models through OpenRouter
- **Project Management**: Organize novels, screenplays, academic papers, technical docs, blogs, and poetry
- **Smart Writing Assistance**: AI-powered writing, revision, and brainstorming
- **Character & World Building**: Track characters, locations, and story elements
- **Version Control**: Git-based manuscript tracking (coming soon)
- **Export Formats**: PDF, EPUB, DOCX, and more (coming soon)
- **Word Count Tracking**: Monitor progress with detailed statistics (coming soon)

## Installation

### From Source (Currently Required)

```bash
# Clone the repository
git clone https://github.com/jcrigby/writer-cli.git
cd writer-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link for global use
npm link
```

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- An API key from at least one provider:
  - Anthropic (for Claude)
  - OpenAI (for GPT models)
  - OpenRouter (for multiple models)

## Quick Start

### 1. Set up API Keys

Create a `.env` file in your home directory or project root:

```bash
# Required: At least one API key
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key

# Optional: Default model selection
WRITER_MODEL=claude-3-opus-20240229

# Optional: GitHub integration
GITHUB_TOKEN=your-github-personal-access-token
```

### 2. Initialize a Writing Project

```bash
# Create a new novel project
writer init "My Great Novel" --type novel --author "Your Name"

# Create other project types
writer init "Research Paper" --type academic
writer init "User Guide" --type technical
writer init "My Screenplay" --type screenplay
```

### 3. Start Writing

```bash
# Start writing with AI assistance
writer write chapter1.md

# Revise existing content
writer revise chapter1.md --tone "more dramatic"

# Get suggestions for improvement
writer suggest chapter1.md --focus "dialogue"

# Brainstorm ideas
writer brainstorm --theme "plot twist" --context "mystery novel"
```

## Command Reference

### Core Commands

- `writer init [title]` - Initialize a new writing project
- `writer write [file]` - AI-assisted writing mode
- `writer revise <file>` - AI-powered revision suggestions
- `writer suggest [file]` - Get improvement suggestions
- `writer brainstorm` - Generate creative ideas

### Project Management

- `writer chapter add <title>` - Add a new chapter
- `writer chapter list` - List all chapters
- `writer character create <name>` - Create a new character
- `writer character list` - List all characters

### Version Control & GitHub

- `writer publish [name]` - Create a new GitHub repository
- `writer sync` - Setup and sync with GitHub
- `writer sync --setup --remote <url>` - Configure GitHub repository
- `writer sync --push` - Push changes to GitHub
- `writer sync --pull` - Pull changes from GitHub

### Coming Soon

- `writer outline` - Manage story structure
- `writer research` - Organize research notes
- `writer export` - Export to various formats

## GitHub Integration

Writer CLI includes seamless GitHub integration for backing up your manuscripts:

### Quick Setup (Auto-create Repository)

1. Create a GitHub personal access token at https://github.com/settings/tokens
2. Set the token: `export GITHUB_TOKEN=your-token`
3. From your project directory:
   ```bash
   writer publish
   ```

This automatically creates a private GitHub repository and pushes your manuscript!

### Manual Setup (Existing Repository)

If you already have a repository:
```bash
writer sync --setup --remote https://github.com/username/my-novel.git
```

### Daily Workflow

```bash
# Push your latest changes
writer sync --push

# Pull changes from another computer  
writer sync --pull

# Full sync (pull then push)
writer sync
```

The integration automatically handles authentication and creates meaningful commit messages with word counts.

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