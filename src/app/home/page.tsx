'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Typography, Box } from '@mui/material';
import Header from '../../components/Header';

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const username = keycloak.tokenParsed?.preferred_username || null;

  useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      setIsRedirecting(true);
      router.replace('/signin');
    }
  }, [initialized, keycloak.authenticated, router]);

  useEffect(() => {
    // Set initial authentication state
    if (initialized && keycloak.authenticated) {
      setIsRedirecting(false);
    }
  }, [initialized, keycloak.authenticated]);

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

  if (!initialized || isLoggingOut || isRedirecting) {
    return (
      <Container component="main" maxWidth="sm" sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography>
            {isLoggingOut ? 'Logging out...' : isRedirecting ? 'Redirecting...' : 'Loading...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Header username={username} onLogout={handleLogout} />
      <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Home Page
          </Typography>
          <Typography>
            You are successfully logged in as {username}
          </Typography>
        </Box>
      </Container>
    </>
  );
} 