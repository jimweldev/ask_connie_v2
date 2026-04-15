import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { User } from '@/04_types/user/user';
import useUserStore from '@/05_stores/user/user-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import CreateUserDialog from './_dialogs/create-user-dialog';
import DeleteUserDialog from './_dialogs/delete-user-dialog';
import UpdateUserDialog from './_dialogs/update-user-dialog';

const ActiveUsersTab = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedUser } = useUserStore();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const usersPagination = useTanstackPaginateQuery<User>(
    {
      endpoint: '/users',
    },
    pagination,
  );

  // UI: table column configuration
  const columns = [
    {
      label: 'ID',
      field: 'id',
      className: 'w-[100px]',
    },
    {
      label: 'First Name',
      field: 'first_name,id',
    },
    {
      label: 'Date Created',
      field: 'created_at',
      className: 'w-[200px]',
    },
    {
      label: 'Actions',
      className: 'w-[100px]',
    },
  ];

  // UI ACTIONS: header actions (create button)
  const Actions = (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpenCreateDialog(true);
        }}
      >
        Create
      </Button>
    </>
  );

  return (
    <>
      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...usersPagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
          >
            {/* UI: render records */}
            {usersPagination.data?.records.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.first_name}</TableCell>
                <TableCell>
                  {getDateTimezone(user.created_at, 'date_time')}
                </TableCell>
                <TableCell>
                  <ButtonGroup>
                    <Button
                      variant="info"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedUser(user);
                        setOpenUpdateDialog(true);
                      }}
                    >
                      <FaPenToSquare />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedUser(user);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </ButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </CardBody>
      </Card>

      {/* CREATE DIALOG */}
      <CreateUserDialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={usersPagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <UpdateUserDialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={usersPagination.refetch}
      />

      {/* DELETE DIALOG */}
      <DeleteUserDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={usersPagination.refetch}
      />
    </>
  );
};

export default ActiveUsersTab;
