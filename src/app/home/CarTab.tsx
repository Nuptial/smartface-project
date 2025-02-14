'use client';

import { useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Car {
  image: string;
  title: string;
  start_production: number;
  class: string;
}

interface CarTabProps {
  cars: Car[];
  isLoading: boolean;
  error: string | null;
  onEditCar?: (car: Car) => void;
  onDeleteCar?: (car: Car) => void;
}

// Add this at the top of the file, outside the component
const WS_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export default function CarTab({
  cars,
  isLoading,
  error,
  onEditCar,
  onDeleteCar,
}: CarTabProps) {
  const { keycloak } = useKeycloak();
  const [userPermissions, setUserPermissions] = useState({
    canEdit: false,
    canDelete: false
  });
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Add these new state variables
  const [wsConnected, setWsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // İlk yetki kontrolü
  useEffect(() => {
    const checkPermissions = async () => {
      if (keycloak.authenticated && keycloak.token) {
        try {
          const response = await fetch('/api/auth/check-permissions', {
            headers: {
              Authorization: `Bearer ${keycloak.token}`,
            },
          });
          
          if (response.ok) {
            const permissions = await response.json();
            setUserPermissions({
              canEdit: permissions.canEdit || false,
              canDelete: permissions.canDelete || false
            });
            setPermissionError(null);
          } else {
            const errorData = await response.json();
            setPermissionError(errorData.error || 'Failed to check permissions');
            setUserPermissions({ canEdit: false, canDelete: false });
          }
        } catch (error) {
          console.error('Error checking permissions:', error);
          setPermissionError('Failed to check permissions');
          setUserPermissions({ canEdit: false, canDelete: false });
        }
      }
    };

    checkPermissions();
  }, [keycloak.authenticated, keycloak.token]);

  // WebSocket bağlantısı için useEffect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = async () => {
      if (keycloak.authenticated && keycloak.tokenParsed?.preferred_username) {
        try {
          // First check if the WebSocket server is running
          const serverCheck = await fetch('/api/ws');
          if (!serverCheck.ok) {
            throw new Error('WebSocket server is not running');
          }

          if (ws) {
            ws.close();
          }

          console.log('Attempting to connect to WebSocket...');
          ws = new WebSocket('ws://localhost:3002');

          ws.onopen = () => {
            console.log('WebSocket connected successfully');
            setWsConnected(true);
            setReconnectAttempts(0);
            
            // Register the user
            if (ws && keycloak.tokenParsed?.preferred_username) {
              ws.send(JSON.stringify({
                type: 'register',
                username: keycloak.tokenParsed.preferred_username
              }));
            }
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('WebSocket message received:', data);

              if (data.type === 'permission_update') {
                console.log('Updating permissions to:', data.permissions);
                // Immediately update the UI with new permissions
                setUserPermissions(prevPermissions => ({
                  ...prevPermissions,
                  canEdit: data.permissions.canEdit,
                  canDelete: data.permissions.canDelete
                }));
                
                // Show notification
                setSnackbarMessage('Your permissions have been updated');
                setOpenSnackbar(true);
                
                // Force re-render of action buttons
                setPage(currentPage => currentPage);
              } else if (data.type === 'registered') {
                console.log('Successfully registered with WebSocket server');
              }
            } catch (error) {
              console.error('Error handling WebSocket message:', error);
            }
          };

          ws.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            setWsConnected(false);
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              const nextAttempt = reconnectAttempts + 1;
              setReconnectAttempts(nextAttempt);
              console.log(`Attempting to reconnect (${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})...`);
              reconnectTimeout = setTimeout(connectWebSocket, WS_RECONNECT_DELAY);
            } else {
              console.log('Max reconnection attempts reached');
              setSnackbarMessage('Unable to establish real-time connection. Please refresh the page.');
              setOpenSnackbar(true);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setSnackbarMessage('Connection error occurred. Attempting to reconnect...');
            setOpenSnackbar(true);
          };
        } catch (error) {
          console.error('Error setting up WebSocket:', error);
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectTimeout = setTimeout(connectWebSocket, WS_RECONNECT_DELAY);
          }
        }
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        console.log('Cleaning up WebSocket connection');
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [keycloak.authenticated, keycloak.tokenParsed?.preferred_username]);

  // Add a useEffect to handle permission changes
  useEffect(() => {
    console.log('Permissions updated:', userPermissions);
  }, [userPermissions]);

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [editedCarData, setEditedCarData] = useState({
    title: '',
    start_production: '',
    class: ''
  });

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleEditCar = (car: Car) => {
    if (!onEditCar) return;
    setSelectedCar(car);
    setEditedCarData({
      title: car.title,
      start_production: car.start_production.toString(),
      class: car.class
    });
    setEditDialogOpen(true);
  };

  const handleRemoveCar = (car: Car) => {
    if (!onDeleteCar) return;
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

  const handleEditSave = async () => {
    if (!selectedCar || !onEditCar) return;
    await onEditCar({
      ...selectedCar,
      ...editedCarData,
      start_production: parseInt(editedCarData.start_production)
    });
    handleEditDialogClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCar || !onDeleteCar) return;
    await onDeleteCar(selectedCar);
    handleDeleteDialogClose();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || permissionError) {
    return <Alert severity="error">{error || permissionError}</Alert>;
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Start Production</TableCell>
              <TableCell>Class</TableCell>
              {(userPermissions.canEdit || userPermissions.canDelete) && (
                <TableCell align="right">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {cars
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((car) => (
                <TableRow key={car.title}>
                  <TableCell>
                    <img
                      src={car.image}
                      alt={car.title}
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                  </TableCell>
                  <TableCell>{car.title}</TableCell>
                  <TableCell>{car.start_production}</TableCell>
                  <TableCell>{car.class}</TableCell>
                  {(userPermissions.canEdit || userPermissions.canDelete) && (
                    <TableCell align="right">
                      {userPermissions.canEdit && onEditCar && (
                        <IconButton onClick={() => handleEditCar(car)}>
                          <EditIcon />
                        </IconButton>
                      )}
                      {userPermissions.canDelete && onDeleteCar && (
                        <IconButton onClick={() => handleRemoveCar(car)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={cars.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

      {userPermissions.canEdit && (
        <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
          <DialogTitle>Edit Car</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Title"
              fullWidth
              value={editedCarData.title}
              onChange={(e) => setEditedCarData({ ...editedCarData, title: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Start Production"
              fullWidth
              type="number"
              value={editedCarData.start_production}
              onChange={(e) => setEditedCarData({ ...editedCarData, start_production: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Class"
              fullWidth
              value={editedCarData.class}
              onChange={(e) => setEditedCarData({ ...editedCarData, class: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditDialogClose}>Cancel</Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogActions>
        </Dialog>
      )}

      {userPermissions.canDelete && (
        <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
          <DialogTitle>Delete Car</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete {selectedCar?.title}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteDialogClose}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="info"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 