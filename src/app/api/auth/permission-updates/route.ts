import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

declare global {
  var connections: Map<string, { 
    controller: ReadableStreamDefaultController; 
    username: string; 
    keepAlive: NodeJS.Timeout;
  }>;
}

if (!global.connections) {
  global.connections = new Map();
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    const tokenData = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const username = tokenData.preferred_username;

    console.log('New SSE connection request from:', username);

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial message
        controller.enqueue(encoder.encode('event: connected\ndata: Connection established\n\n'));

        // Keep connection alive
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(':\n\n'));
          } catch (error) {
            console.error('Error sending keepalive:', error);
            clearInterval(keepAlive);
          }
        }, 30000);

        // Store the connection for later use
        const connectionId = Date.now().toString();
        console.log('Storing connection for user:', username, 'with id:', connectionId);
        
        global.connections.set(connectionId, {
          controller,
          username,
          keepAlive
        });

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          console.log('Connection aborted for user:', username, 'with id:', connectionId);
          clearInterval(keepAlive);
          global.connections.delete(connectionId);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in SSE connection:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 