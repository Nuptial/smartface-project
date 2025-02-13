'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Typography, Box } from '@mui/material';
import SignUpForm from '../../components/SignUpForm';
import Link from 'next/link';

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
      <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ maxWidth: 400, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom textAlign="center">
          Sign Up
        </Typography>
        <SignUpForm />
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link href="/signin" style={{ color: 'primary.main', textDecoration: 'none' }}>
              Sign In
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
} 