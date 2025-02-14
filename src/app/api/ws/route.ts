import { NextResponse } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';

declare global {
  var clients: Map<string, WebSocket>;
  var wss: WebSocketServer | null;
}

// Initialize global variables
if (!global.clients) {
  global.clients = new Map();
}

if (process.env.NODE_ENV !== 'production') {
  if (!global.wss) {
    try {
      global.wss = new WebSocketServer({ port: 3002 });
      console.log('WebSocket server started on port 3002');

      global.wss.on('connection', (ws) => {
        console.log('New WebSocket connection established');
        let clientUsername: string | null = null;

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);

            if (data.type === 'register' && data.username) {
              clientUsername = data.username;
              global.clients.set(data.username, ws);
              console.log('Client registered:', data.username);
              console.log('Current clients:', Array.from(global.clients.keys()));
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'registered',
                username: data.username
              }));
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        });

        ws.on('close', () => {
          if (clientUsername) {
            global.clients.delete(clientUsername);
            console.log('Client disconnected:', clientUsername);
            console.log('Remaining clients:', Array.from(global.clients.keys()));
          }
        });

        ws.on('error', (error) => {
          console.error('WebSocket connection error:', error);
          if (clientUsername) {
            global.clients.delete(clientUsername);
          }
        });
      });

      global.wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
      });
    } catch (error) {
      console.error('Error initializing WebSocket server:', error);
      global.wss = null;
    }
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'WebSocket server is running',
    connectedClients: Array.from(global.clients.keys())
  });
} 