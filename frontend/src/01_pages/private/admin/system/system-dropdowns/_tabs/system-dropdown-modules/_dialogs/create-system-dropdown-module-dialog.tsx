import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import ReactSelectCreatable from 'react-select/creatable';
import { toast } from 'sonner';
import { z } from 'zod';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createReactSelectSchema } from '@/lib/zod/zod-helpers';

// Form validation schema
const FormSchema = z.object({
  label: z.string().min(1, { message: 'Required' }),
  system_dropdown_module_types: z.array(createReactSelectSchema(false)),
});

// Props
type CreateSystemDropdownModuleDialogProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
  refetch: () => void;
};

const CreateSystemDropdownModuleDialog = ({
  open,
  setOpen,
  refetch,
}: CreateSystemDropdownModuleDialogProps) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      label: '',
      system_dropdown_module_types: [],
    },
  });

  const [isLoadingCreateItem, setIsLoadingCreateItem] = useState(false);

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const systemDropdownModuleTypes = data.system_dropdown_module_types.map(
      item => item.value,
    );

    const newData = {
      ...data,
      system_dropdown_module_types: systemDropdownModuleTypes,
    };

    setIsLoadingCreateItem(true);

    toast.promise(mainInstance.post(`/system/dropdown-modules`, newData), {
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
              <DialogTitle>Create System Dropdown Module</DialogTitle>
            </DialogHeader>

            <DialogBody>
              <div className="grid grid-cols-12 gap-3">
                {/* Label Field */}
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Label</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* System Dropdown Module Types Field */}
                <FormField
                  control={form.control}
                  name="system_dropdown_module_types"
                  render={({ field, fieldState }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Types</FormLabel>
                      <FormControl>
                        <ReactSelectCreatable
                          className={`react-select ${fieldState.error ? 'border-red-500' : ''}`}
                          classNamePrefix="react-select"
                          {...field}
                          options={[]}
                          isMulti
                        />
                      </FormControl>
                      <FormDescription>
                        Type a value and press{' '}
                        <kbd className="text-foreground">Tab</kbd> to add it.
                      </FormDescription>
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

export default CreateSystemDropdownModuleDialog;
