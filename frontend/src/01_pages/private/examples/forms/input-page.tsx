import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  input: z.string().min(1, {
    message: 'Required',
  }),
});

const InputPage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: '',
    },
  });

  const onSubmit = (_data: z.infer<typeof formSchema>) => {
    toast.success('Success');
  };

  return (
    <>
      <PageHeader className="mb-3">Input</PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardBody>
              <div className="grid grid-cols-12 gap-3">
                <FormField
                  control={form.control}
                  name="input"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Input</FormLabel>
                      <FormControl>
                        <Input {...field} />
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

export default InputPage;
