import { NextRequest, NextResponse } from 'next/server';
import { OPENFGA_URL, STORE_ID, MODEL_ID } from '@/config/openfga';

export async function GET(request: NextRequest) {
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

    // URL'den kontrol edilecek kullanıcıyı al
    const searchParams = request.nextUrl.searchParams;
    const usernameToCheck = searchParams.get('username') || currentUsername;

    // Admin kontrolü yap
    const checkAdminBody = {
      authorization_model_id: MODEL_ID,
      tuple_key: {
        user: `person:${currentUsername}`,
        relation: 'admin',
        object: 'application:default'
      }
    };

    const adminResponse = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkAdminBody)
    });

    if (!adminResponse.ok) {
      throw new Error('Failed to check admin status');
    }

    const adminData = await adminResponse.json();
    const isAdmin = adminData.allowed;

    // Eğer başka bir kullanıcının yetkilerini kontrol ediyorsa admin olmalı
    if (usernameToCheck !== currentUsername && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to check other users' }, { status: 403 });
    }

    // can_edit ve can_delete yetkilerini kontrol et
    const [editResponse, deleteResponse] = await Promise.all([
      fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_model_id: MODEL_ID,
          tuple_key: {
            user: `person:${usernameToCheck}`,
            relation: 'can_edit',
            object: 'application:default'
          }
        })
      }),
      fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_model_id: MODEL_ID,
          tuple_key: {
            user: `person:${usernameToCheck}`,
            relation: 'can_delete',
            object: 'application:default'
          }
        })
      })
    ]);

    const [editData, deleteData] = await Promise.all([
      editResponse.json(),
      deleteResponse.json()
    ]);

    return NextResponse.json({
      canEdit: editData.allowed,
      canDelete: deleteData.allowed
    });

  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
} 