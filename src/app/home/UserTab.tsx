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
  Checkbox,
  TablePagination,
  Button,
  Box
} from '@mui/material';

interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  editSelected?: boolean;
  removeSelected?: boolean;
}

interface UserTabProps {
  users: KeycloakUser[];
  onSaveUsers: () => void;
  onEditCheckboxChange: (userId: string) => void;
  onRemoveCheckboxChange: (userId: string) => void;
}

export default function UserTab({ users, onSaveUsers, onEditCheckboxChange, onRemoveCheckboxChange }: UserTabProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Last Name</TableCell>
              <TableCell>Edit</TableCell>
              <TableCell>Remove</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.firstName}</TableCell>
                  <TableCell>{user.lastName}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={user.editSelected}
                      onChange={() => onEditCheckboxChange(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={user.removeSelected}
                      onChange={() => onRemoveCheckboxChange(user.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={onSaveUsers}>
          Save Changes
        </Button>
      </Box>
    </>
  );
} 