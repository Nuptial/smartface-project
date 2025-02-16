import { AppBar, Toolbar, Typography, Button, Box, styled } from '@mui/material';
import React from 'react';

interface HeaderProps {
  username: string | null;
  onLogout: () => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease-in-out',
  borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  '& .MuiToolbar-root': {
    minHeight: '64px',
    transition: 'all 0.3s ease-in-out'
  },
  '&.scrolled': {
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 1px 12px rgba(0, 0, 0, 0.05)',
    '& .MuiToolbar-root': {
      minHeight: '56px'
    }
  }
}));

const Header = ({ username, onLogout }: HeaderProps) => {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <StyledAppBar position="fixed" className={scrolled ? 'scrolled' : ''} elevation={0}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ width: '100px' }} /> {/* Spacer for balance */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flex: 1, 
            textAlign: 'center',
            color: 'var(--text-primary)',
            fontWeight: 500
          }}
        >
          Welcome, {username}!
        </Typography>
        <Box sx={{ width: '100px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={onLogout}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.04)'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header; 