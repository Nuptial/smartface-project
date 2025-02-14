import { NextRequest, NextResponse } from 'next/server';
import { OPENFGA_URL, STORE_ID, MODEL_ID } from '@/config/openfga';
import { sendPermissionUpdate } from '../../websocket';

interface TupleKey {
  user: string;
  relation: string;
  object: string;
}

interface WriteRequestBody {
  authorization_model_id: string;
  writes: {
    tuple_keys: TupleKey[];
  };
  deletes: {
    tuple_keys: TupleKey[];
  };
}

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
    const checkEditPermissionBody = {
      authorization_model_id: MODEL_ID,
      tuple_key: {
        user: `person:${currentUsername}`,
        relation: 'can_assign_edit',
        object: 'application:default'
      }
    };

    const checkDeletePermissionBody = {
      authorization_model_id: MODEL_ID,
      tuple_key: {
        user: `person:${currentUsername}`,
        relation: 'can_assign_delete',
        object: 'application:default'
      }
    };

    console.log('Checking admin permissions...');
    
    // Yetki atama izinlerini kontrol et
    const [editPermissionResponse, deletePermissionResponse] = await Promise.all([
      fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkEditPermissionBody)
      }),
      fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkDeletePermissionBody)
      })
    ]);

    if (!editPermissionResponse.ok || !deletePermissionResponse.ok) {
      console.error('Permission check failed:', {
        editStatus: editPermissionResponse.status,
        deleteStatus: deletePermissionResponse.status
      });
      throw new Error('Failed to check permissions');
    }

    const [editPermissionData, deletePermissionData] = await Promise.all([
      editPermissionResponse.json(),
      deletePermissionResponse.json()
    ]);

    const canAssignEdit = editPermissionData.allowed;
    const canAssignDelete = deletePermissionData.allowed;

    // Eğer hiçbir yetki atama izni yoksa hata dön
    if (!canAssignEdit && !canAssignDelete) {
      return NextResponse.json({ error: 'You do not have permission to assign roles' }, { status: 403 });
    }

    // Request body'den yetki güncellemelerini al
    const body = await request.json();
    const { username, canEdit, canDelete } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Mevcut yetkileri kontrol et
    const [currentEditPermission, currentDeletePermission] = await Promise.all([
      fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_model_id: MODEL_ID,
          tuple_key: {
            user: `person:${username}`,
            relation: 'can_edit',
            object: 'application:default'
          }
        })
      }).then(res => res.json()),
      fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization_model_id: MODEL_ID,
          tuple_key: {
            user: `person:${username}`,
            relation: 'can_delete',
            object: 'application:default'
          }
        })
      }).then(res => res.json())
    ]);

    const hasEditPermission = currentEditPermission.allowed;
    const hasDeletePermission = currentDeletePermission.allowed;

    // Yetkileri güncelle
    const writeBody: Partial<WriteRequestBody> = {
      authorization_model_id: MODEL_ID,
    };

    const writes: TupleKey[] = [];
    const deletes: TupleKey[] = [];

    // can_edit yetkisi - sadece can_assign_edit yetkisi varsa değiştirilebilir
    if (canAssignEdit) {
      if (canEdit && !hasEditPermission) {
        // Yetkiyi ekle (sadece yoksa)
        writes.push({
          user: `person:${username}`,
          relation: 'can_edit',
          object: 'application:default'
        });
      } else if (canEdit === false && hasEditPermission) {
        // Yetkiyi kaldır (checkbox uncheck edildiğinde)
        deletes.push({
          user: `person:${username}`,
          relation: 'can_edit',
          object: 'application:default'
        });
      }
    }

    // can_delete yetkisi - sadece can_assign_delete yetkisi varsa değiştirilebilir
    if (canAssignDelete) {
      if (canDelete && !hasDeletePermission) {
        // Yetkiyi ekle (sadece yoksa)
        writes.push({
          user: `person:${username}`,
          relation: 'can_delete',
          object: 'application:default'
        });
      } else if (canDelete === false && hasDeletePermission) {
        // Yetkiyi kaldır (checkbox uncheck edildiğinde)
        deletes.push({
          user: `person:${username}`,
          relation: 'can_delete',
          object: 'application:default'
        });
      }
    }

    // Sadece gerekli alanları ekle
    if (writes.length > 0) {
      writeBody.writes = { tuple_keys: writes };
    }
    if (deletes.length > 0) {
      writeBody.deletes = { tuple_keys: deletes };
    }

    // Eğer hiçbir değişiklik yoksa başarılı dön
    if (writes.length === 0 && deletes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No permission changes needed'
      });
    }

    // OpenFGA'ya yetki güncellemelerini gönder
    const writeResponse = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(writeBody)
    });

    if (!writeResponse.ok) {
      const errorText = await writeResponse.text();
      console.error('OpenFGA write response error:', errorText);
      throw new Error(`Failed to update permissions: ${errorText}`);
    }

    // Calculate updated permissions
    const updatedPermissions = {
      canEdit: writes.some(w => w.relation === 'can_edit') || 
              (hasEditPermission && !deletes.some(d => d.relation === 'can_edit')),
      canDelete: writes.some(w => w.relation === 'can_delete') || 
                (hasDeletePermission && !deletes.some(d => d.relation === 'can_delete'))
    };

    console.log('Permission update summary:');
    console.log('Username:', username);
    console.log('Previous permissions:', { canEdit: hasEditPermission, canDelete: hasDeletePermission });
    console.log('Updated permissions:', updatedPermissions);
    console.log('Changes:', {
      writes: writes.map(w => w.relation),
      deletes: deletes.map(d => d.relation)
    });

    // Send WebSocket notification
    try {
      await sendPermissionUpdate(username, updatedPermissions);
    } catch (error) {
      console.error('Failed to send WebSocket notification:', error);
      // Continue execution as the permissions were updated successfully
    }

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
      permissions: updatedPermissions
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update permissions';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 