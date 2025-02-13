'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Button,
  Checkbox,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Header from '../../components/Header';
import carsData from '../../data/cars.json';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  editSelected?: boolean;
  removeSelected?: boolean;
}

export default function HomePage() {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<KeycloakUser[]>([]);
  const username = keycloak.tokenParsed?.preferred_username || null;

  // Pagination states
  const [carPage, setCarPage] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [rowsPerPage] = useState(10);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [editedCarData, setEditedCarData] = useState({
    title: '',
    start_production: '',
    class: ''
  });

  useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      setIsRedirecting(true);
      router.replace('/signin');
    }
  }, [initialized, keycloak.authenticated, router]);

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      setIsRedirecting(false);
      fetchUsers();
    }
  }, [initialized, keycloak.authenticated]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${keycloak.authServerUrl}/admin/realms/${keycloak.realm}/users`,
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.map((user: any) => ({
          ...user,
          editSelected: false,
          removeSelected: false
        })));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await keycloak.logout({
        redirectUri: window.location.origin + '/signin'
      });
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditCar = (car: any) => {
    setSelectedCar(car);
    setEditedCarData({
      title: car.title,
      start_production: car.start_production || '',
      class: car.class
    });
    setEditDialogOpen(true);
  };

  const handleRemoveCar = (car: any) => {
    setSelectedCar(car);
    setDeleteDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedCar(null);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedCar(null);
  };

  const handleEditSave = () => {
    console.log('Saving edited car:', editedCarData);
    handleEditDialogClose();
  };

  const handleDeleteConfirm = () => {
    console.log('Deleting car:', selectedCar?.title);
    handleDeleteDialogClose();
  };

  const handleUserEditCheckboxChange = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, editSelected: !user.editSelected } : user
    ));
  };

  const handleUserRemoveCheckboxChange = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, removeSelected: !user.removeSelected } : user
    ));
  };

  const handleSaveUsers = () => {
    const selectedUsers = users.filter(user => user.editSelected || user.removeSelected).map(user => ({
      id: user.id,
      username: user.username,
      toEdit: user.editSelected,
      toRemove: user.removeSelected
    }));
    console.log('Selected users:', selectedUsers);
  };

  const handleChangeCarPage = (event: unknown, newPage: number) => {
    setCarPage(newPage);
  };

  const handleChangeUserPage = (event: unknown, newPage: number) => {
    setUserPage(newPage);
  };

  // Calculate paginated data
  const paginatedCars = carsData.slice(
    carPage * rowsPerPage,
    carPage * rowsPerPage + rowsPerPage
  );

  const paginatedUsers = users.slice(
    userPage * rowsPerPage,
    userPage * rowsPerPage + rowsPerPage
  );

  if (!initialized || isLoggingOut || isRedirecting) {
    return (
      <Container component="main" maxWidth="lg" sx={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography>
            {isLoggingOut ? 'Logging out...' : isRedirecting ? 'Redirecting...' : 'Loading...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Header username={username} onLogout={handleLogout} />
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Cars" />
              <Tab label="Users" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Start Production</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCars.map((car: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <img 
                          src={car.image} 
                          alt={car.title} 
                          style={{ width: '100px', height: 'auto' }} 
                        />
                      </TableCell>
                      <TableCell>{car.title}</TableCell>
                      <TableCell>{car.start_production || 'N/A'}</TableCell>
                      <TableCell>{car.class}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleEditCar(car)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleRemoveCar(car)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={carsData.length}
                page={carPage}
                onPageChange={handleChangeCarPage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
              />
            </TableContainer>

            {/* Edit Dialog */}
            <Dialog 
              open={editDialogOpen} 
              onClose={handleEditDialogClose}
              disableScrollLock
            >
              <DialogTitle>Edit Car</DialogTitle>
              <DialogContent>
                <Box sx={{ pt: 2 }}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={editedCarData.title}
                    onChange={(e) => setEditedCarData({ ...editedCarData, title: e.target.value })}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Start Production"
                    type="number"
                    value={editedCarData.start_production}
                    onChange={(e) => setEditedCarData({ ...editedCarData, start_production: e.target.value })}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Class"
                    value={editedCarData.class}
                    onChange={(e) => setEditedCarData({ ...editedCarData, class: e.target.value })}
                    margin="normal"
                  />
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleEditDialogClose}>Cancel</Button>
                <Button onClick={handleEditSave} variant="contained" color="primary">
                  Save
                </Button>
              </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog 
              open={deleteDialogOpen} 
              onClose={handleDeleteDialogClose}
              disableScrollLock
            >
              <DialogTitle>Delete Car</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete {selectedCar?.title}? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleDeleteDialogClose}>Cancel</Button>
                <Button onClick={handleDeleteConfirm} variant="contained" color="error">
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell align="center">Edit</TableCell>
                    <TableCell align="center">Remove</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.firstName}</TableCell>
                      <TableCell>{user.lastName}</TableCell>
                      <TableCell align="center">
                        <Checkbox 
                          checked={user.editSelected}
                          onChange={() => handleUserEditCheckboxChange(user.id)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox 
                          checked={user.removeSelected}
                          onChange={() => handleUserRemoveCheckboxChange(user.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={users.length}
                page={userPage}
                onPageChange={handleChangeUserPage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10]}
              />
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleSaveUsers}
              >
                Save
              </Button>
            </Box>
          </TabPanel>
        </Box>
      </Container>
    </>
  );
} 