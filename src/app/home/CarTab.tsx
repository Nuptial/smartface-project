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
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { styled } from '@mui/material/styles';

interface Car {
  id: string;
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

const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden'
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableCell-head': {
    backgroundColor: '#1a237e',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '16px'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: '#f8f9fa',
  },
  '&:hover': {
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
}));

const ImageContainer = styled(Box)(({ theme }) => ({
  width: 100,
  height: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  overflow: 'hidden',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.1)'
    }
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  margin: '0 4px',
  padding: '8px',
  '&.edit-button': {
    color: '#1a237e',
    '&:hover': {
      backgroundColor: 'rgba(26, 35, 126, 0.1)'
    }
  },
  '&.delete-button': {
    color: '#d32f2f',
    '&:hover': {
      backgroundColor: 'rgba(211, 47, 47, 0.1)'
    }
  }
}));

const StyledTableContainer = styled(TableContainer)({
  flex: 1,
  minHeight: 0
});

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

  const [brokenImages, setBrokenImages] = useState<{[key: string]: boolean}>({});

  // Initial permission check
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

  // WebSocket connection useEffect
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

          // Add connection timeout
          const connectionTimeout = setTimeout(() => {
            if (ws && ws.readyState === WebSocket.CONNECTING) {
              ws.close();
              throw new Error('WebSocket connection timeout');
            }
          }, 5000); // 5 second timeout

          ws.onopen = () => {
            clearTimeout(connectionTimeout);
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
    document.body.classList.add('dialog-open');
  };

  const handleRemoveCar = (car: Car) => {
    if (!onDeleteCar) return;
    setSelectedCar(car);
    setDeleteDialogOpen(true);
    document.body.classList.add('dialog-open');
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedCar(null);
    document.body.classList.remove('dialog-open');
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedCar(null);
    document.body.classList.remove('dialog-open');
  };

  const handleEditSave = async () => {
    if (!selectedCar || !onEditCar) return;
    try {
      const updatedCar = {
        ...selectedCar,
        title: editedCarData.title,
        start_production: parseInt(editedCarData.start_production),
        class: editedCarData.class
      };
      await onEditCar(updatedCar);
      handleEditDialogClose();
    } catch (error) {
      console.error('Error saving car:', error);
      setSnackbarMessage('Failed to save changes');
      setOpenSnackbar(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCar || !onDeleteCar) return;
    await onDeleteCar(selectedCar);
    handleDeleteDialogClose();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleImageError = (carTitle: string) => {
    setBrokenImages(prev => ({...prev, [carTitle]: true}));
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
      <StyledPaper>
        <TableContainer>
          <Table stickyHeader aria-label="sticky table">
            <StyledTableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Start Production</TableCell>
                <TableCell>Class</TableCell>
                {(userPermissions.canEdit || userPermissions.canDelete) && (
                  <TableCell align="right">Actions</TableCell>
                )}
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {cars
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((car) => (
                  <StyledTableRow key={car.id}>
                    <TableCell>
                      <ImageContainer>
                        {brokenImages[car.title] ? (
                          <BrokenImageIcon sx={{ color: 'grey.500', fontSize: 30 }} />
                        ) : (
                          <img
                            src={car.image}
                            alt={car.title}
                            onError={() => handleImageError(car.title)}
                          />
                        )}
                      </ImageContainer>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{car.title}</TableCell>
                    <TableCell>{car.start_production}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 0.5,
                          borderRadius: '16px',
                          backgroundColor: '#e3f2fd',
                          color: '#1a237e',
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}
                      >
                        {car.class}
                      </Box>
                    </TableCell>
                    {(userPermissions.canEdit || userPermissions.canDelete) && (
                      <TableCell align="right">
                        {userPermissions.canEdit && onEditCar && (
                          <ActionButton
                            onClick={() => handleEditCar(car)}
                            size="small"
                            className="edit-button"
                          >
                            <EditIcon />
                          </ActionButton>
                        )}
                        {userPermissions.canDelete && onDeleteCar && (
                          <ActionButton
                            onClick={() => handleRemoveCar(car)}
                            size="small"
                            className="delete-button"
                          >
                            <DeleteIcon />
                          </ActionButton>
                        )}
                      </TableCell>
                    )}
                  </StyledTableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={cars.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[10]}
          sx={{
            borderTop: '1px solid #e0e0e0',
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              color: '#666'
            }
          }}
        />
      </StyledPaper>

      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditDialogClose}
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: '400px',
            margin: 2
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(2px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#1a237e',
          color: '#fff',
          fontSize: '1.25rem'
        }}>
          Edit Car
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            margin="dense"
            label="Title"
            fullWidth
            value={editedCarData.title}
            onChange={(e) => setEditedCarData({ ...editedCarData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Start Production"
            fullWidth
            type="number"
            value={editedCarData.start_production}
            onChange={(e) => setEditedCarData({ ...editedCarData, start_production: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Class"
            fullWidth
            value={editedCarData.class}
            onChange={(e) => setEditedCarData({ ...editedCarData, class: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleEditDialogClose}
            sx={{ 
              color: '#666',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSave}
            variant="contained"
            sx={{ 
              backgroundColor: '#1a237e',
              '&:hover': { backgroundColor: '#000051' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleDeleteDialogClose}
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: '400px',
            margin: 2
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(2px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#d32f2f',
          color: '#fff',
          fontSize: '1.25rem'
        }}>
          Delete Car
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedCar?.title}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, backgroundColor: '#f8f9fa' }}>
          <Button 
            onClick={handleDeleteDialogClose}
            sx={{ 
              color: '#666',
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            sx={{ 
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#9a0007' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="info"
          sx={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
} 