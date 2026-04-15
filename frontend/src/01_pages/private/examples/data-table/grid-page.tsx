import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { ExampleTask } from '@/04_types/example/example-task';
import useExampleTaskStore from '@/05_stores/example/example-task-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import CreateExampleTaskDialog from './_dialogs/create-example-task-dialog';
import DeleteExampleTaskDialog from './_dialogs/delete-example-task-dialog';
import UpdateExampleTaskDialog from './_dialogs/update-example-task-dialog';

const GridPage = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedExampleTask } =
    useExampleTaskStore();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const exampleTasksPagination = useTanstackPaginateQuery<ExampleTask>(
    {
      endpoint: '/example/tasks',
    },
    pagination,
  );

  // UI: table column configuration (used for sorting)
  const columns = [
    {
      label: 'ID',
      field: 'id',
      className: 'w-[100px]',
    },
    {
      label: 'Name',
      field: 'name,id',
    },
    {
      label: 'Date Created',
      field: 'created_at',
      className: 'w-[200px]',
    },
  ];

  // UI ACTIONS: header actions (create button + view toggle)
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
      <h1 className="mb-3 text-2xl font-semibold">Example Tasks</h1>

      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...exampleTasksPagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
            defaultView="grid"
          >
            {/* UI: render records in grid */}
            {exampleTasksPagination.data?.records.map(exampleTask => (
              <div
                key={exampleTask.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{exampleTask.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      ID: {exampleTask.id}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Created:</span>{' '}
                  {getDateTimezone(exampleTask.created_at, 'date_time')}
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <ButtonGroup>
                    <Button
                      variant="info"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedExampleTask(exampleTask);
                        setOpenUpdateDialog(true);
                      }}
                    >
                      <FaPenToSquare />
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedExampleTask(exampleTask);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            ))}
          </DataTable>
        </CardBody>
      </Card>

      {/* CREATE DIALOG */}
      <CreateExampleTaskDialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={exampleTasksPagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <UpdateExampleTaskDialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={exampleTasksPagination.refetch}
      />

      {/* DELETE DIALOG */}
      <DeleteExampleTaskDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={exampleTasksPagination.refetch}
      />
    </>
  );
};

export default GridPage;
