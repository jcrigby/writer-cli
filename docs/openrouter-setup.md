# Getting Started with OpenRouter API Key

This tutorial will walk you through getting an OpenRouter API key to use with Writer CLI.

## What is OpenRouter?

OpenRouter provides a unified API to access multiple AI models (Claude, GPT-4, Gemini, etc.) with a single API key and consistent interface. You pay only for what you use, with no monthly subscriptions.

## Step-by-Step Guide

### 1. Create an OpenRouter Account

1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Click **"Sign Up"** or **"Get Started"** button
3. You can sign up with:
   - Google account (fastest)
   - GitHub account
   - Email and password

### 2. Add Credits to Your Account

1. After signing in, click on your profile icon (top right)
2. Select **"Credits"** or **"Billing"**
3. Click **"Add Credits"**
4. Choose an amount (minimum is usually $5)
   - $5 gives you ~1 million tokens with Claude 3.5 Sonnet
   - $10-20 is recommended for regular use
5. Enter payment information (credit card or crypto)

### 3. Generate Your API Key

1. From your dashboard, click **"API Keys"** in the sidebar
2. Click **"Create New Key"** button
3. Give your key a name (e.g., "Writer CLI")
4. Set usage limits (optional but recommended):
   - Daily limit: $1-5 for safety
   - Monthly limit: Your budget
5. Click **"Create"**
6. **IMPORTANT**: Copy the API key immediately! It won't be shown again

### 4. Configure Writer CLI

Set the API key in your environment:

```bash
# Linux/Mac - add to ~/.bashrc or ~/.zshrc
export OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxx"

# Windows Command Prompt
set OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx

# Windows PowerShell
$env:OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxx"
```

Or create a `.env` file in your project:
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
```

### 5. Test Your Setup

```bash
# Test with a simple prompt
node bundle/writer.js --prompt "Write a haiku about API keys"

# Or if installed globally
writer --prompt "Hello, are you working?"
```

## Pricing Overview (as of 2024)

OpenRouter charges per token used. Popular models:

- **Claude 3.5 Sonnet**: ~$3 per million tokens
- **Claude 3 Opus**: ~$15 per million tokens  
- **GPT-4 Turbo**: ~$10 per million tokens
- **GPT-3.5 Turbo**: ~$0.50 per million tokens

For context: 1 million tokens ≈ 750,000 words

## Managing Your API Key

### Check Usage
1. Log into OpenRouter dashboard
2. Go to **"Usage"** to see:
   - Daily/monthly spending
   - Token usage by model
   - Request history

### Set Limits
1. Go to **"API Keys"**
2. Click edit on your key
3. Set spending limits to prevent surprises

### Security Best Practices
- Never commit API keys to git
- Use environment variables
- Rotate keys periodically
- Set spending limits
- Use different keys for different projects

## Troubleshooting

### "Invalid API Key" Error
- Check for typos (keys start with `sk-or-v1-`)
- Ensure no extra spaces or quotes
- Verify key hasn't been revoked

### "Insufficient Credits" Error
- Add more credits to your account
- Check if you hit daily/monthly limits

### "Model Not Found" Error
- Some models require approval
- Check model availability in your region

## Alternative: Direct Provider Keys

If you prefer, Writer CLI also supports direct provider keys:

```bash
# Anthropic (for Claude)
export ANTHROPIC_API_KEY="sk-ant-xxxxx"

# OpenAI (for GPT models)  
export OPENAI_API_KEY="sk-xxxxx"
```

But OpenRouter is recommended for:
- Single billing for all models
- Automatic fallbacks
- Better rate limits
- Unified API interface

## Next Steps

1. Set your API key in environment
2. Run `writer init --type novel "My Story"`
3. Start writing with AI assistance!

## Useful Links

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Supported Models](https://openrouter.ai/models)
- [Pricing Calculator](https://openrouter.ai/pricing)
- [API Usage Dashboard](https://openrouter.ai/dashboard)

Remember: Start with small credits ($5-10) to test, then add more based on your usage patterns.