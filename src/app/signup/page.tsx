'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Typography, Box, Paper, CircularProgress } from '@mui/material';
import SignUpForm from '../../components/SignUpForm';
import Link from 'next/link';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

export default function SignUpPage() {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      router.push('/home');
    }
  }, [initialized, keycloak.authenticated, router]);

  if (!initialized) {
    return (
      <Container component="main" maxWidth="sm" sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: 'var(--primary-dark)' }} />
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
            <PersonAddOutlinedIcon sx={{ color: '#fff' }} />
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
            Create Account
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              color: 'var(--text-secondary)',
              textAlign: 'center',
              mb: 2
            }}
          >
            Join us and start managing your cars
          </Typography>

          <SignUpForm />

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link 
                href="/signin" 
                style={{ 
                  color: 'var(--primary-dark)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
} 