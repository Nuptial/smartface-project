'use client';

import { useKeycloak } from '@react-keycloak/web';
import { Button, Box, CircularProgress } from '@mui/material';
import { useState } from 'react';

export default function SignUpForm() {
  const { keycloak } = useKeycloak();
  const [isRegistering, setIsRegistering] = useState(false);
  
  const handleSignUp = async () => {
    try {
      setIsRegistering(true);
      await keycloak.register({
        redirectUri: window.location.origin + '/home'
      });
    } catch (error) {
      console.error('Registration failed:', error);
      setIsRegistering(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button
        variant="contained"
        onClick={handleSignUp}
        size="large"
        disabled={isRegistering}
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
        {isRegistering ? (
          <CircularProgress size={24} sx={{ color: '#fff' }} />
        ) : (
          'Sign up with Keycloak'
        )}
      </Button>
    </Box>
  );
} 