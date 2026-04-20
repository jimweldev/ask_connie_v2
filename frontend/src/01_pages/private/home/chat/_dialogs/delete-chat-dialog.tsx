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

type ChatHistoryItem = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

type DeleteChatDialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  chatToDelete: ChatHistoryItem | null;
  onDelete: () => void; // Callback to refresh chat list and handle navigation
  chatId?: number | null; // Current active chat ID
  onChatDeleted?: (deletedChatId: number) => void; // Optional callback for when chat is deleted
};

const DeleteChatDialog = ({
  open,
  setOpen,
  chatToDelete,
  onDelete,
  chatId,
  onChatDeleted,
}: DeleteChatDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteChat = async () => {
    if (!chatToDelete) return;

    try {
      setIsDeleting(true);
      await mainInstance.delete(`/chat/${chatToDelete.id}`, {
        params: { external_user_id: '1', app_source: 'default' },
      });

      // Call the callback to refresh the chat list
      onDelete();

      // If the deleted chat was the current active chat, notify parent
      if (chatId === chatToDelete.id && onChatDeleted) {
        onChatDeleted(chatToDelete.id);
      }
    } catch (_err) {
      console.error('Failed to delete chat');
      alert('Failed to delete chat. Please try again.');
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    deleteChat();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogBody>
            <CircleAlert className="mx-auto mb-4 text-destructive" size={64} />
            <h3 className="text-center text-xl">Delete Chat</h3>
            <p className="mb-2 text-center text-muted-foreground">
              Are you sure you want to delete this chat?
            </p>
            <h2 className="text-center text-2xl font-semibold">
              {chatToDelete?.title}
            </h2>
          </DialogBody>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" type="submit" disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteChatDialog;
