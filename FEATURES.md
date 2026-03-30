# 🚀 OpenCode Agent - Complete Feature Guide

Your fully-loaded AI coding agent on Cloudflare Workers with comprehensive tools and MCP integration.

## 📦 What's Included

### Core Components

1. **OpenCode Agent** - AI-powered coding assistant
2. **Cloudflare AI Gateway** - Unified billing for all AI models  
3. **Telegram Bot** - Code anywhere via mobile
4. **MCP Servers** - Access Cloudflare documentation and tools
5. **Comprehensive Tooling** - Everything you need for development

---

## 🔧 Installed Tools & Packages

### System Tools

#### Build Essentials
- `build-essential` - GCC, G++, Make
- `cmake` - Build system generator
- `pkg-config` - Package configuration

#### Database Clients
- `postgresql-client` - PostgreSQL CLI
- `mysql-client` - MySQL CLI
- `redis-tools` - Redis CLI & tools
- `sqlite3` - SQLite CLI

#### Network Tools
- `netcat` - TCP/UDP network utility
- `telnet` - Remote connection tool
- `nmap` - Network scanner
- `ping` - Network diagnostics
- `dig` - DNS lookup
- `traceroute` - Network path tracer

#### Development Tools
- `vim` - Text editor
- `nano` - Simple text editor
- `htop` - Process monitor
- `tree` - Directory tree viewer
- `jq` - JSON processor
- `yq` - YAML processor

#### Version Control
- `git` - Distributed version control
- `git-lfs` - Git Large File Storage
- `gh` - GitHub CLI

#### Archive Tools
- `zip`, `unzip`
- `tar`, `gzip`, `bzip2`, `xz`

#### Graphics & Media
- `imagemagick` - Image manipulation
- `ffmpeg` - Video/audio processing

#### Rust Tools (via Cargo)
- `ripgrep` (rg) - Fast grep alternative
- `fd-find` (fd) - Fast find alternative
- `bat` - Cat with syntax highlighting
- `exa` - Modern ls replacement

### Python Packages

#### Core Data Science
- `numpy` 1.26.4 - Numerical computing
- `pandas` 2.2.1 - Data analysis
- `matplotlib` 3.8.3 - Plotting library
- `seaborn` 0.13.2 - Statistical visualization
- `scipy` 1.12.0 - Scientific computing
- `scikit-learn` 1.4.1 - Machine learning

#### AI & Machine Learning
- `torch` 2.2.1 - PyTorch deep learning
- `transformers` 4.38.2 - Hugging Face transformers

#### API & HTTP
- `requests` 2.31.0 - HTTP library
- `httpx` 0.27.0 - Async HTTP
- `aiohttp` 3.9.3 - Async HTTP framework

#### Web Scraping
- `beautifulsoup4` 4.12.3 - HTML parser
- `lxml` 5.1.0 - XML/HTML processor

#### Data Formats
- `pyyaml` 6.0.1 - YAML parser
- `toml` 0.10.2 - TOML parser
- `openpyxl` 3.1.2 - Excel files

#### Utilities
- `python-dotenv` 1.0.1 - Environment variables
- `click` 8.1.7 - CLI framework
- `rich` 13.7.1 - Terminal formatting
- `mcp` 0.9.0 - Model Context Protocol

### Node.js Packages

#### TypeScript & Compilers
- `typescript` 5.3.3
- `ts-node` 10.9.2
- `tsx` 4.7.1

#### Code Quality
- `prettier` 3.2.5 - Code formatter
- `eslint` 8.57.0 - Linter

#### Build Tools
- `vite` 5.1.4 - Frontend build tool
- `esbuild` 0.20.1 - JavaScript bundler

#### Package Managers
- `pnpm` 8.15.4 - Fast package manager

#### MCP Tools
- `mcp-remote` 0.4.1 - Remote MCP client

#### Cloudflare Tools
- `wrangler` 3.28.4 - Workers CLI

#### Utilities
- `nodemon` 3.1.0 - Auto-restart
- `dotenv-cli` 7.3.0 - Environment loader

---

## 🌐 MCP (Model Context Protocol) Integration

### Available MCP Servers

Your agent can access these Cloudflare MCP servers:

| Server | Endpoint | Purpose |
|--------|----------|---------|
| **Documentation** | `docs.mcp.cloudflare.com` | Search Cloudflare docs |
| **Worker Bindings** | `bindings.mcp.cloudflare.com` | Storage, AI, compute |
| **Worker Builds** | `builds.mcp.cloudflare.com` | Build management |
| **Observability** | `observability.mcp.cloudflare.com` | Logs & analytics |
| **Radar** | `radar.mcp.cloudflare.com` | Internet insights |
| **Container** | `containers.mcp.cloudflare.com` | Sandbox environments |
| **Browser** | `browser.mcp.cloudflare.com` | Web scraping |
| **AI Gateway** | `ai-gateway.mcp.cloudflare.com` | AI Gateway logs |

### MCP API Endpoints

#### List Available MCP Servers
```bash
GET /mcp/servers
```

Response:
```json
{
  "servers": [
    {
      "id": "docs",
      "name": "Cloudflare Documentation",
      "url": "https://docs.mcp.cloudflare.com/mcp",
      "description": "Get up to date reference information on Cloudflare"
    }
  ]
}
```

#### Search Cloudflare Documentation
```bash
POST /mcp/docs/search
Content-Type: application/json

{
  "query": "How to deploy a Worker?"
}
```

Response:
```json
{
  "result": "To deploy a Worker, use the wrangler CLI: wrangler deploy..."
}
```

#### List Tools from MCP Server
```bash
GET /mcp/tools/{serverId}
```

Example:
```bash
curl https://opencode-agent.visatk-us.workers.dev/mcp/tools/docs
```

#### Call MCP Tool
```bash
POST /mcp/call/{serverId}
Content-Type: application/json

{
  "tool": "search-docs",
  "params": {
    "query": "Durable Objects"
  }
}
```

---

## 🤖 Telegram Bot Features

### Commands

- `/start` - Initialize bot and see welcome
- `/help` - Show commands and usage
- `/new` - Start a new coding session

### Capabilities

1. **Ask coding questions** - Get instant answers
2. **Debug code** - Paste code and get help
3. **Generate code** - Request implementations
4. **Code review** - Get feedback on your code
5. **Learn concepts** - Ask "how does X work?"

### Example Interactions

```
You: How do I read a CSV file in Python?

Bot: Here's how to read a CSV file in Python...
[provides complete example with pandas]
```

```
You: Debug this code:
def hello()
    print("hi")

Bot: The issue is a missing colon after the function definition...
[provides fixed code with explanation]
```

---

## 🌍 API Endpoints

### Health & Status

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "opencode_version": "1.1.40",
  "ai_gateway": "enabled",
  "telegram_bot": "configured",
  "mcp_servers": 8,
  "timestamp": "2026-03-30T08:00:00.000Z"
}
```

### Coding Agent API

#### Create Session & Send Prompt
```bash
POST /api/prompt
Content-Type: application/json

{
  "prompt": "Write a REST API in Python",
  "sessionId": "optional-existing-session",
  "model": "anthropic/claude-sonnet-4-5"
}
```

#### List Sessions
```bash
GET /api/sessions
```

#### Execute Shell Command
```bash
POST /api/exec
Content-Type: application/json

{
  "command": "python --version"
}
```

#### Run Python Code
```bash
POST /api/run-code
Content-Type: application/json

{
  "code": "import sys; print(sys.version)",
  "language": "python"
}
```

---

## 💻 Development Environment

### Pre-configured Aliases

The container includes useful shell aliases:

```bash
ll          # ls -lah
gs          # git status
gp          # git pull
dc          # docker-compose
```

### Environment Variables

- `EDITOR=nano` - Default text editor
- `PATH` includes:
  - `/root/.opencode/bin` - OpenCode CLI
  - `/root/.cargo/bin` - Rust tools
  - Standard system paths

### Workspace

Default workspace: `/home/user/workspace`

Pre-cloned: Cloudflare Agents examples repository

---

## 🎯 Use Cases

### 1. **Code Generation**
Ask the agent to write code in any language:
```
"Create a RESTful API for a todo app using FastAPI"
"Write a React component for a login form"
"Build a CLI tool in Go that parses JSON"
```

### 2. **Debugging**
Paste code and get instant debugging:
```
"Why is this code not working?"
"Fix the syntax error in this Python function"
"This JavaScript gives undefined, help!"
```

### 3. **Code Review**
Get feedback on your implementations:
```
"Review this function for best practices"
"Is this code secure?"
"How can I optimize this algorithm?"
```

### 4. **Learning**
Ask questions about programming concepts:
```
"Explain async/await in JavaScript"
"What's the difference between TCP and UDP?"
"How do I use Docker volumes?"
```

### 5. **Documentation Search**
Use MCP to search Cloudflare docs:
```
POST /mcp/docs/search
{"query": "How to use Workers KV?"}
```

### 6. **Data Analysis**
Run Python code with full data science stack:
```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('data.csv')
df.describe()
```

### 7. **Web Scraping**
Use BeautifulSoup and requests:
```python
from bs4 import BeautifulSoup
import requests

response = requests.get('https://example.com')
soup = BeautifulSoup(response.text, 'html.parser')
```

### 8. **Image Processing**
Use ImageMagick and Python libraries:
```bash
convert input.jpg -resize 50% output.jpg
```

### 9. **Video Processing**
Use ffmpeg for media manipulation:
```bash
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4
```

### 10. **Database Operations**
Connect to databases:
```bash
psql -h localhost -U user -d database
redis-cli -h localhost ping
sqlite3 mydb.db
```

---

## 📊 Monitoring & Analytics

### Logs

View real-time logs:
```bash
npx wrangler tail opencode-agent
```

### AI Gateway Analytics

Monitor AI usage:
```
https://dash.cloudflare.com/[account-id]/ai/ai-gateway
```

Metrics include:
- Request volume
- Token usage
- Cost breakdown
- Cache hit rate
- Error rates
- Model performance

### Telegram Analytics

View bot statistics:
1. Message @BotFather
2. Send `/mybots`
3. Select your bot
4. View statistics

---

## 🔐 Security Features

### Isolation
- Each user gets isolated sandbox
- Sessions are private per user
- No data sharing between users

### Authentication
- Telegram: Bot token authentication
- API: User ID-based isolation
- MCP: Cloudflare API token

### Rate Limiting
- Configure via AI Gateway
- Prevent abuse
- Control costs

---

## 🚀 Performance

### Cold Start
- First request: ~2-3 seconds
- Subsequent: <500ms

### Optimization
- Container instance reuse
- AI Gateway caching
- Pre-installed dependencies

### Scaling
- Auto-scales on Cloudflare edge
- Global distribution
- 10+ concurrent containers

---

## 📚 Documentation Links

- **OpenCode**: https://opencode.ai/docs/
- **Sandbox SDK**: https://developers.cloudflare.com/sandbox/
- **AI Gateway**: https://developers.cloudflare.com/ai-gateway/
- **MCP Spec**: https://modelcontextprotocol.io/
- **Cloudflare Docs**: https://developers.cloudflare.com/

---

## 🎉 Getting Started

1. **Set up AI Gateway** - See [AI_GATEWAY_SETUP.md](./AI_GATEWAY_SETUP.md)
2. **Configure Telegram** (optional) - See [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)
3. **Deploy** - `git push` triggers auto-deployment
4. **Test** - Try the health endpoint
5. **Use** - Start coding with your AI agent!

---

## 💡 Pro Tips

1. **Use specific prompts** - "Write a FastAPI endpoint" vs "Write an API"
2. **Leverage MCP** - Search docs before asking general questions
3. **Cache responses** - Enable AI Gateway caching to save costs
4. **Monitor usage** - Check dashboard regularly
5. **Update tools** - Rebuild Docker image for latest packages
6. **Use sessions** - Maintain context across conversations
7. **Try different models** - Claude Sonnet for speed, Opus for quality
8. **Batch requests** - Multiple questions in one prompt

---

## 🐛 Troubleshooting

See [DEPLOYMENT.md](./DEPLOYMENT.md) for common issues and solutions.

For tool-specific issues:
- Python: Check `pip list`
- Node: Check `npm list -g`
- Rust: Check `cargo --version`
- Database: Test client connections

---

## 🎊 You're Ready!

Your OpenCode agent is now a fully-featured AI coding assistant with:
- ✅ 100+ pre-installed tools
- ✅ AI Gateway unified billing
- ✅ Telegram bot interface
- ✅ MCP documentation access
- ✅ Complete data science stack
- ✅ Database clients
- ✅ Web scraping tools
- ✅ Media processing
- ✅ And much more!

**Start coding smarter, not harder!** 🚀
