import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { toast } from 'sonner';
import useArchivedUserStore from '@/05_stores/user/archived-user-store';
import { mainInstance } from '@/07_instances/main-instance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import useInvalidateQueries from '@/hooks/tanstack/use-invalidate-queries';
import { formatName } from '@/lib/user/format-name';

// Component Props
type RestoreArchivedUserDialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  refetch: () => void;
};

const RestoreArchivedUserDialog = ({
  open,
  setOpen,
  refetch,
}: RestoreArchivedUserDialogProps) => {
  // Access store values
  const { selectedArchivedUser } = useArchivedUserStore();
  const invalidateQueries = useInvalidateQueries();

  // Track loading state for submit button
  const [isLoadingRestoreItem, setIsLoadingRestoreItem] =
    useState<boolean>(false);

  // Handle form submission
  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior
    setIsLoadingRestoreItem(true); // Start loading state

    // Send RESTORE request and show toast notifications
    toast.promise(
      mainInstance.post(`/archived-users/restore/${selectedArchivedUser?.id}`),
      {
        loading: 'Loading...',
        success: () => {
          refetch();
          setOpen(false);
          invalidateQueries(['/users']);
          return 'Success!';
        },
        error: error => {
          // Display error message from response or fallback
          return (
            error.response?.data?.message ||
            error.message ||
            'An error occurred'
          );
        },
        finally: () => {
          setIsLoadingRestoreItem(false); // Reset loading state
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {/* Form */}
        <form onSubmit={onSubmit}>
          {/* Dialog body */}
          <DialogBody>
            {/* Warning icon */}
            <CircleAlert className="mx-auto mb-4 text-warning" size={64} />

            {/* Modal title */}
            <h3 className="text-center text-xl">Restore User</h3>
            <p className="mb-2 text-center text-muted-foreground">
              Are you sure you want to restore this record?
            </p>

            {/* Item */}
            <h2 className="text-center text-2xl font-semibold">
              {formatName(selectedArchivedUser)}
            </h2>
          </DialogBody>

          {/* Modal footer */}
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="warning"
              type="submit"
              disabled={isLoadingRestoreItem}
            >
              Restore
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RestoreArchivedUserDialog;
