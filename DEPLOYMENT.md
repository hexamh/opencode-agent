# Deployment Guide

This guide covers deploying the OpenCode agent to production on Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- AI provider API key (or AI Gateway configured)
- Docker (for building container images)

## Quick Deploy

### 1. Login to Cloudflare

```bash
wrangler login
```

This opens a browser window for authentication.

### 2. Configure Production Secrets

Set your API keys as Worker secrets (not in code!):

```bash
# For Anthropic
wrangler secret put ANTHROPIC_API_KEY
# Paste your API key when prompted

# For OpenAI (optional)
wrangler secret put OPENAI_API_KEY

# For AI Gateway (optional)
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_GATEWAY_ID
wrangler secret put CLOUDFLARE_API_TOKEN
```

### 3. Build and Deploy

```bash
npm run deploy
```

Your agent will be available at:
```
https://opencode-agent.<your-subdomain>.workers.dev
```

## Custom Domain

### Add a Custom Domain

1. Go to [Workers & Pages](https://dash.cloudflare.com/) dashboard
2. Select your `opencode-agent` worker
3. Go to **Settings** → **Triggers** → **Custom Domains**
4. Click **Add Custom Domain**
5. Enter your domain (e.g., `agent.yourdomain.com`)

Your agent will be available at `https://agent.yourdomain.com`

### Preview URLs (Optional)

If you use `sandbox.exposePort()` for running HTTP services, you need a wildcard domain:

1. Add a wildcard DNS record in Cloudflare:
   - Type: `A` or `CNAME`
   - Name: `*.preview`
   - Content: Your worker's IP or domain

2. Configure in your Worker:
   ```typescript
   const { url } = await sandbox.exposePort(8080);
   // url will be something like: https://abc123.preview.yourdomain.com
   ```

## Environment-Specific Configuration

### Production Settings

Update `wrangler.jsonc` for production:

```jsonc
{
  "name": "opencode-agent-prod",
  "containers": [
    {
      "class_name": "Sandbox",
      "image": "./Dockerfile",
      "instance_type": "standard",  // More resources
      "max_instances": 50           // Higher limit
    }
  ],
  "placement": { 
    "mode": "smart"  // Automatic optimal routing
  },
  "observability": {
    "enabled": true
  }
}
```

### Separate Environments

Use Wrangler environments for staging/production:

```jsonc
{
  "name": "opencode-agent",
  "env": {
    "staging": {
      "name": "opencode-agent-staging",
      "containers": [{
        "instance_type": "basic",
        "max_instances": 10
      }]
    },
    "production": {
      "name": "opencode-agent-prod",
      "containers": [{
        "instance_type": "standard",
        "max_instances": 50
      }],
      "placement": { "mode": "smart" }
    }
  }
}
```

Deploy to specific environment:

```bash
wrangler deploy --env staging
wrangler deploy --env production
```

## AI Gateway Setup

Using AI Gateway provides unified billing and monitoring without provider API keys.

### 1. Create AI Gateway

1. Go to [AI Gateway](https://dash.cloudflare.com/[account-id]/ai/ai-gateway)
2. Click **Create Gateway**
3. Name it (e.g., `opencode-gateway`)
4. Copy the Gateway ID

### 2. Configure API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Create token with permissions:
   - AI Gateway: Read & Edit
3. Copy the token

### 3. Set Secrets

```bash
wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Enter your account ID

wrangler secret put CLOUDFLARE_GATEWAY_ID
# Enter your gateway ID

wrangler secret put CLOUDFLARE_API_TOKEN
# Enter your API token
```

### 4. Enable in Code

Uncomment the AI Gateway configuration in `src/index.ts`:

```typescript
'cloudflare-ai-gateway': {
  options: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    gatewayId: env.CLOUDFLARE_GATEWAY_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
  },
  models: {
    'anthropic/claude-sonnet-4-5': {},
    'openai/gpt-4o': {},
  },
}
```

## Authentication & Security

### Implement User Authentication

The default implementation uses a simple user ID header. For production, implement proper auth:

#### Option 1: JWT Authentication

```typescript
function getUserId(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  
  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyJwt(token); // Use jose or similar library
  return decoded.sub;
}
```

#### Option 2: Cloudflare Access

Use [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/) for zero-trust authentication:

1. Enable Cloudflare Access on your domain
2. Create access policies
3. Extract user info from headers:

```typescript
function getUserId(request: Request): string {
  // Cloudflare Access provides user identity
  const email = request.headers.get('CF-Access-Authenticated-User-Email');
  if (!email) {
    throw new Error('Unauthorized');
  }
  return email;
}
```

#### Option 3: API Keys

For machine-to-machine access:

```typescript
function getUserId(request: Request): string {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) {
    throw new Error('Unauthorized');
  }
  
  // Validate API key against KV or D1
  const userId = await validateApiKey(apiKey, env);
  return userId;
}
```

### Rate Limiting

Use Cloudflare's built-in rate limiting:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Simple rate limiting using Durable Objects
    const limiter = env.RateLimiter.get(
      env.RateLimiter.idFromName(getUserId(request))
    );
    
    const allowed = await limiter.checkRateLimit();
    if (!allowed) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
    
    // Continue with normal handling...
  }
}
```

## Monitoring & Observability

### Cloudflare Workers Analytics

View real-time metrics in the dashboard:

1. Go to your Worker
2. Click **Metrics** tab
3. View:
   - Request volume
   - Errors
   - CPU time
   - Duration

### Tail Logs

Stream live logs during development:

```bash
wrangler tail opencode-agent
```

For production:

```bash
wrangler tail opencode-agent --env production
```

### Structured Logging

Use structured logging for better observability:

```typescript
function log(level: string, message: string, data?: any) {
  console.log(JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  }));
}

// Usage
log('info', 'Session created', { sessionId: '123', userId: 'user1' });
log('error', 'API error', { error: error.message, stack: error.stack });
```

### Distributed Tracing

Integrate with OpenTelemetry:

```typescript
const server = await createOpencodeServer(sandbox, {
  config: getConfig(env),
  env: {
    TRACEPARENT: request.headers.get('traceparent'),
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_ENDPOINT,
    OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
  },
});
```

## Cost Optimization

### Container Instance Management

Tune instance settings for your workload:

```jsonc
{
  "containers": [{
    "instance_type": "basic",      // Choose appropriate size
    "max_instances": 10,            // Limit concurrent instances
    "sleep_after_ms": 600000        // Sleep after 10 min idle (default)
  }]
}
```

### AI Gateway Caching

Enable caching to reduce API costs:

1. Go to AI Gateway settings
2. Enable **Cache Responses**
3. Set cache TTL

Identical requests will be served from cache.

### Smart Placement

Enable Smart Placement to route requests optimally:

```jsonc
{
  "placement": { "mode": "smart" }
}
```

This reduces latency and distributes load efficiently.

## Backup & Disaster Recovery

### Durable Objects State

Sandbox state is stored in Durable Objects with automatic replication.

To export state for backup:

```typescript
const sandbox = getSandbox(env.Sandbox, userId);
const files = await sandbox.listFiles('/home/user/workspace');

// Backup files to R2
for (const file of files) {
  const content = await sandbox.readFile(file.path);
  await env.BACKUP.put(`${userId}/${file.path}`, content);
}
```

### Session Persistence

Sessions are stored in SQLite within the Durable Object.

For long-term archival, export session data:

```typescript
const { client } = await createOpencode(sandbox, { ... });
const sessions = await client.session.list();

// Archive to D1 or R2
for (const session of sessions.data) {
  const messages = await client.session.messages({ 
    path: { id: session.id } 
  });
  
  await env.ARCHIVE.put(
    `sessions/${session.id}.json`,
    JSON.stringify({ session, messages })
  );
}
```

## CI/CD Pipeline

### GitHub Actions Example

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run typecheck
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
```

Set secrets in GitHub:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Troubleshooting

### Container Image Build Fails

Ensure Docker is running and the base image is accessible:

```bash
docker pull docker.io/cloudflare/sandbox:0.8.0
```

### Deployment Fails

Check Wrangler logs:

```bash
wrangler deploy --verbose
```

Common issues:
- Missing bindings in `wrangler.jsonc`
- Container image too large (max 500MB)
- Missing required exports

### Sandbox Timeout

Increase timeout for long-running operations:

```typescript
const result = await sandbox.exec('long-command', {
  timeout: 300000, // 5 minutes
});
```

### Memory Issues

Upgrade instance type:

```jsonc
{
  "containers": [{
    "instance_type": "standard"  // More memory
  }]
}
```

## Support

- [Cloudflare Workers Discord](https://discord.gg/cloudflaredev)
- [Cloudflare Community](https://community.cloudflare.com/)
- [OpenCode Discord](https://discord.gg/opencode)
- [GitHub Issues](https://github.com/cloudflare/sandbox-sdk/issues)
