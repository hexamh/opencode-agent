/**
 * MCP (Model Context Protocol) Integration
 * Provides access to Cloudflare documentation and other MCP servers
 */

export interface MCPServer {
  name: string;
  url: string;
  description: string;
}

/**
 * Available Cloudflare MCP servers
 */
export const MCP_SERVERS: Record<string, MCPServer> = {
  docs: {
    name: 'Cloudflare Documentation',
    url: 'https://docs.mcp.cloudflare.com/mcp',
    description: 'Get up to date reference information on Cloudflare products and APIs',
  },
  bindings: {
    name: 'Workers Bindings',
    url: 'https://bindings.mcp.cloudflare.com/mcp',
    description: 'Build Workers applications with storage, AI, and compute primitives',
  },
  builds: {
    name: 'Workers Builds',
    url: 'https://builds.mcp.cloudflare.com/mcp',
    description: 'Get insights and manage your Cloudflare Workers Builds',
  },
  observability: {
    name: 'Observability',
    url: 'https://observability.mcp.cloudflare.com/mcp',
    description: 'Debug and get insight into application logs and analytics',
  },
  radar: {
    name: 'Cloudflare Radar',
    url: 'https://radar.mcp.cloudflare.com/mcp',
    description: 'Get global Internet traffic insights, trends, and URL scans',
  },
  container: {
    name: 'Container Sandbox',
    url: 'https://containers.mcp.cloudflare.com/mcp',
    description: 'Spin up sandbox development environments',
  },
  browser: {
    name: 'Browser Rendering',
    url: 'https://browser.mcp.cloudflare.com/mcp',
    description: 'Fetch web pages, convert to markdown, and take screenshots',
  },
  aiGateway: {
    name: 'AI Gateway',
    url: 'https://ai-gateway.mcp.cloudflare.com/mcp',
    description: 'Search logs and get details about prompts and responses',
  },
};

/**
 * Call an MCP server tool
 */
export async function callMCPTool(
  server: MCPServer,
  toolName: string,
  params: Record<string, any>,
  apiToken?: string
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add authorization if API token is provided
  if (apiToken) {
    headers['Authorization'] = `Bearer ${apiToken}`;
  }

  const response = await fetch(server.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP call failed: ${response.status} ${response.statusText}`);
  }

  const result: any = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result;
}

/**
 * List available tools from an MCP server
 */
export async function listMCPTools(
  server: MCPServer,
  apiToken?: string
): Promise<any[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiToken) {
    headers['Authorization'] = `Bearer ${apiToken}`;
  }

  const response = await fetch(server.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list',
      params: {},
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP list tools failed: ${response.status} ${response.statusText}`);
  }

  const result: any = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  return result.result?.tools || [];
}

/**
 * Search Cloudflare documentation using the Docs MCP server
 */
export async function searchCloudFlareDocs(
  query: string,
  apiToken?: string
): Promise<string> {
  try {
    const result = await callMCPTool(
      MCP_SERVERS.docs,
      'search-docs',
      { query, limit: 5 },
      apiToken
    );

    return result.content?.[0]?.text || 'No results found';
  } catch (error) {
    console.error('CloudFlare docs search error:', error);
    return `Error searching documentation: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Get Cloudflare product information
 */
export async function getProductInfo(
  product: string,
  apiToken?: string
): Promise<string> {
  try {
    const result = await callMCPTool(
      MCP_SERVERS.docs,
      'get-product-info',
      { product },
      apiToken
    );

    return result.content?.[0]?.text || 'Product information not available';
  } catch (error) {
    console.error('Product info error:', error);
    return `Error getting product info: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}
