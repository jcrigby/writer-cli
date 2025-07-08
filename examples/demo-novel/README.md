# Demo Novel Project

This is an example Writer CLI project to demonstrate the tool's capabilities.

## Project Details

- **Title**: The Digital Awakening
- **Genre**: Science Fiction
- **Target Length**: 80,000 words
- **Author**: Demo Author

## Project Structure

```
demo-novel/
├── .writer/              # Project configuration
│   └── config.json      # Characters, settings, and metadata
├── chapters/            # Story chapters
│   └── 01-the-discovery.md
├── research/            # Background research and notes
│   └── ai-consciousness.md
├── drafts/              # Previous versions (empty for now)
└── exports/             # Generated files (empty for now)
```

## Getting Started

1. Navigate to this directory
2. Run `writer chapter list` to see available chapters
3. Try `writer character list` to see the characters
4. Use `writer write` to continue the story
5. Use `writer suggest` to get improvement ideas

## Example Commands

```bash
# See project status
writer status

# List characters
writer character list

# Add a new chapter
writer chapter add "Chapter 2: The Contact"

# Get writing suggestions
writer suggest chapters/01-the-discovery.md

# Brainstorm ideas
writer brainstorm --character "ARIA" --situation "first conversation with human"
```

This project demonstrates how Writer CLI can help organize and develop a novel with AI assistance while maintaining creative control over the narrative.