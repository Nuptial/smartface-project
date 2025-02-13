import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

interface HeaderProps {
  username: string | null;
  onLogout: () => void;
}

const Header = ({ username, onLogout }: HeaderProps) => {
  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ width: '100px' }} /> {/* Spacer for balance */}
        <Typography variant="h6" component="div" sx={{ flex: 1, textAlign: 'center' }}>
          Welcome, {username}!
        </Typography>
        <Box sx={{ width: '100px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="error"
            onClick={onLogout}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 