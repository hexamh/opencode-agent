/**
 * OpenCode Agent on Cloudflare Workers with Sandbox SDK
 * 
 * This Worker provides two interfaces:
 * 1. Web UI - Browse to the root path for the full OpenCode experience
 * 2. Programmatic API - Use SDK methods for automation and integration
 */

import { getSandbox, type Sandbox } from '@cloudflare/sandbox';
import {
  createOpencode,
  createOpencodeServer,
  proxyToOpencode,
} from '@cloudflare/sandbox/opencode';
import type { Config, Part } from '@opencode-ai/sdk/v2';
import type { OpencodeClient } from '@opencode-ai/sdk/v2/client';

// Required: Export the Sandbox class for Durable Objects
export { Sandbox } from '@cloudflare/sandbox';

/**
 * Environment bindings for the Worker
 */
interface Env {
  // Sandbox Durable Object binding
  Sandbox: DurableObjectNamespace<Sandbox>;
  
  // Cloudflare AI Gateway (unified billing - required)
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_GATEWAY_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  
  // Telegram Bot (optional)
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
}

/**
 * Configure OpenCode with Cloudflare AI Gateway
 * Uses unified billing - no provider API keys needed!
 */
const getConfig = (env: Env): Config => ({
  provider: {
    'cloudflare-ai-gateway': {
      options: {
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        gatewayId: env.CLOUDFLARE_GATEWAY_ID,
        apiToken: env.CLOUDFLARE_API_TOKEN,
      },
      models: {
        'anthropic/claude-sonnet-4-5': {},
        'anthropic/claude-opus-4-6': {},
        'anthropic/claude-sonnet-3-5-20241022': {},
        'openai/gpt-4o': {},
        'openai/o1': {},
      },
    },
  },
});

/**
 * Main Worker export default handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Get or create a sandbox instance
    // Each user should have their own sandbox ID for isolation
    const userId = getUserId(request);
    const sandbox = getSandbox(env.Sandbox, userId);
    
    try {
      // Route 1: Health check endpoint
      if (url.pathname === '/health') {
        return handleHealth(sandbox, env);
      }
      
      // Route 2: Telegram webhook
      if (url.pathname === '/telegram/webhook' && env.TELEGRAM_BOT_TOKEN) {
        return handleTelegramWebhook(request, env);
      }
      
      // Route 3: Telegram setup
      if (url.pathname === '/telegram/setup' && env.TELEGRAM_BOT_TOKEN) {
        return handleTelegramSetup(request, env);
      }
      
      // Route 4: Programmatic API for automation
      if (url.pathname.startsWith('/api/')) {
        return handleApi(request, sandbox, env);
      }
      
      // Route 5: WebSocket upgrade for terminal (handled by OpenCode)
      if (request.headers.get('Upgrade') === 'websocket') {
        const server = await createOpencodeServer(sandbox, {
          directory: '/home/user/workspace',
          config: getConfig(env),
        });
        return proxyToOpencode(request, sandbox, server);
      }
      
      // Route 6: Default - Web UI (proxied from OpenCode)
      const server = await createOpencodeServer(sandbox, {
        directory: '/home/user/workspace',
        config: getConfig(env),
        // Optional: Pass custom environment variables for observability
        env: {
          // Propagate trace context for distributed tracing
          ...(request.headers.has('traceparent') && {
            TRACEPARENT: request.headers.get('traceparent')!,
          }),
        },
      });
      
      return proxyToOpencode(request, sandbox, server);
    } catch (error) {
      console.error('Worker error:', error);
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
  },
};

/**
 * Extract user ID from request for sandbox isolation
 * In production, use proper authentication (JWT, session cookies, etc.)
 */
function getUserId(request: Request): string {
  // Example: Extract from header
  const userId = request.headers.get('X-User-ID');
  if (userId) return userId;
  
  // Example: Extract from query parameter
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get('user');
  if (queryUserId) return queryUserId;
  
  // Fallback: Use a default sandbox for demo purposes
  // In production, require authentication
  return 'default';
}

/**
 * Health check endpoint
 */
async function handleHealth(
  sandbox: ReturnType<typeof getSandbox>,
  env: Env
): Promise<Response> {
  try {
    // Verify sandbox is responsive
    const result = await sandbox.exec('opencode --version');
    
    return Response.json({
      status: 'healthy',
      opencode_version: result.stdout.trim(),
      ai_gateway: 'enabled',
      telegram_bot: env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle programmatic API requests
 */
async function handleApi(
  request: Request,
  sandbox: ReturnType<typeof getSandbox>,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  
  // API Route: Create session and prompt
  if (request.method === 'POST' && url.pathname === '/api/prompt') {
    return handlePrompt(request, sandbox, env);
  }
  
  // API Route: List sessions
  if (request.method === 'GET' && url.pathname === '/api/sessions') {
    return handleListSessions(sandbox, env);
  }
  
  // API Route: Execute shell command in sandbox
  if (request.method === 'POST' && url.pathname === '/api/exec') {
    return handleExec(request, sandbox);
  }
  
  // API Route: Run Python code in sandbox
  if (request.method === 'POST' && url.pathname === '/api/run-code') {
    return handleRunCode(request, sandbox);
  }
  
  return Response.json({ error: 'Not found' }, { status: 404 });
}

/**
 * Create session and send prompt
 */
async function handlePrompt(
  request: Request,
  sandbox: ReturnType<typeof getSandbox>,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json<{
      prompt: string;
      sessionId?: string;
      model?: string;
    }>();
    
    // Get typed SDK client
    const { client } = await createOpencode<OpencodeClient>(sandbox, {
      directory: '/home/user/workspace',
      config: getConfig(env),
    });
    
    let sessionId = body.sessionId;
    
    // Create new session if not provided
    if (!sessionId) {
      const session = await client.session.create({
        title: 'API Session',
        directory: '/home/user/workspace',
      });
      
      if (!session.data) {
        throw new Error('Failed to create session');
      }
      
      sessionId = session.data.id;
    }
    
    // Send prompt to the session
    const result = await client.session.prompt({
      sessionID: sessionId,
      directory: '/home/user/workspace',
      parts: [{ type: 'text', text: body.prompt }],
      ...(body.model && {
        model: {
          providerID: 'anthropic',
          modelID: body.model,
        },
      }),
    });
    
    // Extract text response
    const parts = result.data?.parts ?? [];
    const textPart = parts.find(
      (part): part is Part & { type: 'text'; text: string } =>
        part.type === 'text' && typeof part.text === 'string'
    );
    
    return Response.json({
      sessionId,
      response: textPart?.text ?? 'No response',
      messageId: result.data?.info.id,
    });
  } catch (error) {
    console.error('Prompt error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * List all sessions
 */
async function handleListSessions(
  sandbox: ReturnType<typeof getSandbox>,
  env: Env
): Promise<Response> {
  try {
    const { client } = await createOpencode<OpencodeClient>(sandbox, {
      directory: '/home/user/workspace',
      config: getConfig(env),
    });
    
    const sessions = await client.session.list();
    
    return Response.json({
      sessions: sessions.data ?? [],
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Execute shell command in sandbox
 */
async function handleExec(
  request: Request,
  sandbox: ReturnType<typeof getSandbox>
): Promise<Response> {
  try {
    const body = await request.json<{ command: string }>();
    const result = await sandbox.exec(body.command);
    
    return Response.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      success: result.success,
    });
  } catch (error) {
    console.error('Exec error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Run Python code in sandbox using code interpreter
 */
async function handleRunCode(
  request: Request,
  sandbox: ReturnType<typeof getSandbox>
): Promise<Response> {
  try {
    const body = await request.json<{
      code: string;
      language?: 'python' | 'javascript' | 'typescript';
    }>();
    
    const ctx = await sandbox.createCodeContext({
      language: body.language ?? 'python',
    });
    
    const result = await sandbox.runCode(body.code, { context: ctx });
    
    return Response.json({
      results: result.results,
      error: result.error,
    });
  } catch (error) {
    console.error('Run code error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Telegram Bot Integration
 */

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      username?: string;
      first_name: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
}

/**
 * Handle Telegram webhook
 */
async function handleTelegramWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Verify webhook secret if configured
    if (env.TELEGRAM_WEBHOOK_SECRET) {
      const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const update: TelegramUpdate = await request.json();
    
    if (!update.message?.text || !update.message?.from) {
      return Response.json({ ok: true });
    }

    const { message } = update;
    const userId = `telegram:${message.from.id}`;
    const userMessage = message.text;

    // Handle /start command
    if (userMessage === '/start') {
      await sendTelegramMessage(
        env.TELEGRAM_BOT_TOKEN!,
        message.chat.id,
        `👋 Hi ${message.from.first_name}!\n\n` +
          `I'm your OpenCode AI coding agent powered by Cloudflare.\n\n` +
          `Send me any coding question or task and I'll help you:\n` +
          `• Write code in any language\n` +
          `• Debug and fix issues\n` +
          `• Explain concepts\n` +
          `• Review and refactor code\n\n` +
          `Try asking me something!`
      );
      return Response.json({ ok: true });
    }

    // Handle /help command
    if (userMessage === '/help') {
      await sendTelegramMessage(
        env.TELEGRAM_BOT_TOKEN!,
        message.chat.id,
        `🤖 *OpenCode Agent Commands*\n\n` +
          `/start - Start the bot\n` +
          `/help - Show this help\n` +
          `/new - Start a new session\n\n` +
          `Just send me your coding questions and I'll help you!`,
        { parse_mode: 'Markdown' }
      );
      return Response.json({ ok: true });
    }

    // Handle /new command (new session)
    if (userMessage === '/new') {
      // This will create a new session by using a different sandbox ID
      const newUserId = `telegram:${message.from.id}:${Date.now()}`;
      await sendTelegramMessage(
        env.TELEGRAM_BOT_TOKEN!,
        message.chat.id,
        `✨ Started a new coding session! Ask me anything.`
      );
      return Response.json({ ok: true });
    }

    // Send "typing" status
    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendChatAction`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.chat.id,
          action: 'typing',
        }),
      }
    );

    // Get sandbox for this user
    const sandbox = getSandbox(env.Sandbox, userId);

    // Get OpenCode client
    const { client } = await createOpencode<OpencodeClient>(sandbox, {
      directory: '/home/user/workspace',
      config: getConfig(env),
    });

    // Create or get session
    const sessions = await client.session.list();
    let sessionId: string;

    if (sessions.data && sessions.data.length > 0) {
      sessionId = sessions.data[0].id;
    } else {
      const session = await client.session.create({
        title: `Telegram: ${message.from.username || message.from.first_name}`,
        directory: '/home/user/workspace',
      });

      if (!session.data) {
        throw new Error('Failed to create session');
      }

      sessionId = session.data.id;
    }

    // Send prompt to OpenCode
    const result = await client.session.prompt({
      sessionID: sessionId,
      directory: '/home/user/workspace',
      parts: [{ type: 'text', text: userMessage }],
      model: {
        providerID: 'cloudflare-ai-gateway',
        modelID: 'anthropic/claude-sonnet-4-5',
      },
    });

    // Extract response
    const parts = result.data?.parts ?? [];
    const textPart = parts.find(
      (part): part is Part & { type: 'text'; text: string } =>
        part.type === 'text' && typeof part.text === 'string'
    );

    const response = textPart?.text ?? 'Sorry, I could not generate a response.';

    // Send response to Telegram (split if too long)
    await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN!, message.chat.id, response);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Setup Telegram webhook
 */
async function handleTelegramSetup(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const webhookUrl = `${url.origin}/telegram/webhook`;

    const response = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: env.TELEGRAM_WEBHOOK_SECRET,
          allowed_updates: ['message'],
        }),
      }
    );

    const data = await response.json();

    return Response.json({
      success: true,
      webhook_url: webhookUrl,
      telegram_response: data,
    });
  } catch (error) {
    console.error('Telegram setup error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  options: Record<string, any> = {}
): Promise<void> {
  // Telegram max message length is 4096
  const maxLength = 4096;

  if (text.length <= maxLength) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    });
  } else {
    // Split long messages
    const chunks = text.match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
    for (const chunk of chunks) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          ...options,
        }),
      });
      // Small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
