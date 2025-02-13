'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Button, Typography, Box } from '@mui/material';
import Link from 'next/link';

export default function SignInPage() {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      setIsRedirecting(true);
      router.replace('/home');
    }
  }, [initialized, keycloak.authenticated, router]);

  const handleLogin = async () => {
    try {
      setIsRedirecting(true);
      await keycloak.login({
        redirectUri: window.location.origin + '/home'
      });
    } catch (error) {
      console.error('Login failed:', error);
      setIsRedirecting(false);
    }
  };

  if (!initialized || isRedirecting) {
    return (
      <Container component="main" maxWidth="sm" sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography>{isRedirecting ? 'Redirecting...' : 'Loading...'}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Sign In
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          size="large"
          sx={{ mb: 3 }}
        >
          Login with Keycloak
        </Button>
        <Box>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'primary.main', textDecoration: 'none' }}>
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
} 