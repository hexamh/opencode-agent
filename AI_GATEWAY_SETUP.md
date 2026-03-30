# Cloudflare AI Gateway Setup

Your OpenCode agent now uses Cloudflare AI Gateway for **unified billing** - no need for provider API keys!

## 🌟 Benefits

- ✅ **Unified Billing** - One bill for all AI providers (Anthropic, OpenAI, etc.)
- ✅ **Request Caching** - Reduce costs and latency
- ✅ **Rate Limiting** - Control usage automatically
- ✅ **Analytics** - Monitor all AI requests in one place
- ✅ **No Provider Keys** - Cloudflare handles authentication

## 🚀 Quick Setup (5 minutes)

### Step 1: Create AI Gateway

1. Go to your AI Gateway dashboard:
   ```
   https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/ai/ai-gateway
   ```

2. Click **"Create Gateway"**

3. Enter gateway name:
   ```
   opencode-gateway
   ```

4. Click **"Create"**

5. **Copy the Gateway ID** - you'll need this!

### Step 2: Add Secrets to GitHub

1. Go to repository secrets:
   ```
   https://github.com/hexamh/opencode-agent/settings/secrets/actions
   ```

2. Update or add these secrets:

#### CLOUDFLARE_GATEWAY_ID
- **Name:** `CLOUDFLARE_GATEWAY_ID`
- **Value:** Your gateway ID from Step 1 (e.g., `opencode-gateway`)

The other secrets are already configured:
- ✅ `CLOUDFLARE_ACCOUNT_ID`: `7416e7b5d307baabca87e8fba69158e5`
- ✅ `CLOUDFLARE_API_TOKEN`: Already set

### Step 3: Redeploy

Push the changes to trigger deployment:

```bash
cd /home/openclaw/.openclaw/workspace/opencode-agent
git push origin main
```

Or trigger manually in GitHub Actions:
1. Go to: https://github.com/hexamh/opencode-agent/actions
2. Click "Deploy to Cloudflare Workers"
3. Click "Run workflow"

### Step 4: Test

After deployment (~5 minutes):

```bash
# Health check
curl https://opencode-agent.visatk-us.workers.dev/health

# Should show:
# {
#   "status": "healthy",
#   "ai_gateway": "enabled",
#   ...
# }
```

## 📊 Available Models

Your agent can now use these models through AI Gateway:

### Anthropic
- `anthropic/claude-sonnet-4-5` - Latest Claude (recommended)
- `anthropic/claude-opus-4-6` - Most capable
- `anthropic/claude-sonnet-3-5-20241022` - Previous generation

### OpenAI
- `openai/gpt-4o` - Multimodal GPT-4
- `openai/o1` - Advanced reasoning

**No API keys needed!** Cloudflare manages everything.

## 💰 Billing

### How It Works

1. **AI Gateway credits** - Purchase from Cloudflare dashboard
2. **Unified billing** - All models on one invoice
3. **No upfront costs** - Pay only for what you use
4. **Volume discounts** - Automatic savings at scale

### Purchase Credits

1. Go to: https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/ai/ai-gateway
2. Click your gateway (`opencode-gateway`)
3. Go to **"Billing"** tab
4. Click **"Add Credits"**
5. Select amount and purchase

### Monitor Usage

View real-time usage:
```
https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/ai/ai-gateway/opencode-gateway/analytics
```

See:
- Requests per model
- Token usage
- Cost breakdown
- Cache hit rates
- Error rates

## ⚙️ Gateway Configuration

### Enable Caching

Save money by caching responses:

1. Go to gateway settings
2. Enable **"Cache Responses"**
3. Set cache TTL (e.g., 1 hour)

Identical requests return cached results - **zero cost**!

### Set Rate Limits

Control costs automatically:

1. Go to gateway settings
2. Enable **"Rate Limiting"**
3. Set limits:
   - Requests per minute: 100
   - Tokens per minute: 100,000

### Configure Logging

Track every request:

1. Go to gateway settings
2. Enable **"Request Logging"**
3. View detailed logs in dashboard

## 🔧 Advanced Configuration

### Add More Models

Update `src/index.ts` to add models:

```typescript
const getConfig = (env: Env): Config => ({
  provider: {
    'cloudflare-ai-gateway': {
      options: {
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        gatewayId: env.CLOUDFLARE_GATEWAY_ID,
        apiToken: env.CLOUDFLARE_API_TOKEN,
      },
      models: {
        // Add any model available in AI Gateway
        'anthropic/claude-sonnet-4-5': {},
        'openai/gpt-4o-mini': {},  // Cheaper option
        'google/gemini-2-5-pro': {}, // Google models
      },
    },
  },
});
```

### Change Default Model

In the Telegram bot handler or API, specify model:

```typescript
const result = await client.session.prompt({
  sessionID: sessionId,
  parts: [{ type: 'text', text: userMessage }],
  model: {
    providerID: 'cloudflare-ai-gateway',
    modelID: 'anthropic/claude-opus-4-6', // Use different model
  },
});
```

### Multiple Gateways

Create separate gateways for dev/staging/prod:

1. Create `opencode-gateway-dev`
2. Create `opencode-gateway-prod`
3. Use environment-specific secrets in GitHub

## 📈 Analytics & Monitoring

### Real-Time Dashboard

View live statistics:
```
https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/ai/ai-gateway/opencode-gateway
```

Metrics include:
- **Request volume** - Requests per second
- **Token usage** - Input/output tokens
- **Latency** - p50, p95, p99
- **Error rates** - Success vs failures
- **Cache hit rate** - Cost savings
- **Model breakdown** - Usage per model

### Export Data

Download analytics as CSV:
1. Go to Analytics tab
2. Select date range
3. Click **"Export"**

### Set Alerts

Get notified about issues:
1. Go to Notifications
2. Create alert for:
   - High error rate
   - Budget exceeded
   - Unusual traffic

## 🔐 Security

### API Token Permissions

Your API token needs:
- ✅ Account: AI Gateway → Read
- ✅ Account: AI Gateway → Edit

Create a new token:
```
https://dash.cloudflare.com/profile/api-tokens
```

### Rotate Secrets

Periodically update secrets:

```bash
# Generate new API token in dashboard
export NEW_TOKEN="your-new-token"

# Update GitHub secret
cd /home/openclaw/.openclaw/workspace/opencode-agent
gh secret set CLOUDFLARE_API_TOKEN --body "$NEW_TOKEN"

# Redeploy
git commit --allow-empty -m "Rotate API token"
git push
```

## 🎯 Best Practices

1. **Enable caching** - Reduce costs significantly
2. **Set rate limits** - Prevent unexpected bills
3. **Monitor usage** - Check dashboard weekly
4. **Use appropriate models** - Claude Sonnet for most tasks
5. **Configure alerts** - Get notified of issues
6. **Rotate tokens** - Update every 90 days

## 🐛 Troubleshooting

### "Gateway not found" Error

**Solution:** Verify Gateway ID is correct:
```bash
# Check secret
gh secret list

# Update if wrong
gh secret set CLOUDFLARE_GATEWAY_ID --body "opencode-gateway"
```

### "Insufficient credits" Error

**Solution:** Add more credits to gateway:
1. Go to gateway billing
2. Purchase credits
3. Retry request

### "Rate limit exceeded" Error

**Solution:** Increase limits in gateway settings or wait for reset.

### Cache Not Working

**Solution:**
1. Verify caching is enabled
2. Check TTL is set
3. Ensure requests are identical (same prompt + model)

## 📞 Support

- **Documentation:** https://developers.cloudflare.com/ai-gateway/
- **Community:** https://discord.gg/cloudflaredev
- **Dashboard:** https://dash.cloudflare.com/7416e7b5d307baabca87e8fba69158e5/ai/ai-gateway

## 🎉 You're Using AI Gateway!

Your OpenCode agent now benefits from:
- Unified billing across all AI providers
- Automatic caching and optimization
- Comprehensive analytics
- No provider API key management

Enjoy simplified AI infrastructure! 🚀

---

**Next:** Set up Telegram bot - see [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)
