import { useState } from 'react';
import { FaHistory } from 'react-icons/fa';
import type { User } from '@/04_types/user/user';
import useArchivedUserStore from '@/05_stores/user/archived-user-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import RestoreArchivedUserDialog from './_dialogs/restore-archived-user-dialog';

const ArchivedUsersTab = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedArchivedUser } =
    useArchivedUserStore();

  // DIALOG STATE
  const [openRestoreDialog, setOpenRestoreDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const usersPagination = useTanstackPaginateQuery<User>(
    {
      endpoint: '/archived-users',
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
                      variant="warning"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedArchivedUser(user);
                        setOpenRestoreDialog(true);
                      }}
                    >
                      <FaHistory />
                    </Button>
                  </ButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        </CardBody>
      </Card>

      {/* DELETE DIALOG */}
      <RestoreArchivedUserDialog
        open={openRestoreDialog}
        setOpen={setOpenRestoreDialog}
        refetch={usersPagination.refetch}
      />
    </>
  );
};

export default ArchivedUsersTab;
