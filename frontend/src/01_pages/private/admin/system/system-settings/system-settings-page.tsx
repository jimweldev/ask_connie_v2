import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { SystemSetting } from '@/04_types/system/system-setting';
import useSystemSettingStore from '@/05_stores/system/system-setting-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import CreateSystemSettingDialog from './_dialogs/create-system-setting-dialog';
import DeleteSystemSettingDialog from './_dialogs/delete-system-setting-dialog';
import UpdateSystemSettingDialog from './_dialogs/update-system-setting-dialog';

const SystemSettingsPage = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedSystemSetting } =
    useSystemSettingStore();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const systemSettingsPagination = useTanstackPaginateQuery<SystemSetting>(
    {
      endpoint: '/system/settings',
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
      label: 'Value',
      field: 'value',
    },
    {
      label: 'Notes',
      field: 'notes',
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
      <h1 className="mb-3 text-2xl font-semibold">System Settings</h1>

      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...systemSettingsPagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
          >
            {/* UI: render records */}
            {systemSettingsPagination.data?.records.map(systemSetting => (
              <TableRow key={systemSetting.id}>
                <TableCell className="font-medium">
                  {systemSetting.id}
                </TableCell>

                <TableCell>{systemSetting.label}</TableCell>
                <TableCell>{systemSetting.value}</TableCell>
                <TableCell>{systemSetting.notes}</TableCell>
                <TableCell>
                  {getDateTimezone(systemSetting.created_at, 'date_time')}
                </TableCell>

                <TableCell>
                  <ButtonGroup>
                    {/* ACTION: open update dialog */}
                    <Button
                      variant="info"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedSystemSetting(systemSetting);
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
                        setSelectedSystemSetting(systemSetting);
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
      <CreateSystemSettingDialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={systemSettingsPagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <UpdateSystemSettingDialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={systemSettingsPagination.refetch}
      />

      {/* DELETE DIALOG */}
      <DeleteSystemSettingDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={systemSettingsPagination.refetch}
      />
    </>
  );
};

export default SystemSettingsPage;
