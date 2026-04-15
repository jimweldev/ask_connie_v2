import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const FormSchema = z.object({
  item: z.string().min(1, {
    message: 'Required',
  }),
});

const RadioGroupPage = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      item: '',
    },
  });

  const onSubmit = (_data: z.infer<typeof FormSchema>) => {
    toast.success('Success!');
  };

  return (
    <>
      <PageHeader className="mb-3">Radio Group</PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardBody>
              <div className="grid grid-cols-12 gap-3">
                <FormField
                  control={form.control}
                  name="item"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Frontend</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col gap-1"
                        >
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem value="react" />
                            </FormControl>
                            <FormLabel className="mb-0 text-sm font-normal">
                              React JS
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem value="angular" />
                            </FormControl>
                            <FormLabel className="mb-0 text-sm font-normal">
                              Angular
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem value="vue" />
                            </FormControl>
                            <FormLabel className="mb-0 text-sm font-normal">
                              Vue JS
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
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
    </>
  );
};

export default RadioGroupPage;
