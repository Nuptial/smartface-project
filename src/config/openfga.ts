export const OPENFGA_URL = 'http://127.0.0.1:8080';
export const STORE_ID = "01JM2173C3936ECZQ97E62MAQ8";
export const MODEL_ID = "01JM25TV04NV7D7SGHSH8S5J4Y";

// Admin kullanıcıları kontrol etmek için kullanılacak
const ADMIN_USERS = new Set(['admin']); // Keycloak admin kullanıcısı

export const assignUserRole = async (userId: string) => {
  try {
    // İlk kayıt olan kullanıcı admin mi kontrol et
    const isAdmin = ADMIN_USERS.has(userId);
    
    console.log('Assigning role:', { userId, isAdmin });

    if (isAdmin) {
      const writeBody = {
        authorization_model_id: MODEL_ID,
        writes: {
          tuple_keys: [{
            user: `person:${userId}`,
            relation: 'admin',
            object: 'application:default'
          }]
        }
      };

      console.log('Request body:', JSON.stringify(writeBody));

      const response = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(writeBody)
      });

      const responseText = await response.text();
      console.log('OpenFGA Response:', responseText);

      if (!response.ok) {
        throw new Error(`OpenFGA Error: ${responseText}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error assigning role in OpenFGA:', error);
    throw error;
  }
};

export const checkUserRole = async (userId: string, role: 'admin' | 'user') => {
  try {
    console.log('Checking role:', { userId, role });

    const checkBody = {
      authorization_model_id: MODEL_ID,
      tuple_key: {
        user: `person:${userId}`,
        relation: role,
        object: 'application:default'
      }
    };

    console.log('Request body:', JSON.stringify(checkBody));

    const response = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkBody)
    });

    const responseText = await response.text();
    console.log('OpenFGA Response:', responseText);

    if (!response.ok) {
      throw new Error(`OpenFGA Error: ${responseText}`);
    }

    try {
      const data = JSON.parse(responseText);
      return data.allowed;
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return false;
    }
  } catch (error) {
    console.error('Error checking role in OpenFGA:', error);
    return false; // Hata durumunda false dön
  }
};

// Yeni admin eklemek için kullanılacak fonksiyon
export const addAdminUser = async (adminId: string, currentUserId: string) => {
  try {
    // Önce mevcut kullanıcının admin olup olmadığını kontrol et
    const isAdmin = await checkUserRole(currentUserId, 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can add new admins');
    }

    // Kullanıcının zaten admin olup olmadığını kontrol et
    const isAlreadyAdmin = await checkUserRole(adminId, 'admin');
    if (isAlreadyAdmin) {
      console.log('User is already an admin:', adminId);
      return true;
    }

    console.log('Adding admin user:', adminId);

    const writeBody = {
      authorization_model_id: MODEL_ID,
      writes: {
        tuple_keys: [{
          user: `person:${adminId}`,
          relation: 'admin',
          object: 'application:default'
        }]
      }
    };

    console.log('Request body:', JSON.stringify(writeBody));

    const response = await fetch(`${OPENFGA_URL}/stores/${STORE_ID}/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(writeBody)
    });

    const responseText = await response.text();
    console.log('OpenFGA Response:', responseText);

    if (!response.ok) {
      throw new Error(`OpenFGA Error: ${responseText}`);
    }

    return true;
  } catch (error) {
    console.error('Error adding admin user:', error);
    throw error;
  }
}; 