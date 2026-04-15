import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import SystemDropdownSelect from '@/components/react-select/system-dropdown-select';
import PageHeader from '@/components/typography/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { createReactSelectSchema } from '@/lib/zod/zod-helpers';

const FormSchema = z.object({
  color: createReactSelectSchema(),
});

const SystemDropdownPage = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      color: undefined,
    },
  });

  const onSubmit = (_data: z.infer<typeof FormSchema>) => {
    toast.success('Success!');
  };

  return (
    <div>
      <PageHeader className="mb-3">System Dropdown</PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardBody>
              <div className="grid grid-cols-12 gap-3">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field, fieldState }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <SystemDropdownSelect
                          className={`${fieldState.invalid ? 'invalid' : ''}`}
                          module="system"
                          type="color"
                          placeholder="Select color"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-12 flex justify-end">
                  <Button type="submit">Submit</Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default SystemDropdownPage;
