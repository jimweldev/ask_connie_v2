import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import useRagFileStore from '@/05_stores/rag/rag-file-store';
import { mainInstance } from '@/07_instances/main-instance';
import FileDropzone from '@/components/dropzone/file-dropzone';
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
import { handleRejectedFiles } from '@/lib/react-dropzone/handle-rejected-files';
import { createReactDropzoneSchema } from '@/lib/zod/zod-helpers';

// Form validation schema
const FormSchema = z.object({
  title: z.string().min(1, { message: 'Required' }),
  file: createReactDropzoneSchema(false),
});

// Props
type UpdateRagFileDialogProps = {
  open: boolean; // Dialog open state
  setOpen: (value: boolean) => void; // Function to open/close dialog
  refetch: () => void; // Function to refetch the table data after update
};

const UpdateRagFileDialog = ({
  open,
  setOpen,
  refetch,
}: UpdateRagFileDialogProps) => {
  // Zustand store
  const { selectedRagFile } = useRagFileStore();

  // Initialize react-hook-form with Zod resolver
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      file: undefined,
    },
  });

  // Populate form with selected item's data
  useEffect(() => {
    if (selectedRagFile) {
      form.reset({
        title: selectedRagFile.title || '',
      });
    }
  }, [selectedRagFile, form]);

  // Loading state for submit button
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);

  // Handle form submission
  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.file) {
      formData.append('file', data.file);
    }

    // Add _method field for Laravel to interpret as PATCH request
    formData.append('_method', 'PATCH');

    setIsLoadingUpdate(true);

    toast.promise(
      mainInstance.post(`/rag/files/${selectedRagFile?.id}`, formData),
      {
        loading: 'Loading...',
        success: () => {
          refetch();
          setOpen(false);
          return 'Success!';
        },
        error: error =>
          error.response?.data?.message || error.message || 'An error occurred',
        finally: () => setIsLoadingUpdate(false), // Reset loading state
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
            <DialogHeader>
              <DialogTitle>Update Rag File</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <div className="grid grid-cols-12 gap-3">
                {/* Title Field */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* File Field */}
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field, fieldState }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <FileDropzone
                          isInvalid={fieldState.invalid}
                          setFiles={files => field.onChange(files[0])}
                          files={field.value}
                          onDrop={(acceptedFiles, rejectedFiles) => {
                            field.onChange(acceptedFiles[0]);
                            handleRejectedFiles(rejectedFiles);
                          }}
                          onRemove={() => {
                            field.onChange(undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
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

export default UpdateRagFileDialog;
