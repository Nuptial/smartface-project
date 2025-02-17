import { NextRequest, NextResponse } from 'next/server';
import { OPENFGA_URL, STORE_ID, MODEL_ID } from '@/config/openfga';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Token'dan kullanıcı bilgilerini al
    const token = authHeader.split(' ')[1];
    const tokenData = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const currentUsername = tokenData.preferred_username;

    // Admin kontrolü yap
    const checkAdminBody = {
      authorization_model_id: MODEL_ID,
      tuple_key: {
        user: `person:${currentUsername}`,
        relation: 'can_assign_admin',
        object: 'application:default'
      }
    };

    console.log('Checking admin assignment permission with body:', JSON.stringify(checkAdminBody));
    const adminResponse = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkAdminBody)
    });

    if (!adminResponse.ok) {
      const errorText = await adminResponse.text();
      console.error('Admin permission check failed:', {
        status: adminResponse.status,
        statusText: adminResponse.statusText,
        error: errorText,
        requestBody: checkAdminBody
      });
      throw new Error(`Failed to check admin assignment permission: ${errorText}`);
    }

    const adminData = await adminResponse.json();
    if (!adminData.allowed) {
      return NextResponse.json({ error: 'Only admins can assign admin role' }, { status: 403 });
    }

    // Get user information from request body
    const body = await request.json();
    const { username, isAdmin } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Update admin role
    const writeBody = {
      authorization_model_id: MODEL_ID,
      writes: {
        tuple_keys: []
      },
      deletes: {
        tuple_keys: []
      }
    };

    if (isAdmin) {
      writeBody.writes.tuple_keys.push({
        user: `person:${username}`,
        relation: 'admin',
        object: 'application:default'
      });
    } else {
      writeBody.deletes.tuple_keys.push({
        user: `person:${username}`,
        relation: 'admin',
        object: 'application:default'
      });
    }

    // Send permission update to OpenFGA
    const writeResponse = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(writeBody)
    });

    if (!writeResponse.ok) {
      const errorText = await writeResponse.text();
      console.error('OpenFGA write response error:', errorText);
      throw new Error(`Failed to update admin role: ${errorText}`);
    }

    return NextResponse.json({
      success: true,
      message: isAdmin ? 'Admin role assigned successfully' : 'Admin role removed successfully'
    });

  } catch (error) {
    console.error('Error updating admin role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update admin role';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 