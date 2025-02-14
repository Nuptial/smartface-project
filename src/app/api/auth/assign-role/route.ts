import { NextRequest, NextResponse } from 'next/server';
import { assignUserRole, checkUserRole } from '@/config/openfga';

// Admin kullanıcıları için sabit
const ADMIN_USERS = new Set(['admin']);

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract and decode the JWT token
    const token = authHeader.split(' ')[1];
    
    try {
      // Token'ı decode et
      const base64Payload = token.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      const tokenData = JSON.parse(payload);

      // Get username from token
      const username = tokenData.preferred_username;
      if (!username) {
        console.error('No username in token:', tokenData);
        return NextResponse.json({ error: 'No username found in token' }, { status: 400 });
      }

      console.log('Checking existing role for username:', username);

      // Önce admin rolünü kontrol et
      const isAdmin = await checkUserRole(username, 'admin');
      if (!isAdmin) {
        // Admin değilse user rolünü kontrol et
        const isUser = await checkUserRole(username, 'user');
        if (!isUser) {
          // Hiçbir rolü yoksa yeni rol ata
          console.log('No existing role found, assigning new role for:', username);
          await assignUserRole(username);
          return NextResponse.json({ 
            success: true, 
            message: 'New role assigned successfully',
            role: ADMIN_USERS.has(username) ? 'admin' : 'user'
          });
        } else {
          console.log('User role already exists for:', username);
          return NextResponse.json({ 
            success: true, 
            message: 'User role already exists',
            role: 'user'
          });
        }
      } else {
        console.log('Admin role already exists for:', username);
        return NextResponse.json({ 
          success: true, 
          message: 'Admin role already exists',
          role: 'admin'
        });
      }
    } catch (tokenError: any) {
      console.error('Token parsing error:', tokenError);
      return NextResponse.json({ 
        error: 'Token parsing error',
        details: tokenError.message 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 