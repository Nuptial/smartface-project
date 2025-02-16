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
  Box,
  Avatar,
  Chip,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

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

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: '#1a237e',
  fontSize: '1rem',
  fontWeight: 500
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  '&.MuiCheckbox-root': {
    color: '#9fa8da',
  },
  '&.Mui-checked': {
    color: '#1a237e',
  }
}));

const SaveButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#1a237e',
  color: '#fff',
  padding: '0.5rem 2rem',
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0 2px 8px rgba(26, 35, 126, 0.2)',
  '&:hover': {
    backgroundColor: '#000051',
  },
  '& .MuiSvgIcon-root': {
    marginRight: '0.5rem'
  }
}));

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

export default function UserTab({ 
  users, 
  onSaveUsers, 
  onEditCheckboxChange, 
  onRemoveCheckboxChange 
}: UserTabProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <StyledPaper>
        <TableContainer>
          <Table stickyHeader size="small">
            <StyledTableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="center">Edit Access</TableCell>
                <TableCell align="center">Delete Access</TableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {users
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <StyledTableRow key={user.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <StyledAvatar>
                          {getInitials(user.firstName || '', user.lastName || '')}
                        </StyledAvatar>
                        <Box>
                          <Box sx={{ fontWeight: 500, color: '#1a237e' }}>
                            {user.username}
                          </Box>
                          <Box sx={{ fontSize: '0.875rem', color: '#666' }}>
                            {user.firstName} {user.lastName}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={user.email}>
                        <span>{user.email}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {user.editSelected && (
                          <Chip 
                            size="small"
                            label="Edit"
                            icon={<EditIcon sx={{ fontSize: 16 }} />}
                            sx={{ 
                              backgroundColor: '#e3f2fd',
                              color: '#1a237e',
                              '& .MuiChip-icon': { color: '#1a237e' }
                            }}
                          />
                        )}
                        {user.removeSelected && (
                          <Chip 
                            size="small"
                            label="Delete"
                            icon={<DeleteIcon sx={{ fontSize: 16 }} />}
                            sx={{ 
                              backgroundColor: '#ffebee',
                              color: '#d32f2f',
                              '& .MuiChip-icon': { color: '#d32f2f' }
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <StyledCheckbox
                        checked={user.editSelected || false}
                        onChange={() => onEditCheckboxChange(user.id)}
                        indeterminate={user.editSelected === undefined}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <StyledCheckbox
                        checked={user.removeSelected || false}
                        onChange={() => onRemoveCheckboxChange(user.id)}
                        indeterminate={user.removeSelected === undefined}
                      />
                    </TableCell>
                  </StyledTableRow>
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
            sx={{
              borderTop: '1px solid #e0e0e0',
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                color: '#666'
              }
            }}
          />
        </TableContainer>
      </StyledPaper>
      <Box mt={3} display="flex" justifyContent="flex-end">
        <SaveButton
          onClick={onSaveUsers}
          startIcon={<SaveIcon />}
        >
          Save Changes
        </SaveButton>
      </Box>
    </>
  );
} 