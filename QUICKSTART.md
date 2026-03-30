# Quick Start Guide

This guide will get you running locally in under 5 minutes.

## Prerequisites

✅ **Required:**
- [Node.js](https://nodejs.org/) 20 or later
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- AI provider API key ([Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/))

ℹ️ **Optional:**
- Cloudflare account (for deployment)

## Step-by-Step Setup

### 1. Verify Docker is Running

```bash
docker info
```

If this fails, start Docker Desktop and try again.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Edit .dev.vars and add your API key
# On Mac/Linux:
nano .dev.vars

# On Windows:
notepad .dev.vars
```

Add your Anthropic API key:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

### 4. Start the Development Server

```bash
npm run dev
```

Wait for:
```
⎔ Starting local server...
[mf:inf] Ready on http://127.0.0.1:8787
```

### 5. Access the Agent

Open your browser to:
- **Web UI**: http://localhost:8787
- **Health Check**: http://localhost:8787/health

## Testing the API

### Using curl:

```bash
# Health check
curl http://localhost:8787/health

# Send a prompt
curl -X POST http://localhost:8787/api/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a hello world function in Python"}'
```

### Using the example script:

```bash
npm install -g tsx  # Install TypeScript executor
tsx examples/api-usage.ts
```

## Common Issues

### "Cannot connect to Docker daemon"

**Solution:** Make sure Docker Desktop is running.

On Mac/Linux:
```bash
# Check if Docker is running
docker ps

# Start Docker if needed (Mac)
open -a Docker
```

On Windows:
```bash
# Start Docker Desktop from Start Menu
```

### "ANTHROPIC_API_KEY not found"

**Solution:** Make sure you created `.dev.vars` and added your key:

```bash
# Check if file exists
cat .dev.vars

# Should show:
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Port 8787 already in use

**Solution:** Either stop the other service or change the port:

```bash
# Run on a different port
npx wrangler dev --port 8788
```

### Container build fails

**Solution:** Pull the base image manually:

```bash
docker pull docker.io/cloudflare/sandbox:0.8.0
```

## Next Steps

Once you have it running locally:

1. **Try the Web UI** - Open http://localhost:8787 and interact with the agent
2. **Test the API** - Run `tsx examples/api-usage.ts` to see programmatic usage
3. **Customize the Dockerfile** - Add tools and packages you need
4. **Deploy to production** - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

## Quick Deploy to Cloudflare

Once everything works locally:

```bash
# Login to Cloudflare
npx wrangler login

# Set production secrets
npx wrangler secret put ANTHROPIC_API_KEY
# Paste your API key when prompted

# Deploy
npm run deploy
```

Your agent will be live at:
```
https://opencode-agent.<your-subdomain>.workers.dev
```

## Need Help?

- Check [README.md](./README.md) for detailed documentation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
- Review [examples/api-usage.ts](./examples/api-usage.ts) for API examples
- Join [OpenCode Discord](https://discord.gg/opencode) for support
