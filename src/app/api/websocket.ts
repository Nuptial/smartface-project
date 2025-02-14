import { WebSocket } from 'ws';

declare global {
  var clients: Map<string, WebSocket>;
}

// Initialize global variables if they don't exist
if (!global.clients) {
  global.clients = new Map();
}

export function sendPermissionUpdate(username: string, permissions: { canEdit: boolean; canDelete: boolean }) {
  console.log('Attempting to send permission update to:', username);
  console.log('Current connected clients:', Array.from(global.clients.keys()));
  
  const client = global.clients.get(username);
  
  if (!client) {
    console.log('Client not found for username:', username);
    return;
  }

  if (client.readyState !== WebSocket.OPEN) {
    console.log('Client connection not open. ReadyState:', client.readyState);
    return;
  }

  try {
    const message = JSON.stringify({
      type: 'permission_update',
      permissions: {
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete
      }
    });
    
    console.log('Sending WebSocket message:', message);
    client.send(message);
    console.log('Permission update sent successfully to:', username);
  } catch (error) {
    console.error('Error sending permission update:', error);
    // Try to clean up if there's an error
    if (error instanceof Error && error.message.includes('not open')) {
      console.log('Removing disconnected client:', username);
      global.clients.delete(username);
    }
  }
} 