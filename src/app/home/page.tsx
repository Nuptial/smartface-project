'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { 
  Container,
  Box, 
  Tabs, 
  Tab,
  CircularProgress
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

  useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      setIsRedirecting(true);
      router.replace('/signin');
    }
  }, [initialized, keycloak.authenticated, router]);

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      setIsRedirecting(false);
      fetchUsers();
      fetchCars();
    }
  }, [initialized, keycloak.authenticated]);

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
        setUsers(data.map((user: any) => ({
          ...user,
          editSelected: false,
          removeSelected: false
        })));
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

  const handleEditCar = async (car: Car) => {
    try {
      const response = await fetch('/api/cars', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(car),
      });

      if (!response.ok) {
        throw new Error('Failed to update car');
      }

      await fetchCars();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update car');
    }
  };

  const handleDeleteCar = async (car: Car) => {
    try {
      const response = await fetch(`/api/cars?id=${car.title}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete car');
      }

      await fetchCars();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete car');
    }
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

  const handleSaveUsers = () => {
    // Implement user save logic here
    console.log('Saving user changes...');
  };

  if (isRedirecting || !initialized) {
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
            onEditCar={handleEditCar}
            onDeleteCar={handleDeleteCar}
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
      </Container>
    </>
  );
} 