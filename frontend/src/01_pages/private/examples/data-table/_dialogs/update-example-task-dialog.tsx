import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import useExampleTaskStore from '@/05_stores/example/example-task-store';
import { mainInstance } from '@/07_instances/main-instance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// FORM SCHEMA
const FormSchema = z.object({
  name: z.string().min(1, { message: 'Required' }),
});

type UpdateExampleTaskDialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  refetch: () => void;
};

const UpdateExampleTaskDialog = ({
  open,
  setOpen,
  refetch,
}: UpdateExampleTaskDialogProps) => {
  // STORE: selected record
  const { selectedExampleTask } = useExampleTaskStore();

  // FORM
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
    },
  });

  // EFFECT: populate form when record changes
  useEffect(() => {
    if (selectedExampleTask) {
      form.reset({
        name: selectedExampleTask.name || '',
      });
    }
  }, [selectedExampleTask, form]);

  // STATE: loading state for update
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

  // ACTION: update record
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    setIsLoadingUpdate(true);

    // API: update request
    toast.promise(
      mainInstance.patch(`/example/tasks/${selectedExampleTask?.id}`, data),
      {
        loading: 'Loading...',
        success: () => {
          refetch();
          setOpen(false);
          return 'Success!';
        },
        error: error =>
          error.response?.data?.message || error.message || 'An error occurred',
        finally: () => setIsLoadingUpdate(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
            <DialogHeader>
              <DialogTitle>Update Example Task</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <div className="grid grid-cols-12 gap-3">
                {/* FORM FIELD: name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Name</FormLabel>

                      <FormControl>
                        <Input {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter className="flex justify-end gap-2">
              {/* ACTION: cancel */}
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              {/* ACTION: submit update */}
              <Button type="submit" disabled={isLoadingUpdate}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateExampleTaskDialog;
