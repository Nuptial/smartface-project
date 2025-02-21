import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { assignUserRole } from '@/config/openfga';

export async function middleware(request: NextRequest) {
  // For request path debugging
  console.log('Middleware triggered for path:', request.nextUrl.pathname);

  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header found');
    return NextResponse.next();
  }

  try {
    // Extract the token from Bearer header
    const token = authHeader.split(' ')[1];
    
    // Parse the JWT token to get user info
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    
    // Use username from Keycloak
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

// Define paths where middleware will run
export const config = {
  matcher: [
    '/home',
    '/home/:path*',
    '/api/:path*'  // Also run for API routes
  ]
}; 