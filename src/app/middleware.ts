import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { assignUserRole } from '@/config/openfga';

export async function middleware(request: NextRequest) {
  // Debug için request path'i
  console.log('Middleware triggered for path:', request.nextUrl.pathname);

  const token = request.cookies.get('keycloak-token');
  
  if (!token) {
    console.log('No token found');
    return NextResponse.next();
  }

  try {
    // Parse the JWT token to get user info
    const tokenData = JSON.parse(atob(token.value.split('.')[1]));
    
    // Keycloak'tan gelen kullanıcı adını kullan
    const username = tokenData.preferred_username || tokenData.username || tokenData.sub;
    console.log('Processing role assignment for user:', username);
    
    // Assign role in OpenFGA based on username
    const result = await assignUserRole(username);
    console.log('Role assignment result:', result);
    
    return NextResponse.next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return NextResponse.next();
  }
}

// Middleware'in çalışacağı path'leri belirle
export const config = {
  matcher: [
    '/home',
    '/home/:path*',
    '/api/:path*'  // API rotaları için de çalışsın
  ]
}; 