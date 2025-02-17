'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Button, Typography, Box, Paper, CircularProgress } from '@mui/material';
import Link from 'next/link';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

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
    <Container component="main" maxWidth="sm" sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Paper elevation={0} sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        borderRadius: 2,
        boxShadow: '0 4px 24px var(--card-shadow)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 3
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1
          }}>
            <LockOutlinedIcon sx={{ color: '#fff' }} />
          </Box>

          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              color: 'var(--text-primary)',
              fontWeight: 600,
              textAlign: 'center',
              mb: 1
            }}
          >
            Welcome Back
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              color: 'var(--text-secondary)',
              textAlign: 'center',
              mb: 2
            }}
          >
            Sign in to access your account
          </Typography>

          <Button
            variant="contained"
            onClick={handleLogin}
            size="large"
            disabled={isRedirecting}
            sx={{
              width: '100%',
              py: 1.5,
              backgroundColor: 'var(--primary-dark)',
              color: '#fff',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              borderRadius: 1.5,
              '&:hover': {
                backgroundColor: 'var(--primary-light)',
              },
              display: 'flex',
              gap: 1
            }}
          >
            {isRedirecting ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              'Sign in with Keycloak'
            )}
          </Button>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                style={{ 
                  color: 'var(--primary-dark)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 