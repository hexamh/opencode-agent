#!/bin/bash
set -e

echo "🐙 GitHub Repository Setup & Deployment"
echo "========================================="
echo ""

# Check if GH_TOKEN is set
if [ -z "$GH_TOKEN" ]; then
    echo "⚠️  GitHub token not found"
    echo ""
    echo "To create a GitHub Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens/new"
    echo "2. Name: 'OpenCode Agent Deploy'"
    echo "3. Scopes: Select 'repo' and 'workflow'"
    echo "4. Click 'Generate token'"
    echo "5. Copy the token"
    echo ""
    read -p "Enter your GitHub Personal Access Token: " GH_TOKEN
    export GH_TOKEN
fi

# Authenticate with GitHub CLI
echo "$GH_TOKEN" | gh auth login --with-token

# Verify authentication
echo ""
echo "Verifying GitHub authentication..."
gh auth status

if [ $? -ne 0 ]; then
    echo "❌ GitHub authentication failed"
    exit 1
fi

echo "✅ GitHub authentication successful"
echo ""

# Get GitHub username
GITHUB_USER=$(gh api user -q .login)
echo "GitHub User: $GITHUB_USER"
echo ""

# Create repository
REPO_NAME="opencode-agent"
echo "Creating GitHub repository: $GITHUB_USER/$REPO_NAME"
echo ""

gh repo create "$REPO_NAME" --public --description "OpenCode agent on Cloudflare Workers with Sandbox SDK" --source=. --remote=origin --push

if [ $? -ne 0 ]; then
    echo "⚠️  Repository creation failed (might already exist)"
    echo "Adding remote and pushing..."
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || true
    git branch -M main 2>/dev/null || git branch -M master main 2>/dev/null || true
    git push -u origin main --force
fi

echo "✅ Repository created and code pushed"
echo ""

# Set GitHub secrets
echo "Setting up GitHub Secrets..."
echo ""

# Cloudflare API Token
gh secret set CLOUDFLARE_API_TOKEN --body "cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
echo "✅ CLOUDFLARE_API_TOKEN set"

# Cloudflare Account ID
gh secret set CLOUDFLARE_ACCOUNT_ID --body "7416e7b5d307baabca87e8fba69158e5"
echo "✅ CLOUDFLARE_ACCOUNT_ID set"

# Anthropic API Key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo ""
    echo "⚠️  Anthropic API key not found"
    echo "Get your key from: https://console.anthropic.com/"
    echo ""
    read -p "Enter your Anthropic API Key: " ANTHROPIC_API_KEY
fi

gh secret set ANTHROPIC_API_KEY --body "$ANTHROPIC_API_KEY"
echo "✅ ANTHROPIC_API_KEY set"
echo ""

echo "✅ All secrets configured"
echo ""

# Trigger deployment workflow
echo "Triggering deployment workflow..."
gh workflow run deploy.yml

if [ $? -eq 0 ]; then
    echo "✅ Deployment workflow triggered"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Repository: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo "Actions: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
    echo ""
    echo "Monitor deployment:"
    echo "  gh run watch"
    echo ""
    echo "After deployment, your agent will be at:"
    echo "  https://opencode-agent.visatk-us.workers.dev"
    echo ""
else
    echo "⚠️  Could not trigger workflow automatically"
    echo "Please trigger manually:"
    echo "  1. Go to: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
    echo "  2. Click: 'Deploy to Cloudflare Workers'"
    echo "  3. Click: 'Run workflow'"
fi
