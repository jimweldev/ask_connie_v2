import React, { useState } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { mainInstance } from '@/07_instances/main-instance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';

type DeleteAllChatsDialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  historyLength: number;
  onDeleteAll: () => void; // Callback to refresh chat list after deletion
  onAllChatsDeleted?: () => void; // Optional callback for when all chats are deleted
};

const DeleteAllChatsDialog = ({
  open,
  setOpen,
  historyLength,
  onDeleteAll,
  onAllChatsDeleted,
}: DeleteAllChatsDialogProps) => {
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const deleteAllChats = async () => {
    try {
      setIsDeletingAll(true);
      await mainInstance.delete('/chat/delete-all', {
        params: { external_user_id: '1', app_source: 'default' },
      });

      // Call the callback to refresh the chat list
      onDeleteAll();

      // Notify parent that all chats were deleted
      if (onAllChatsDeleted) {
        onAllChatsDeleted();
      }
    } catch (_err) {
      console.error('Failed to delete all chats');
      alert('Failed to delete all chats. Please try again.');
    } finally {
      setIsDeletingAll(false);
      setOpen(false);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    deleteAllChats();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogBody>
            <CircleAlert className="mx-auto mb-4 text-destructive" size={64} />
            <h3 className="text-center text-xl">Delete All Chats</h3>
            <p className="mb-2 text-center text-muted-foreground">
              Are you sure you want to delete all {historyLength} chat(s)?
            </p>
            <p className="text-center text-sm text-destructive">
              This action cannot be undone.
            </p>
          </DialogBody>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="submit"
              disabled={isDeletingAll}
            >
              {isDeletingAll ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              Delete All
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAllChatsDialog;
