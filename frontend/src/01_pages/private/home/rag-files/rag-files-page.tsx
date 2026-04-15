import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { RagFile } from '@/04_types/rag/rag-file';
import useRagFileStore from '@/05_stores/rag/rag-file-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import CreateRagFileDialog from './_dialogs/create-rag-file-dialog';
import DeleteRagFileDialog from './_dialogs/delete-rag-file-dialog';
import UpdateRagFileDialog from './_dialogs/update-rag-file-dialog';

const RagFilesPage = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelectedRagFile } = useRagFileStore();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const ragFilesPagination = useTanstackPaginateQuery<RagFile>(
    {
      endpoint: '/rag/files',
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
      label: 'Title',
      field: 'title,id',
    },
    {
      label: 'File Path',
      field: 'file_path,id',
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
      <h1 className="mb-3 text-2xl font-semibold">Rag Files</h1>

      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...ragFilesPagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
          >
            {/* UI: render records */}
            {ragFilesPagination.data?.records.map(ragFile => (
              <TableRow key={ragFile.id}>
                <TableCell className="font-medium">{ragFile.id}</TableCell>
                <TableCell>{ragFile.title}</TableCell>
                <TableCell>{ragFile.file_path}</TableCell>
                <TableCell>
                  {getDateTimezone(ragFile.created_at, 'date_time')}
                </TableCell>
                <TableCell>
                  <ButtonGroup>
                    <Button
                      variant="info"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedRagFile(ragFile);
                        setOpenUpdateDialog(true);
                      }}
                    >
                      <FaPenToSquare />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => {
                        setSelectedRagFile(ragFile);
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
      <CreateRagFileDialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={ragFilesPagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <UpdateRagFileDialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={ragFilesPagination.refetch}
      />

      {/* DELETE DIALOG */}
      <DeleteRagFileDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={ragFilesPagination.refetch}
      />
    </>
  );
};

export default RagFilesPage;
