import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { SystemUser } from '@/04_types/system/system-user';
import useSystemUserStore from '@/05_stores/system/system-user-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import CreateSystemUserDialog from './_dialogs/create-system-user-dialog';
import DeleteSystemUserDialog from './_dialogs/delete-system-user-dialog';
import UpdateSystemUserDialog from './_dialogs/update-system-user-dialog';

const SystemUsersPage = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedSystemUser } =
    useSystemUserStore();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const systemUsersPagination = useTanstackPaginateQuery<SystemUser>(
    {
      endpoint: '/system/users',
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
      label: 'Username',
      field: 'username,id',
    },
    {
      label: 'Note',
      field: 'notes,id',
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
      <h1 className="mb-3 text-2xl font-semibold">System Users</h1>

      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...systemUsersPagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
          >
            {/* UI: render records */}
            {systemUsersPagination.data?.records.map(systemUser => (
              <TableRow key={systemUser.id}>
                <TableCell className="font-medium">{systemUser.id}</TableCell>
                <TableCell>{systemUser.username}</TableCell>
                <TableCell>{systemUser.notes}</TableCell>
                <TableCell>
                  {getDateTimezone(systemUser.created_at, 'date_time')}
                </TableCell>
                <TableCell>
                  <ButtonGroup>
                    <Button
                      variant="info"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedSystemUser(systemUser);
                        setOpenUpdateDialog(true);
                      }}
                    >
                      <FaPenToSquare />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedSystemUser(systemUser);
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
      <CreateSystemUserDialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={systemUsersPagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <UpdateSystemUserDialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={systemUsersPagination.refetch}
      />

      {/* DELETE DIALOG */}
      <DeleteSystemUserDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={systemUsersPagination.refetch}
      />
    </>
  );
};

export default SystemUsersPage;
