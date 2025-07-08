# Development Guide

This guide explains how to contribute to and develop the Writer CLI project.

## Project Structure

```
writer-cli/
├── packages/
│   ├── cli/                 # Terminal interface and commands
│   │   ├── src/
│   │   │   ├── commands/    # Writer-specific commands
│   │   │   ├── ui/          # Terminal UI components
│   │   │   ├── writer.tsx   # Main entry point
│   │   │   └── simple-writer.ts  # Non-React CLI entry
│   │   └── dist/            # Built files
│   └── core/                # Core functionality
│       ├── src/
│       │   ├── core/        # AI integration
│       │   ├── projects/    # Project management
│       │   └── config/      # Configuration
│       └── dist/            # Built files
├── scripts/                 # Build and utility scripts
├── examples/                # Demo projects
├── bundle/                  # Distribution bundle
└── test-project/            # Test project
```

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/jcrigby/writer-cli.git
cd writer-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link for development
npm link
```

### API Keys

Create a `.env` file in the project root:

```bash
# Required: At least one API key
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key

# Optional: Development settings
DEBUG=1
WRITER_CLI_ENV=development
```

## Development Commands

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build:cli
npm run build:core

# Build with watch mode
npm run build:packages
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:ci

# Run specific package tests
npm run test --workspace packages/cli
npm run test --workspace packages/core
```

### Linting and Formatting

```bash
# Lint all files
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck
```

### Development Workflow

```bash
# Start development mode
npm start

# Debug mode
npm run debug

# Clean build artifacts
npm run clean

# Full preflight check
npm run preflight
```

## Adding New Commands

### 1. Create Command File

Create a new file in `packages/cli/src/commands/`:

```typescript
// packages/cli/src/commands/newCommand.ts
import { CommandModule } from 'yargs';

interface NewCommandArgs {
  option: string;
}

export const newCommand: CommandModule<{}, NewCommandArgs> = {
  command: 'new [option]',
  describe: 'Description of the new command',
  builder: (yargs) => {
    return yargs
      .positional('option', {
        describe: 'Description of the option',
        type: 'string'
      });
  },
  handler: async (argv) => {
    // Implementation here
    console.log('New command executed with:', argv.option);
  }
};
```

### 2. Register Command

Add to `packages/cli/src/commands/index.ts`:

```typescript
import { newCommand } from './newCommand.js';

export async function parseWriterCommands(): Promise<WriterCliArgs> {
  const argv = await yargs(hideBin(process.argv))
    .command(newCommand)  // Add this line
    // ... other commands
    .parse();
    
  return argv as WriterCliArgs;
}

export function isWriterCommand(args: string[]): boolean {
  const writerCommands = [
    'new',  // Add this line
    // ... other commands
  ];
  
  return args.length > 0 && writerCommands.includes(args[0]);
}
```

### 3. Add Core Logic

If the command needs core functionality, add it to `packages/core/src/`:

```typescript
// packages/core/src/core/newFeature.ts
export class NewFeature {
  // Implementation
}
```

### 4. Test the Command

```bash
# Build and test
npm run build
node packages/cli/dist/src/simple-writer.js new --help
```

## Project Management Features

### ProjectManager Class

The `ProjectManager` class handles project configuration and file management:

```typescript
// Usage example
const manager = new ProjectManager('/path/to/project');
await manager.initProject({
  title: 'My Novel',
  author: 'Author Name',
  type: 'novel'
});
```

### Configuration Schema

Projects use `.writer/config.json` for configuration:

```json
{
  "project": {
    "title": "Project Title",
    "author": "Author Name",
    "type": "novel",
    "targetWordCount": 80000
  },
  "characters": [],
  "locations": [],
  "settings": {}
}
```

## AI Integration

### Multi-Model Support

The CLI supports multiple AI providers:

- **Anthropic**: Direct API access to Claude models
- **OpenAI**: Direct API access to GPT models
- **OpenRouter**: Access to multiple models through one API

### Adding New Providers

1. Add provider configuration to `packages/core/src/config/`
2. Implement provider client in `packages/core/src/core/`
3. Update model selection logic

## Testing

### Running Tests

```bash
# All tests
npm test

# Specific package
npm run test --workspace packages/cli

# With coverage
npm run test:ci
```

### Writing Tests

Tests use Vitest. Example test file:

```typescript
// packages/cli/src/commands/newCommand.test.ts
import { describe, it, expect } from 'vitest';
import { newCommand } from './newCommand.js';

describe('newCommand', () => {
  it('should handle basic functionality', () => {
    // Test implementation
  });
});
```

## Distribution

### Building for Distribution

```bash
# Build everything
npm run build

# Create bundle
npm run bundle

# Prepare for publishing
npm run prepare:packages
```

### Publishing

```bash
# Publish to npm (when ready)
npm run publish:npm

# Local testing
npm link
```

## Code Style

- Use TypeScript with strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Add JSDoc comments for public APIs
- Keep functions focused and testable

## Contribution Guidelines

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Follow the existing code style
6. Submit a pull request

## Architecture Notes

### Monorepo Structure

The project uses npm workspaces for package management:

- `packages/cli`: User interface and commands
- `packages/core`: Core functionality and AI integration

### Build System

- TypeScript compilation with `tsc`
- ESBuild for bundling
- Custom build scripts for package preparation

### Key Dependencies

- **yargs**: Command-line argument parsing
- **ink**: React-based terminal UI
- **@anthropic-ai/sdk**: Claude API integration
- **openai**: OpenAI API integration
- **simple-git**: Git operations

## Troubleshooting

### Common Issues

1. **Build failures**: Check Node.js version and dependencies
2. **API errors**: Verify API keys are set correctly
3. **Permission issues**: Check file permissions for project directories
4. **Module not found**: Ensure all packages are built

### Debug Mode

```bash
# Enable debug output
DEBUG=1 writer command

# Or set environment variable
export DEBUG=1
```

## Future Development

See `CLAUDE.md` for the full roadmap and vision for the project.

### Priority Features

1. Word count tracking and statistics
2. Git integration for version control
3. Export system (PDF, EPUB, DOCX)
4. Advanced writing features (consistency checking)
5. Plugin system for extensibility