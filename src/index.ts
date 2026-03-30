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
  
  // API keys for AI providers
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  
  // Optional: Cloudflare AI Gateway for unified billing
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_GATEWAY_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

/**
 * Configure OpenCode with AI providers
 * 
 * Option A: Direct provider integration (requires provider API keys)
 * Option B: Cloudflare AI Gateway (unified billing, no provider keys needed)
 */
const getConfig = (env: Env): Config => ({
  provider: {
    // Direct Anthropic provider
    ...(env.ANTHROPIC_API_KEY && {
      anthropic: {
        options: {
          apiKey: env.ANTHROPIC_API_KEY,
        },
      },
    }),
    
    // Direct OpenAI provider
    ...(env.OPENAI_API_KEY && {
      openai: {
        options: {
          apiKey: env.OPENAI_API_KEY,
        },
      },
    }),
    
    // Cloudflare AI Gateway with unified billing
    // Uncomment and configure to use AI Gateway instead of direct providers
    /*
    'cloudflare-ai-gateway': {
      options: {
        accountId: env.CLOUDFLARE_ACCOUNT_ID,
        gatewayId: env.CLOUDFLARE_GATEWAY_ID,
        apiToken: env.CLOUDFLARE_API_TOKEN,
      },
      models: {
        'anthropic/claude-sonnet-4-5': {},
        'anthropic/claude-opus-4-6': {},
        'openai/gpt-4o': {},
        'openai/o1': {},
      },
    },
    */
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
        return handleHealth(sandbox);
      }
      
      // Route 2: Programmatic API for automation
      if (url.pathname.startsWith('/api/')) {
        return handleApi(request, sandbox, env);
      }
      
      // Route 3: WebSocket upgrade for terminal (handled by OpenCode)
      if (request.headers.get('Upgrade') === 'websocket') {
        const server = await createOpencodeServer(sandbox, {
          directory: '/home/user/workspace',
          config: getConfig(env),
        });
        return proxyToOpencode(request, sandbox, server);
      }
      
      // Route 4: Default - Web UI (proxied from OpenCode)
      const server = await createOpencodeServer(sandbox, {
        directory: '/home/user/workspace',
        config: getConfig(env),
        // Optional: Pass custom environment variables for observability
        env: {
          // Propagate trace context for distributed tracing
          ...(request.headers.has('traceparent') && {
            TRACEPARENT: request.headers.get('traceparent')!,
          }),
          // Optional: Configure OpenTelemetry
          // OTEL_EXPORTER_OTLP_ENDPOINT: 'http://127.0.0.1:4318',
          // OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
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
  sandbox: ReturnType<typeof getSandbox>
): Promise<Response> {
  try {
    // Verify sandbox is responsive
    const result = await sandbox.exec('opencode --version');
    
    return Response.json({
      status: 'healthy',
      opencode_version: result.stdout.trim(),
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
