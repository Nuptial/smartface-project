'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { Container, Typography, Box } from '@mui/material';

export default function Home() {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();

  useEffect(() => {
    if (initialized) {
      if (keycloak.authenticated) {
        router.push('/home');
      } else {
        router.push('/signin');
      }
    }
  }, [initialized, keycloak.authenticated, router]);

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    </Container>
  );
}
