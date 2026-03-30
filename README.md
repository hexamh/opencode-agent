# OpenCode Agent on Cloudflare Workers

A production-ready AI coding agent built with OpenCode and Cloudflare Sandbox SDK. This agent runs in isolated Cloudflare containers and provides both a web UI and programmatic API.

## Features

- 🌐 **Full Web UI** - Complete OpenCode browser experience
- 🔒 **Isolated Execution** - Code runs in secure sandbox containers
- 💾 **Persistent Sessions** - Sessions survive across requests
- 🚀 **Edge Deployment** - Runs on Cloudflare's global network
- 🔌 **Programmatic API** - SDK-based automation and integration
- 🎯 **Multi-Provider** - Support for Anthropic, OpenAI, and AI Gateway

## Architecture

```
Browser → Worker → Sandbox DO → Container :4096 → OpenCode Server
                ↓
         Proxies UI from desktop.dev.opencode.ai
```

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (for local development)
- Cloudflare account (for deployment)
- AI provider API key (Anthropic or OpenAI)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your API keys:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and add your Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:8787](http://localhost:8787) in your browser to access the OpenCode web UI!

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

Your agent will be deployed to `https://opencode-agent.<your-subdomain>.workers.dev`

## Configuration

### Provider Options

#### Option A: Direct Provider Integration

Use provider API keys directly (configured in `.dev.vars`):

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
```

#### Option B: Cloudflare AI Gateway

Route requests through [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) for:

- **Unified billing** - No provider API keys needed
- **Request caching** - Reduce costs and latency
- **Rate limiting** - Control usage
- **Analytics** - Monitor all requests

Configure in `.dev.vars`:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_GATEWAY_ID=your-gateway-id
CLOUDFLARE_API_TOKEN=your-api-token
```

Then uncomment the AI Gateway configuration in `src/index.ts`:

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

### Container Configuration

Adjust container settings in `wrangler.jsonc`:

```jsonc
"containers": [
  {
    "class_name": "Sandbox",
    "image": "./Dockerfile",
    "instance_type": "basic",  // or "lite", "standard"
    "max_instances": 10        // adjust based on your needs
  }
]
```

**Instance types:**
- `lite` - Minimal resources (cheapest)
- `basic` - Standard resources (recommended)
- `standard` - More CPU and memory

### Custom Docker Image

Extend the Dockerfile to add tools and dependencies:

```dockerfile
FROM docker.io/cloudflare/sandbox:0.8.0

# Install system packages
RUN apt-get update && apt-get install -y \
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip install --no-cache-dir \
    requests \
    pandas \
    numpy \
    beautifulsoup4

# Install Node.js packages
RUN npm install -g \
    typescript \
    prettier \
    eslint
```

## API Usage

### Web UI

Access the full OpenCode experience at the root path:

```
http://localhost:8787/
```

### Programmatic API

#### Health Check

```bash
curl http://localhost:8787/health
```

Response:
```json
{
  "status": "healthy",
  "opencode_version": "1.1.40",
  "timestamp": "2025-03-30T07:00:00.000Z"
}
```

#### Create Session and Send Prompt

```bash
curl -X POST http://localhost:8787/api/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a Python function to calculate Fibonacci numbers"
  }'
```

Response:
```json
{
  "sessionId": "abc123",
  "response": "Here's a Python function...",
  "messageId": "msg_xyz"
}
```

#### List Sessions

```bash
curl http://localhost:8787/api/sessions
```

#### Execute Shell Command

```bash
curl -X POST http://localhost:8787/api/exec \
  -H "Content-Type: application/json" \
  -d '{
    "command": "python --version"
  }'
```

Response:
```json
{
  "stdout": "Python 3.11.0\n",
  "stderr": "",
  "exitCode": 0,
  "success": true
}
```

#### Run Python Code

```bash
curl -X POST http://localhost:8787/api/run-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import sys; print(sys.version)",
    "language": "python"
  }'
```

### User Isolation

In production, implement proper authentication and use user IDs for sandbox isolation:

```typescript
// Example: Extract from JWT
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const userId = decodeJwt(token).sub;
const sandbox = getSandbox(env.Sandbox, userId);
```

Or pass user ID via header:

```bash
curl -H "X-User-ID: user123" http://localhost:8787/
```

## SDK Usage

Use the OpenCode SDK directly in your Worker:

```typescript
import { createOpencode } from '@cloudflare/sandbox/opencode';
import type { OpencodeClient } from '@opencode-ai/sdk/v2/client';

const { client } = await createOpencode<OpencodeClient>(sandbox, {
  directory: '/home/user/workspace',
  config: getConfig(env),
});

// Create session
const session = await client.session.create({
  body: { title: 'My Session' },
});

// Send prompt
const result = await client.session.prompt({
  path: { id: session.data.id },
  body: {
    parts: [{ type: 'text', text: 'Hello!' }],
  },
});
```

See [OpenCode SDK docs](https://opencode.ai/docs/sdk/) for complete API reference.

## Observability

### Distributed Tracing

The Worker propagates W3C trace context to OpenCode:

```typescript
const traceparent = request.headers.get('traceparent');
const server = await createOpencodeServer(sandbox, {
  config: getConfig(env),
  env: {
    TRACEPARENT: traceparent,
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318',
  },
});
```

### Cloudflare Observability

Enable in `wrangler.jsonc`:

```jsonc
"observability": {
  "enabled": true
}
```

View logs and traces in the [Cloudflare dashboard](https://dash.cloudflare.com/).

## Troubleshooting

### Docker not running

Ensure Docker is installed and running:

```bash
docker info
```

### OpenCode version mismatch

Update the SDK version in `package.json`:

```bash
npm install @opencode-ai/sdk@latest
```

### Container fails to start

Check Wrangler logs:

```bash
npm run dev
# Check console output for errors
```

### Sandbox timeout

Increase timeout in sandbox operations:

```typescript
const result = await sandbox.exec('long-running-command', {
  timeout: 60000, // 60 seconds
});
```

## Production Checklist

- [ ] Set production secrets using `wrangler secret put`
- [ ] Configure AI Gateway for unified billing
- [ ] Implement user authentication
- [ ] Set up proper user isolation
- [ ] Enable Smart Placement for optimal routing
- [ ] Configure container instance limits
- [ ] Set up monitoring and alerting
- [ ] Test sandbox cleanup and resource limits
- [ ] Configure preview URL domain (if using port exposure)
- [ ] Set up CI/CD pipeline

## Resources

- [OpenCode Documentation](https://opencode.ai/docs/)
- [OpenCode SDK](https://opencode.ai/docs/sdk/)
- [Cloudflare Sandbox SDK](https://developers.cloudflare.com/sandbox/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)

## License

MIT
