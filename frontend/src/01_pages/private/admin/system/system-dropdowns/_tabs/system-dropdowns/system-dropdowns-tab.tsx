import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { SystemDropdown } from '@/04_types/system/system-dropdown';
import useSystemDropdownStore from '@/05_stores/system/system-dropdown-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import CreateSystemDropdownDialog from './_dialogs/create-system-dropdown-dialog';
import DeleteSystemDropdownDialog from './_dialogs/delete-system-dropdown-dialog';
import UpdateSystemDropdownDialog from './_dialogs/update-system-dropdown-dialog';

const SystemDropdownsTab = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedSystemDropdown } =
    useSystemDropdownStore();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const systemDropdownsPagination = useTanstackPaginateQuery<SystemDropdown>(
    {
      endpoint: '/system/dropdowns',
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
      label: 'Label',
      field: 'label',
    },
    {
      label: 'Module',
    },
    {
      label: 'Type',
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
      <DataTable
        pagination={{
          ...systemDropdownsPagination,
          pagination,
          setPagination,
        }}
        columns={columns}
        actions={Actions}
      >
        {/* UI: render records */}
        {systemDropdownsPagination.data?.records.map(systemDropdown => (
          <TableRow key={systemDropdown.id}>
            <TableCell className="font-medium">{systemDropdown.id}</TableCell>

            <TableCell>{systemDropdown.label}</TableCell>
            <TableCell>{systemDropdown.module}</TableCell>
            <TableCell>{systemDropdown.type}</TableCell>
            <TableCell>
              {getDateTimezone(systemDropdown.created_at, 'date_time')}
            </TableCell>

            <TableCell>
              <ButtonGroup>
                {/* ACTION: open update dialog */}
                <Button
                  variant="info"
                  size="icon-xs"
                  onClick={() => {
                    setSelectedSystemDropdown(systemDropdown);
                    setOpenUpdateDialog(true);
                  }}
                >
                  <FaPenToSquare />
                </Button>

                {/* ACTION: open delete dialog */}
                <Button
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => {
                    setSelectedSystemDropdown(systemDropdown);
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

      {/* CREATE DIALOG */}
      <CreateSystemDropdownDialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={systemDropdownsPagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <UpdateSystemDropdownDialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={systemDropdownsPagination.refetch}
      />

      {/* DELETE DIALOG */}
      <DeleteSystemDropdownDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={systemDropdownsPagination.refetch}
      />
    </>
  );
};

export default SystemDropdownsTab;
