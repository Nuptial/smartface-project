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
  Alert,
  Typography,
  Paper,
  styled
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PeopleIcon from '@mui/icons-material/People';
import Header from '../../components/Header';
import CarTab from './CarTab';
import UserTab from './UserTab';

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: '5rem',
  paddingBottom: '2rem',
  position: 'relative',
  zIndex: 1
}));

const DashboardHeader = styled(Box)(({ theme }) => ({
  marginBottom: '2rem',
  position: 'relative',
  '& h1': {
    fontSize: '1.75rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem'
  },
  '& p': {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem'
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: '2rem',
  minHeight: 'unset',
  '& .MuiTabs-indicator': {
    backgroundColor: 'var(--primary-dark)',
    height: '2px'
  }
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  padding: '0.75rem 1.5rem',
  minHeight: 'unset',
  opacity: 0.7,
  '&.Mui-selected': {
    color: 'var(--primary-dark)',
    fontWeight: 500,
    opacity: 1
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
    marginRight: '0.5rem',
    marginBottom: '0'
  }
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '400px'
}));

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
  const [tabValue, setTabValue] = useState<number | null>(null);
  const [users, setUsers] = useState<KeycloakUser[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isRoleCheckComplete, setIsRoleCheckComplete] = useState(false);

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
          // Set initial tab based on role
          setTabValue(data.role === 'admin' ? 1 : 0);
          setIsRoleCheckComplete(true);
        } catch (error) {
          console.error('Error in role assignment:', error);
          setIsRoleCheckComplete(true);
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
        
        // Check permissions for each user
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
      // Find selected users
      const usersToUpdate = users.filter(user => 
        user.editSelected !== undefined || user.removeSelected !== undefined
      );

      // Update permissions for each user
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

      // Show success message
      setSnackbarMessage('User permissions updated successfully');
      setOpenSnackbar(true);
      
      // Refresh user list
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

  // Don't render content until role check is complete
  if (!isRoleCheckComplete || tabValue === null) {
    return (
      <LoadingContainer>
        <CircularProgress />
      </LoadingContainer>
    );
  }

  if (isRedirecting || isLoggingOut) {
    return (
      <LoadingContainer>
        <CircularProgress sx={{ color: '#1a237e' }} />
      </LoadingContainer>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--background-main)',
      position: 'relative',
      zIndex: 0
    }}>
      <Header 
        username={keycloak.tokenParsed?.preferred_username} 
        onLogout={handleLogout} 
      />
      <StyledContainer maxWidth="xl">
        <DashboardHeader>
          <Typography variant="h1">
            {userRole === 'admin' ? 'Admin Dashboard' : 'Cars Dashboard'}
          </Typography>
          {userRole === 'admin' && (
            <Typography>
              Manage your cars and users in one place
            </Typography>
          )}
        </DashboardHeader>

        {userRole === 'admin' ? (
          <>
            <StyledTabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="dashboard tabs"
            >
              <StyledTab 
                icon={<DirectionsCarIcon />}
                iconPosition="start"
                label="Cars" 
                id="tab-0"
                aria-controls="tabpanel-0"
              />
              <StyledTab 
                icon={<PeopleIcon />}
                iconPosition="start"
                label="Users" 
                id="tab-1"
                aria-controls="tabpanel-1"
              />
            </StyledTabs>

            <TabPanel value={tabValue} index={0}>
              <CarTab
                cars={cars}
                isLoading={isLoading}
                error={error}
                onEditCar={async (car) => {
                  // ... existing edit car logic ...
                }}
                onDeleteCar={async (car) => {
                  // ... existing delete car logic ...
                }}
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <UserTab
                users={users}
                onEditCheckboxChange={handleUserEditCheckboxChange}
                onRemoveCheckboxChange={handleUserRemoveCheckboxChange}
                onSaveUsers={handleSaveUsers}
              />
            </TabPanel>
          </>
        ) : (
          // Normal user view
          <CarTab
            cars={cars}
            isLoading={isLoading}
            error={error}
            onEditCar={async (car) => {
              // ... existing edit car logic ...
            }}
            onDeleteCar={async (car) => {
              // ... existing delete car logic ...
            }}
          />
        )}

        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={3000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="success"
            sx={{ 
              width: '100%',
              borderRadius: '8px',
              boxShadow: '0 2px 10px var(--card-shadow)',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </StyledContainer>
    </Box>
  );
} 