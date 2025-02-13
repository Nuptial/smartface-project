'use client';

import { useKeycloak } from '@react-keycloak/web';
import { Button, Box } from '@mui/material';

export default function SignUpForm() {
  const { keycloak } = useKeycloak();
  
  const handleSignUp = async () => {
    try {
      await keycloak.register();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
      <Button
        variant="contained"
        onClick={handleSignUp}
        color="primary"
        size="large"
      >
        Sign Up with Keycloak
      </Button>
    </Box>
  );
} 