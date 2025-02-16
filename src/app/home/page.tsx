'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { 
  Container,
  Box, 
  Tabs, 
  Tab,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import Header from '../../components/Header';
import CarTab from './CarTab';
import UserTab from './UserTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  editSelected?: boolean;
  removeSelected?: boolean;
}

interface Car {
  image: string;
  title: string;
  start_production: number;
  class: string;
}

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<KeycloakUser[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      setIsRedirecting(true);
      router.replace('/signin');
    }
  }, [initialized, keycloak.authenticated, router]);

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      setIsRedirecting(false);
      fetchCars();
      if (userRole === 'admin') {
        fetchUsers();
      }
    }
  }, [initialized, keycloak.authenticated, userRole]);

  useEffect(() => {
    const assignRole = async () => {
      if (initialized && keycloak.authenticated && keycloak.token) {
        try {
          console.log('Attempting to assign/check role...');
          const response = await fetch('/api/auth/assign-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${keycloak.token}`
            }
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Role assignment failed:', data);
            throw new Error(data.error || 'Failed to assign role');
          }

          console.log('Role assignment successful:', data);
          setUserRole(data.role);
        } catch (error) {
          console.error('Error in role assignment:', error);
        }
      }
    };

    assignRole();
  }, [initialized, keycloak.authenticated, keycloak.token]);

  const fetchCars = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/cars');
      if (!response.ok) {
        throw new Error('Failed to fetch cars');
      }
      const data = await response.json();
      setCars(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch cars');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${keycloak.authServerUrl}/admin/realms/${keycloak.realm}/users`,
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const filteredUsers = data.filter((user: any) => user.username !== 'admin');
        
        // Her kullanıcı için yetkileri kontrol et
        const usersWithPermissions = await Promise.all(
          filteredUsers.map(async (user: any) => {
            const permissionsResponse = await fetch(`/api/auth/check-permissions?username=${user.username}`, {
              headers: {
                Authorization: `Bearer ${keycloak.token}`,
              },
            });
            
            if (permissionsResponse.ok) {
              const permissions = await permissionsResponse.json();
              return {
                ...user,
                editSelected: permissions.canEdit || false,
                removeSelected: permissions.canDelete || false
              };
            }
            return {
              ...user,
              editSelected: false,
              removeSelected: false
            };
          })
        );

        setUsers(usersWithPermissions);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await keycloak.logout({
        redirectUri: window.location.origin + '/signin'
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUserEditCheckboxChange = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, editSelected: !user.editSelected } : user
    ));
  };

  const handleUserRemoveCheckboxChange = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, removeSelected: !user.removeSelected } : user
    ));
  };

  const handleSaveUsers = async () => {
    try {
      // Seçili kullanıcıları bul
      const usersToUpdate = users.filter(user => 
        user.editSelected !== undefined || user.removeSelected !== undefined
      );

      // Her bir kullanıcı için yetkileri güncelle
      for (const user of usersToUpdate) {
        const response = await fetch('/api/auth/update-permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keycloak.token}`
          },
          body: JSON.stringify({
            username: user.username,
            canEdit: user.editSelected || false,
            canDelete: user.removeSelected || false
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to update permissions for ${user.username}`);
        }
      }

      // Başarılı mesajı göster
      setSnackbarMessage('User permissions updated successfully');
      setOpenSnackbar(true);
      
      // Kullanıcı listesini yenile
      await fetchUsers();
    } catch (error) {
      console.error('Error saving user permissions:', error);
      setSnackbarMessage('Failed to update permissions');
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  if (isRedirecting || !initialized || !userRole) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Header username={keycloak.tokenParsed?.preferred_username} onLogout={handleLogout} />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {userRole === 'admin' ? (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Cars" />
                <Tab label="Users" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <CarTab
                cars={cars}
                isLoading={isLoading}
                error={error}
                onEditCar={() => {}}
                onDeleteCar={() => {}}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <UserTab
                users={users}
                onSaveUsers={handleSaveUsers}
                onEditCheckboxChange={handleUserEditCheckboxChange}
                onRemoveCheckboxChange={handleUserRemoveCheckboxChange}
              />
            </TabPanel>
          </>
        ) : (
          <Box>
            <CarTab
              cars={cars}
              isLoading={isLoading}
              error={error}
              onEditCar={() => {}}
              onDeleteCar={() => {}}
            />
          </Box>
        )}
      </Container>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarMessage.includes('Failed') ? 'error' : 'success'} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 