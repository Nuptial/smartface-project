'use client';

import { useState } from 'react';
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
  Box
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
  onEditCar: (car: Car) => Promise<void>;
  onDeleteCar: (car: Car) => Promise<void>;
}

export default function CarTab({ cars, isLoading, error, onEditCar, onDeleteCar }: CarTabProps) {
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

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setEditedCarData({
      title: car.title,
      start_production: car.start_production.toString(),
      class: car.class
    });
    setEditDialogOpen(true);
  };

  const handleRemoveCar = (car: Car) => {
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
    if (!selectedCar) return;
    await onEditCar({
      ...selectedCar,
      ...editedCarData,
      start_production: parseInt(editedCarData.start_production)
    });
    handleEditDialogClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCar) return;
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

  if (error) {
    return <Alert severity="error">{error}</Alert>;
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cars
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((car) => (
                <TableRow key={car.title}>
                  <TableCell>
                    <img src={car.image} alt={car.title} style={{ width: 50, height: 50 }} />
                  </TableCell>
                  <TableCell>{car.title}</TableCell>
                  <TableCell>{car.start_production}</TableCell>
                  <TableCell>{car.class}</TableCell>
                  <TableCell>
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
          count={cars.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>

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

      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Car</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this car?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 