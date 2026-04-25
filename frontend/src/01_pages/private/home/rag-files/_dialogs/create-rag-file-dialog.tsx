import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { ReactSelectOption } from '@/04_types/_common/react-select-option';
import { mainInstance } from '@/07_instances/main-instance';
import FileDropzone from '@/components/dropzone/file-dropzone';
import SystemDropdownSelect from '@/components/react-select/system-dropdown-select';
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
import {
  createReactDropzoneSchema,
  createReactSelectSchema,
} from '@/lib/zod/zod-helpers';

// Form validation schema
const FormSchema = z.object({
  title: z.string().min(1, { message: 'Required' }),
  allowed_locations: z.array(createReactSelectSchema()).optional(),
  allowed_websites: z.array(createReactSelectSchema()).optional(),
  allowed_positions: z.array(createReactSelectSchema()).optional(),
  file: createReactDropzoneSchema(),
});

// Props
type CreateRagFileDialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  refetch: () => void;
};

const CreateRagFileDialog = ({
  open,
  setOpen,
  refetch,
}: CreateRagFileDialogProps) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      allowed_locations: [],
      allowed_websites: [],
      allowed_positions: [],
      file: undefined,
    },
  });

  const [isLoadingCreateItem, setIsLoadingCreateItem] = useState(false);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const allowedLocations =
      data.allowed_locations?.map((l: ReactSelectOption) => l.label) || [];
    const allowedPositions =
      data.allowed_positions?.map((p: ReactSelectOption) => p.label) || [];
    const allowedWebsites =
      data.allowed_websites?.map((w: ReactSelectOption) => w.label) || [];

    const formData = new FormData();

    formData.append('title', data.title);

    formData.append('allowed_locations', JSON.stringify(allowedLocations));
    formData.append('allowed_positions', JSON.stringify(allowedPositions));
    formData.append('allowed_websites', JSON.stringify(allowedWebsites));

    if (data.file) {
      formData.append('file', data.file);
    }

    setIsLoadingCreateItem(true);

    toast.promise(mainInstance.post(`/rag/files`, formData), {
      loading: 'Loading...',
      success: () => {
        form.reset();
        refetch();
        setOpen(false);
        return 'Success!';
      },
      error: error =>
        error.response?.data?.message || error.message || 'An error occurred',
      finally: () => setIsLoadingCreateItem(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent autoFocus>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(d => onSubmit(d))}
            autoComplete="off"
          >
            <DialogHeader>
              <DialogTitle>Create Rag File</DialogTitle>
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
                <FormField
                  control={form.control}
                  name="allowed_locations"
                  render={({ field, fieldState }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Locations</FormLabel>
                      <FormControl>
                        <SystemDropdownSelect
                          className={`${fieldState.invalid ? 'invalid' : ''}`}
                          module="company"
                          type="location"
                          placeholder="Select location"
                          value={field.value}
                          onChange={field.onChange}
                          isMulti
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowed_websites"
                  render={({ field, fieldState }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Websites</FormLabel>
                      <FormControl>
                        <SystemDropdownSelect
                          className={`${fieldState.invalid ? 'invalid' : ''}`}
                          module="company"
                          type="website"
                          placeholder="Select website"
                          value={field.value}
                          onChange={field.onChange}
                          isMulti
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowed_positions"
                  render={({ field, fieldState }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Positions</FormLabel>
                      <FormControl>
                        <SystemDropdownSelect
                          className={`${fieldState.invalid ? 'invalid' : ''}`}
                          module="company"
                          type="position"
                          placeholder="Select position"
                          value={field.value}
                          onChange={field.onChange}
                          isMulti
                        />
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
              <Button type="submit" disabled={isLoadingCreateItem}>
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRagFileDialog;
