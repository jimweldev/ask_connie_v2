import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import useExampleTaskStore from '@/05_stores/example/example-task-store';
import { mainInstance } from '@/07_instances/main-instance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';

type DeleteExampleTaskDialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  refetch: () => void;
};

const DeleteExampleTaskDialog = ({
  open,
  setOpen,
  refetch,
}: DeleteExampleTaskDialogProps) => {
  // STORE: selected record to delete
  const { selectedExampleTask } = useExampleTaskStore();

  // STATE: loading state for delete
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  // ACTION: delete record
  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingDelete(true);

    // API: delete request
    toast.promise(
      mainInstance.delete(`/example/tasks/${selectedExampleTask?.id}`),
      {
        loading: 'Loading...',
        success: () => {
          refetch();
          setOpen(false);
          return 'Success!';
        },
        error: error =>
          error.response?.data?.message || error.message || 'An error occurred',
        finally: () => setIsLoadingDelete(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogBody>
            {/* UI: warning icon */}
            <CircleAlert className="mx-auto mb-4 text-destructive" size={64} />

            {/* UI: confirmation text */}
            <h3 className="text-center text-xl">Delete Example Task</h3>

            <p className="mb-2 text-center text-muted-foreground">
              Are you sure you want to delete this record?
            </p>

            {/* UI: selected record name */}
            <h2 className="text-center text-2xl font-semibold">
              {selectedExampleTask?.name}
            </h2>
          </DialogBody>

          <DialogFooter className="flex justify-end gap-2">
            {/* ACTION: cancel */}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            {/* ACTION: confirm delete */}
            <Button
              variant="destructive"
              type="submit"
              disabled={isLoadingDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteExampleTaskDialog;
