# GitHub Deployment Guide

This guide shows how to deploy your OpenCode agent automatically using GitHub Actions.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create GitHub Repository

```bash
# If you haven't already, push to GitHub:
git remote add origin https://github.com/YOUR_USERNAME/opencode-agent.git
git branch -M main
git push -u origin main
```

Or create a new repo at: https://github.com/new

### Step 2: Configure GitHub Secrets

Go to your repository settings:
```
https://github.com/YOUR_USERNAME/opencode-agent/settings/secrets/actions
```

Click **"New repository secret"** and add these three secrets:

#### 1. CLOUDFLARE_API_TOKEN
```
Name: CLOUDFLARE_API_TOKEN
Value: cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c
```

#### 2. CLOUDFLARE_ACCOUNT_ID
```
Name: CLOUDFLARE_ACCOUNT_ID
Value: 7416e7b5d307baabca87e8fba69158e5
```

#### 3. ANTHROPIC_API_KEY
```
Name: ANTHROPIC_API_KEY
Value: YOUR_ANTHROPIC_API_KEY_HERE
```
Get your key from: https://console.anthropic.com/

### Step 3: Deploy!

The workflow will automatically deploy when you:
- Push to `main` or `master` branch
- Or click **"Run workflow"** manually

To manually trigger:
1. Go to: `Actions` tab in your repo
2. Click: `Deploy to Cloudflare Workers`
3. Click: `Run workflow`

## 📋 Workflow Details

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. ✅ Sets up Node.js 20
2. ✅ Installs dependencies
3. ✅ Generates TypeScript types
4. ✅ Type checks the code
5. ✅ Builds Docker container (GitHub Actions has Docker)
6. ✅ Deploys to Cloudflare Workers

## 🔧 Manual Deployment (Alternative)

If you prefer to deploy from your local machine:

### Prerequisites
- Docker Desktop installed and running
- Wrangler CLI installed (`npm install -g wrangler`)

### Steps
```bash
# 1. Set environment variables
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
export CLOUDFLARE_ACCOUNT_ID="7416e7b5d307baabca87e8fba69158e5"

# 2. Install dependencies
npm install

# 3. Update .dev.vars with your Anthropic key
nano .dev.vars
# Add: ANTHROPIC_API_KEY=sk-ant-api03-your-key

# 4. Deploy
npm run deploy
```

## 🎯 After Deployment

Once deployed, your agent will be available at:
```
https://opencode-agent.visatk-us.workers.dev
```

### Test the deployment:

```bash
# Health check
curl https://opencode-agent.visatk-us.workers.dev/health

# Send a prompt
curl -X POST https://opencode-agent.visatk-us.workers.dev/api/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!"}'

# Access Web UI
open https://opencode-agent.visatk-us.workers.dev
```

## 🔐 Setting the Anthropic API Key Secret

After the first deployment, you need to set the Anthropic API key as a Cloudflare Worker secret:

```bash
# Using the API token
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
export CLOUDFLARE_ACCOUNT_ID="7416e7b5d307baabca87e8fba69158e5"

# Set the secret
echo "sk-ant-api03-your-key" | npx wrangler secret put ANTHROPIC_API_KEY
```

Or set it via the dashboard:
1. Go to: https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/workers
2. Click on `opencode-agent`
3. Go to `Settings` → `Variables`
4. Add `ANTHROPIC_API_KEY` under `Environment Variables (encrypted)`

## 📊 Monitoring Deployments

### View deployment logs:
1. Go to the **Actions** tab in your GitHub repo
2. Click on the latest workflow run
3. View the deployment logs

### View Worker logs:
```bash
# Stream live logs
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
npx wrangler tail opencode-agent
```

Or view in dashboard:
https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/workers/services/view/opencode-agent/production

## 🔄 Continuous Deployment

With this setup, every time you push code:
```bash
git add .
git commit -m "Update feature"
git push
```

GitHub Actions will automatically:
1. Build the project
2. Run type checks
3. Deploy to Cloudflare Workers

## 🛠️ Troubleshooting

### "Docker not found" in GitHub Actions
This shouldn't happen - GitHub Actions runners have Docker pre-installed.

### "Authentication failed"
Check that your secrets are set correctly in GitHub:
- Settings → Secrets and variables → Actions

### "Container build failed"
The base image download can take time. The workflow will timeout after 30 minutes.

### "Worker not updating"
Clear your browser cache or use the production URL directly.

## 🎉 Success!

Once deployed, your OpenCode agent will be live and accessible worldwide via Cloudflare's edge network!

You can now:
- Access the Web UI
- Use the REST API
- Scale automatically
- Monitor usage in the dashboard

Happy coding! 🚀
