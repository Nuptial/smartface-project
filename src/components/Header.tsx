import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

interface HeaderProps {
  username: string | null;
  onLogout: () => void;
}

const Header = ({ username, onLogout }: HeaderProps) => {
  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="h6" component="div">
            Welcome, {username}!
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="error"
          onClick={onLogout}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 