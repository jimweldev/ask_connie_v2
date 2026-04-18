import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import useAuthStore from '@/05_stores/_common/auth-store';
import { publicInstance } from '@/07_instances/public-instance';
import ReactImage from '@/components/image/react-image';
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
  email: z.string().min(1, {
    message: 'Required',
  }),
  password: z.string().min(1, {
    message: 'Required',
  }),
});

const LoginPage = () => {
  const { setAuth } = useAuthStore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    toast.promise(publicInstance.post('/auth/login', data), {
      loading: 'Loading...',
      success: response => {
        setAuth(response.data.user, response.data.access_token);
        return 'Success!';
      },
      error: error => {
        return (
          error.response?.data?.message || error.message || 'An error occurred'
        );
      },
      finally: () => setIsLoading(false),
    });
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <div className="mb-4 flex flex-col items-center">
        <h4 className="text-xl font-semibold">
          {import.meta.env.VITE_APP_NAME}
        </h4>
      </div>
      <Card className="w-90">
        <CardBody>
          <ReactImage
            className="h-12 w-12 rounded-full"
            imagePath="/logos/app-logo.png"
            alt={`${import.meta.env.VITE_APP_NAME} Logo`}
          />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-12 gap-3">
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={import.meta.env.VITE_EMAIL_PLACEHOLDER}
                          {...field}
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="col-span-12">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Password"
                          {...field}
                          autoComplete="current-password"
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  className="col-span-12"
                  type="submit"
                  disabled={isLoading}
                >
                  Login
                </Button>
              </div>
            </form>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;
