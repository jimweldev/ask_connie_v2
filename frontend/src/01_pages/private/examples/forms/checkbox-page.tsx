import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import PageHeader from '@/components/typography/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const FormSchema = z.object({
  items: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'Required',
  }),
});

const CheckboxPage = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      items: [],
    },
  });

  const onSubmit = (_data: z.infer<typeof FormSchema>) => {
    toast.success('Success!');
  };

  return (
    <>
      <PageHeader className="mb-3">Checkbox</PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardBody>
              <div className="grid grid-cols-12 gap-3">
                <FormField
                  control={form.control}
                  name="items"
                  render={() => (
                    <FormItem className="col-span-12">
                      <FormLabel>Frontend</FormLabel>
                      <div className="flex flex-col gap-1">
                        <FormField
                          control={form.control}
                          name="items"
                          render={({ field }) => {
                            return (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes('react')}
                                    onCheckedChange={checked => {
                                      const item = 'react';
                                      if (checked) {
                                        field.onChange([...field.value, item]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            value => value !== item,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="mb-0 text-sm font-normal">
                                  React JS
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name="items"
                          render={({ field }) => {
                            return (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes('angular')}
                                    onCheckedChange={checked => {
                                      const item = 'angular';
                                      if (checked) {
                                        field.onChange([...field.value, item]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            value => value !== item,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="mb-0 text-sm font-normal">
                                  Angular
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                        <FormField
                          control={form.control}
                          name="items"
                          render={({ field }) => {
                            return (
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value.includes('vue')}
                                    onCheckedChange={checked => {
                                      const item = 'vue';
                                      if (checked) {
                                        field.onChange([...field.value, item]);
                                      } else {
                                        field.onChange(
                                          field.value.filter(
                                            value => value !== item,
                                          ),
                                        );
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="mb-0 text-sm font-normal">
                                  Vue JS
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      </div>
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
    </>
  );
};

export default CheckboxPage;
