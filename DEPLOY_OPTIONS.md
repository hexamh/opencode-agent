# 🚀 Deployment Options for OpenCode Agent

Your OpenCode agent is ready to deploy! Choose the method that works best for you.

---

## ✅ Your Credentials (Ready to Use)

We have your Cloudflare credentials configured:

```
Account: Visatk.us
Account ID: 7416e7b5d307baabca87e8fba69158e5
API Token: cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c
```

---

## 🎯 Option 1: GitHub Actions (Recommended) ⭐

**Best for:** Automatic deployment whenever you push code

### Setup (5 minutes):

1. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/opencode-agent.git
   git branch -M main
   git push -u origin main
   ```

2. **Add Secrets** (GitHub repo → Settings → Secrets → Actions):
   - `CLOUDFLARE_API_TOKEN`: `cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c`
   - `CLOUDFLARE_ACCOUNT_ID`: `7416e7b5d307baabca87e8fba69158e5`
   - `ANTHROPIC_API_KEY`: Your Anthropic key from https://console.anthropic.com/

3. **Deploy:**
   - Go to Actions tab
   - Click "Deploy to Cloudflare Workers"
   - Click "Run workflow"

**✅ Pros:**
- Automatic deployments on every push
- No local Docker required
- CI/CD built-in
- Free for public repos

**📖 Full Guide:** See `GITHUB_DEPLOY.md`

---

## 🖥️ Option 2: Local Deployment Script

**Best for:** One-time deployment or testing

### Requirements:
- Docker Desktop installed and running
- Node.js 20+

### Steps:

```bash
# 1. Set credentials
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
export CLOUDFLARE_ACCOUNT_ID="7416e7b5d307baabca87e8fba69158e5"

# 2. Run deployment script
./deploy.sh
```

The script will:
- ✅ Check Docker is running
- ✅ Install dependencies
- ✅ Generate types
- ✅ Type check
- ✅ Build container
- ✅ Deploy to Cloudflare

**✅ Pros:**
- Simple one-command deployment
- Full control over build process
- Can deploy from any machine

---

## 🛠️ Option 3: Manual Deployment

**Best for:** Developers who want full control

### Steps:

```bash
# 1. Set credentials
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
export CLOUDFLARE_ACCOUNT_ID="7416e7b5d307baabca87e8fba69158e5"

# 2. Install dependencies
npm install

# 3. Generate types
npm run types

# 4. Type check (optional)
npm run typecheck

# 5. Deploy
npm run deploy
```

**✅ Pros:**
- Most flexible
- Can debug build issues
- Perfect for development

---

## 📱 Option 4: Deploy via Cloudflare Dashboard

**Best for:** Non-technical users or quick testing

### Steps:

1. **Build locally:**
   ```bash
   npm install
   npm run types
   ```

2. **Go to Dashboard:**
   https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/workers

3. **Create Worker:**
   - Click "Create Worker"
   - Name it: `opencode-agent`
   - Copy/paste the built code

**⚠️ Note:** This won't work for container-based workers. Use Options 1-3 instead.

---

## 🔐 After Deployment: Set Secrets

Once deployed, set your Anthropic API key:

### Method 1: Via CLI
```bash
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
echo "sk-ant-api03-your-key" | npx wrangler secret put ANTHROPIC_API_KEY
```

### Method 2: Via Dashboard
1. Go to: https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/workers
2. Click `opencode-agent`
3. Settings → Variables
4. Add `ANTHROPIC_API_KEY` (encrypted)

---

## 🎉 After Successful Deployment

Your agent will be live at:
```
https://opencode-agent.visatk-us.workers.dev
```

### Test it:

```bash
# Health check
curl https://opencode-agent.visatk-us.workers.dev/health

# Send a prompt
curl -X POST https://opencode-agent.visatk-us.workers.dev/api/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a hello world function in Python"}'

# Access Web UI
open https://opencode-agent.visatk-us.workers.dev
```

---

## 🐛 Troubleshooting

### "Docker not found"
**Solution:** Install Docker Desktop:
- Mac: https://docs.docker.com/desktop/install/mac-install/
- Windows: https://docs.docker.com/desktop/install/windows-install/
- Linux: https://docs.docker.com/desktop/install/linux-install/

### "Docker daemon not running"
**Solution:** Start Docker Desktop and try again.

### "Authentication failed"
**Solution:** 
- Verify your API token has Workers edit permissions
- Check: https://dash.cloudflare.com/profile/api-tokens

### "Container build timeout"
**Solution:**
- First build downloads 500MB base image
- Ensure good internet connection
- Subsequent builds use cache and are faster

### "Worker not updating"
**Solution:**
- Wait 30-60 seconds for global propagation
- Clear browser cache
- Try incognito/private browsing

---

## 📊 Monitoring Your Deployment

### View Logs:
```bash
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
npx wrangler tail opencode-agent
```

### View in Dashboard:
https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/workers/services/view/opencode-agent

### View Metrics:
- Request volume
- Error rate
- CPU time
- Duration percentiles

---

## 💡 Quick Comparison

| Method | Docker Required | Complexity | Auto-Deploy | Best For |
|--------|----------------|------------|-------------|----------|
| GitHub Actions | ❌ No | ⭐⭐⭐ Easy | ✅ Yes | Production |
| Local Script | ✅ Yes | ⭐⭐ Simple | ❌ No | Testing |
| Manual | ✅ Yes | ⭐ Very Simple | ❌ No | Development |
| Dashboard | ❌ No* | ⚠️ N/A | ❌ No | Not supported* |

*Container workers require CLI deployment

---

## 🎯 Recommended Path

For most users, we recommend:

1. **GitHub Actions** (Option 1)
   - Set up once, deploy forever
   - No local Docker needed
   - Free for public repos

2. **Local Deployment** (Option 2/3)
   - For testing and development
   - Full control
   - Requires Docker Desktop

---

## 📞 Need Help?

- **Documentation:** See `DEPLOYMENT.md` for detailed guide
- **GitHub Actions:** See `GITHUB_DEPLOY.md`
- **Quick Start:** See `QUICKSTART.md`
- **Discord:** https://discord.gg/cloudflaredev
- **Support:** https://community.cloudflare.com/

---

## ✅ Current Status

Your project is **ready to deploy** with any of the above methods!

All credentials are configured and the code is built.

Choose your preferred deployment method and let's go! 🚀
