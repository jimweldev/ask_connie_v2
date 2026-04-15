import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { SystemDropdownModule } from '@/04_types/system/system-dropdown-module';
import useSystemDropdownModuleStore from '@/05_stores/system/system-dropdown-module-store';
import DataTable from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import CreateSystemDropdownModuleDialog from './_dialogs/create-system-dropdown-module-dialog';
import DeleteSystemDropdownModuleDialog from './_dialogs/delete-system-dropdown-module-dialog';
import UpdateSystemDropdownModuleDialog from './_dialogs/update-system-dropdown-module-dialog';

const SystemDropdownModulesTab = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedSystemDropdownModule } =
    useSystemDropdownModuleStore();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const systemDropdownModulesPagination =
    useTanstackPaginateQuery<SystemDropdownModule>(
      {
        endpoint: '/system/dropdown-modules',
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
      label: 'Types',
      field: 'system_dropdown_module_types',
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
          ...systemDropdownModulesPagination,
          pagination,
          setPagination,
        }}
        columns={columns}
        actions={Actions}
      >
        {/* UI: render records */}
        {systemDropdownModulesPagination.data?.records.map(
          systemDropdownModule => (
            <TableRow key={systemDropdownModule.id}>
              <TableCell className="font-medium">
                {systemDropdownModule.id}
              </TableCell>

              <TableCell>{systemDropdownModule.label}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {systemDropdownModule.system_dropdown_module_types?.map(
                    type => {
                      return (
                        <Badge variant="secondary" key={type.label}>
                          {type.label}
                        </Badge>
                      );
                    },
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getDateTimezone(systemDropdownModule.created_at, 'date_time')}
              </TableCell>

              <TableCell>
                <ButtonGroup>
                  {/* ACTION: open update dialog */}
                  <Button
                    variant="info"
                    size="icon-xs"
                    onClick={() => {
                      setSelectedSystemDropdownModule(systemDropdownModule);
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
                      setSelectedSystemDropdownModule(systemDropdownModule);
                      setOpenDeleteDialog(true);
                    }}
                  >
                    <FaTrash />
                  </Button>
                </ButtonGroup>
              </TableCell>
            </TableRow>
          ),
        )}
      </DataTable>

      {/* CREATE DIALOG */}
      <CreateSystemDropdownModuleDialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={systemDropdownModulesPagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <UpdateSystemDropdownModuleDialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={systemDropdownModulesPagination.refetch}
      />

      {/* DELETE DIALOG */}
      <DeleteSystemDropdownModuleDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={systemDropdownModulesPagination.refetch}
      />
    </>
  );
};

export default SystemDropdownModulesTab;
