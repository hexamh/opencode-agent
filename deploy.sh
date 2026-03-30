#!/bin/bash
set -e

# OpenCode Agent - Deployment Script
# This script deploys the OpenCode agent to Cloudflare Workers

echo "🚀 OpenCode Agent Deployment"
echo "============================="
echo ""

# Check for required tools
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop:"
    echo "   https://www.docker.com/products/docker-desktop/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed"

# Check for credentials
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo ""
    echo "⚠️  CLOUDFLARE_API_TOKEN not set"
    echo ""
    read -p "Enter your Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_API_TOKEN
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo ""
    echo "⚠️  CLOUDFLARE_ACCOUNT_ID not set"
    echo ""
    read -p "Enter your Cloudflare Account ID: " CLOUDFLARE_ACCOUNT_ID
    export CLOUDFLARE_ACCOUNT_ID
fi

echo ""
echo "Cloudflare Account: $CLOUDFLARE_ACCOUNT_ID"
echo ""

# Check authentication
echo "Verifying authentication..."
npx wrangler whoami

if [ $? -ne 0 ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo "✅ Authentication successful"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Generate types
echo "Generating TypeScript types..."
npm run types
echo "✅ Types generated"
echo ""

# Type check
echo "Type checking..."
npm run typecheck
echo "✅ Type check passed"
echo ""

# Deploy
echo "Deploying to Cloudflare Workers..."
echo ""
npm run deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "Your OpenCode agent is now live at:"
    echo "https://opencode-agent.${CLOUDFLARE_ACCOUNT_ID}.workers.dev"
    echo ""
    echo "Next steps:"
    echo "1. Set your Anthropic API key as a secret:"
    echo "   echo 'your-key' | npx wrangler secret put ANTHROPIC_API_KEY"
    echo ""
    echo "2. Test the deployment:"
    echo "   curl https://opencode-agent.${CLOUDFLARE_ACCOUNT_ID}.workers.dev/health"
    echo ""
    echo "3. Access the Web UI:"
    echo "   open https://opencode-agent.${CLOUDFLARE_ACCOUNT_ID}.workers.dev"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo ""
    echo "Common issues:"
    echo "- Docker not running: Start Docker Desktop"
    echo "- Invalid credentials: Check your API token and account ID"
    echo "- Container build timeout: Try again with better internet"
    echo ""
    echo "For help, see DEPLOYMENT.md or visit:"
    echo "https://discord.gg/cloudflaredev"
    exit 1
fi
