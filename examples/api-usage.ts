/**
 * API Usage Examples
 * 
 * This file demonstrates how to interact with the OpenCode agent
 * programmatically using the REST API.
 */

const BASE_URL = 'http://localhost:8787';

/**
 * Example 1: Health Check
 */
async function checkHealth() {
  console.log('=== Health Check ===');
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  console.log(data);
  console.log();
}

/**
 * Example 2: Send a Prompt
 */
async function sendPrompt() {
  console.log('=== Send Prompt ===');
  const response = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Write a Python function to calculate the factorial of a number',
    }),
  });
  
  const data = await response.json();
  console.log('Session ID:', data.sessionId);
  console.log('Response:', data.response);
  console.log('Message ID:', data.messageId);
  console.log();
  
  return data.sessionId;
}

/**
 * Example 3: Continue Conversation
 */
async function continueConversation(sessionId: string) {
  console.log('=== Continue Conversation ===');
  const response = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      prompt: 'Now write a test for that function',
    }),
  });
  
  const data = await response.json();
  console.log('Response:', data.response);
  console.log();
}

/**
 * Example 4: List All Sessions
 */
async function listSessions() {
  console.log('=== List Sessions ===');
  const response = await fetch(`${BASE_URL}/api/sessions`);
  const data = await response.json();
  
  console.log(`Found ${data.sessions.length} sessions:`);
  data.sessions.forEach((session: any) => {
    console.log(`- ${session.title || session.id} (${session.id})`);
  });
  console.log();
}

/**
 * Example 5: Execute Shell Command
 */
async function executeCommand() {
  console.log('=== Execute Shell Command ===');
  const response = await fetch(`${BASE_URL}/api/exec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'python --version && node --version',
    }),
  });
  
  const data = await response.json();
  console.log('Stdout:', data.stdout);
  console.log('Stderr:', data.stderr);
  console.log('Exit Code:', data.exitCode);
  console.log();
}

/**
 * Example 6: Run Python Code
 */
async function runPythonCode() {
  console.log('=== Run Python Code ===');
  const response = await fetch(`${BASE_URL}/api/run-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `
import sys
import json

result = {
  'python_version': sys.version.split()[0],
  'platform': sys.platform,
  'calculation': sum(range(1, 101))
}

print(json.dumps(result, indent=2))
      `.trim(),
      language: 'python',
    }),
  });
  
  const data = await response.json();
  console.log('Results:');
  data.results.forEach((result: any) => {
    if (result.text) {
      console.log(result.text);
    }
  });
  console.log();
}

/**
 * Example 7: Multi-Step Workflow
 */
async function multiStepWorkflow() {
  console.log('=== Multi-Step Workflow ===');
  
  // Step 1: Create a new session and write code
  console.log('Step 1: Generate code...');
  const response1 = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Create a simple REST API server in Python using Flask with a /hello endpoint',
    }),
  });
  const data1 = await response1.json();
  const sessionId = data1.sessionId;
  console.log('✓ Code generated');
  
  // Step 2: Ask for tests
  console.log('Step 2: Generate tests...');
  const response2 = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      prompt: 'Now write pytest tests for this API',
    }),
  });
  await response2.json();
  console.log('✓ Tests generated');
  
  // Step 3: Ask for deployment instructions
  console.log('Step 3: Get deployment instructions...');
  const response3 = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      prompt: 'How would I deploy this to Cloudflare Workers?',
    }),
  });
  const data3 = await response3.json();
  console.log('✓ Deployment instructions received');
  console.log('Instructions preview:', data3.response.substring(0, 200) + '...');
  console.log();
}

/**
 * Example 8: User Isolation
 */
async function demonstrateUserIsolation() {
  console.log('=== User Isolation ===');
  
  // User 1
  const response1 = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': 'user1',
    },
    body: JSON.stringify({
      prompt: 'I am user 1. Remember this.',
    }),
  });
  const data1 = await response1.json();
  console.log('User 1 session:', data1.sessionId);
  
  // User 2
  const response2 = await fetch(`${BASE_URL}/api/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': 'user2',
    },
    body: JSON.stringify({
      prompt: 'I am user 2. Who are you talking to?',
    }),
  });
  const data2 = await response2.json();
  console.log('User 2 session:', data2.sessionId);
  console.log('✓ Users are isolated in separate sandboxes');
  console.log();
}

/**
 * Run all examples
 */
async function main() {
  console.log('OpenCode Agent API Examples\n');
  
  try {
    await checkHealth();
    const sessionId = await sendPrompt();
    await continueConversation(sessionId);
    await listSessions();
    await executeCommand();
    await runPythonCode();
    await multiStepWorkflow();
    await demonstrateUserIsolation();
    
    console.log('✓ All examples completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  checkHealth,
  sendPrompt,
  continueConversation,
  listSessions,
  executeCommand,
  runPythonCode,
  multiStepWorkflow,
  demonstrateUserIsolation,
};
