# Telegram Bot Setup Guide

Connect your OpenCode agent to Telegram for on-the-go coding assistance!

## 🤖 Features

- 💬 Chat directly with your coding agent
- 🔒 Private sandboxed environment per user
- 🚀 Persistent sessions across conversations
- ⚡ Powered by Cloudflare AI Gateway (unified billing)
- 🌍 Works from anywhere via Telegram

## 📱 Quick Setup (5 minutes)

### Step 1: Create Your Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)

2. Send `/newbot` command

3. Choose a name for your bot:
   ```
   OpenCode Assistant
   ```

4. Choose a username (must end in 'bot'):
   ```
   your_opencode_bot
   ```

5. **Copy the bot token** - looks like:
   ```
   6123456789:AAHfB3kXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### Step 2: Add Bot Token to GitHub Secrets

1. Go to your repository secrets:
   ```
   https://github.com/hexamh/opencode-agent/settings/secrets/actions
   ```

2. Click **"New repository secret"**

3. Add the bot token:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** Your token from BotFather

4. (Optional) Add webhook secret for security:
   - **Name:** `TELEGRAM_WEBHOOK_SECRET`
   - **Value:** Any random string (e.g., `my-secret-webhook-key-123`)

### Step 3: Redeploy

The bot configuration is already in the code. Just trigger a new deployment:

**Option A: Via GitHub Actions**
1. Go to: https://github.com/hexamh/opencode-agent/actions
2. Click "Deploy to Cloudflare Workers"
3. Click "Run workflow"

**Option B: Via Git Push**
```bash
cd /home/openclaw/.openclaw/workspace/opencode-agent
git add .
git commit -m "Enable Telegram bot"
git push
```

### Step 4: Setup Webhook

After deployment completes (~5 minutes), setup the webhook:

```bash
# Visit this URL in your browser (replace with your worker URL):
https://opencode-agent.visatk-us.workers.dev/telegram/setup
```

You should see:
```json
{
  "success": true,
  "webhook_url": "https://opencode-agent.visatk-us.workers.dev/telegram/webhook",
  "telegram_response": {
    "ok": true,
    "result": true,
    "description": "Webhook was set"
  }
}
```

### Step 5: Test Your Bot!

1. Open Telegram
2. Search for your bot username (e.g., `@your_opencode_bot`)
3. Send `/start`

You should get a welcome message! 🎉

## 📖 Bot Commands

Your bot supports these commands:

- `/start` - Start the bot and see welcome message
- `/help` - Show help and available commands
- `/new` - Start a new coding session

Just send any message to get coding help:
```
Write a Python function to calculate Fibonacci numbers
```

## 🔧 Advanced Configuration

### Update Secrets After Deployment

If you need to update secrets after the worker is deployed:

```bash
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"

# Set bot token
echo "6123456789:AAHfB3kXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" | npx wrangler secret put TELEGRAM_BOT_TOKEN

# Set webhook secret (optional)
echo "my-secret-webhook-key-123" | npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

### Verify Webhook Status

Check if webhook is set correctly:

```bash
# Replace YOUR_BOT_TOKEN with your actual token
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

### Remove Webhook (for testing)

```bash
curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/deleteWebhook
```

### Test Locally

For local testing with ngrok or similar:

```bash
# Start local server
npm run dev

# In another terminal, expose with ngrok
ngrok http 8787

# Set webhook to ngrok URL
curl -X POST https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.io/telegram/webhook"}'
```

## 🎯 Usage Examples

### Ask Coding Questions
```
User: How do I read a JSON file in Python?
Bot: Here's how to read a JSON file in Python... [detailed response]
```

### Debug Code
```
User: Why is this code not working?
def hello()
    print("hi")
    
Bot: The issue is a missing colon... [explanation + fix]
```

### Get Code Reviews
```
User: Can you review this function?
def calculate(x, y):
    return x + y * 2
    
Bot: Here's my review... [suggestions]
```

### Build Projects
```
User: Create a REST API for a todo app in Python
Bot: I'll help you build a REST API... [generates complete code]
```

## 🔒 Security Features

- ✅ Each Telegram user gets isolated sandbox
- ✅ Sessions are private per user
- ✅ Webhook secret validation (optional)
- ✅ No data sharing between users
- ✅ Runs on Cloudflare's secure infrastructure

## 📊 Monitoring

### Check Bot Health

```bash
curl https://opencode-agent.visatk-us.workers.dev/health
```

Should show:
```json
{
  "status": "healthy",
  "opencode_version": "1.1.40",
  "ai_gateway": "enabled",
  "telegram_bot": "configured"
}
```

### View Logs

```bash
export CLOUDFLARE_API_TOKEN="cfat_G8o1TUYBNElf0b9GB0JvExm6m2wR6HoQQktK16X20aaf986c"
npx wrangler tail opencode-agent
```

### Telegram Bot Analytics

View your bot's usage in BotFather:
1. Message [@BotFather](https://t.me/BotFather)
2. Send `/mybots`
3. Select your bot
4. Click "Bot Settings" → "Statistics"

## 🐛 Troubleshooting

### Bot Not Responding

**Check webhook:**
```bash
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
```

Should show your worker URL and `"has_custom_certificate": false`

**Common issues:**
- Webhook not set: Visit `/telegram/setup` endpoint
- Wrong token: Update secret via `wrangler secret put`
- Worker not deployed: Check GitHub Actions logs

### "Unauthorized" Error

- Verify `TELEGRAM_BOT_TOKEN` is set correctly
- Check token hasn't expired or been revoked
- Regenerate token in BotFather if needed

### Slow Responses

- First request may be slow (cold start)
- AI Gateway may cache subsequent requests
- Consider upgrading container instance type

### Messages Too Long

Responses are automatically split if over 4096 characters.

## 💡 Tips & Best Practices

1. **Use descriptive bot names** - Makes it easy to find
2. **Set a profile picture** - Via BotFather: `/setuserpic`
3. **Add bot description** - Via BotFather: `/setdescription`
4. **Enable privacy mode OFF** - So bot can read group messages if needed
5. **Set commands** - Via BotFather: `/setcommands`

### Recommended Bot Commands (for BotFather)

```
start - Start the bot
help - Show help and commands
new - Start a new coding session
```

## 🔗 Useful Links

- **BotFather:** https://t.me/BotFather
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Your Repository:** https://github.com/hexamh/opencode-agent
- **Worker Dashboard:** https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/workers

## 🎉 You're All Set!

Your OpenCode agent is now available on Telegram! Start chatting and enjoy coding assistance wherever you are! 📱✨

Need help? Check the main [README.md](./README.md) or [DEPLOYMENT.md](./DEPLOYMENT.md).
