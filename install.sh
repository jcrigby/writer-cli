#!/bin/bash

# Writer CLI Installation Script

set -e

echo "🖋️  Writer CLI Installation"
echo "========================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js 18.0.0 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18.0.0 or higher is required."
    echo "Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    exit 1
fi

echo "✅ npm $(npm --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building Writer CLI..."
npm run build

# Create symlink for global access
echo "🔗 Creating global symlink..."
npm link

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 Quick start:"
echo "  writer init \"My First Novel\" --type novel"
echo "  cd my-first-novel"
echo "  writer character create \"Hero\" --role protagonist"
echo "  writer write"
echo ""
echo "📚 For more help:"
echo "  writer --help"
echo "  cat README.md"
echo ""
echo "🔑 Don't forget to set up your API keys in .env file:"
echo "  ANTHROPIC_API_KEY=your-anthropic-key"
echo "  OPENAI_API_KEY=your-openai-key"
echo "  OPENROUTER_API_KEY=your-openrouter-key"