import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/04_types/user/user';

interface AuthStoreProps {
  user: User | null;
  token: string | null;
  appName: string | null;
  setUser: (user: User) => void;
  setToken: (token: string, navigate?: (path: string) => void) => void;
  setAuth: (
    user: User,
    token: string,
    navigate?: (path: string) => void,
  ) => void;
  clearAuth: (navigate?: (path: string) => void) => void;
}

const useAuthStore = create<AuthStoreProps>()(
  persist(
    set => ({
      user: null,
      token: null,
      appName: null,
      setUser: user => set({ user }),
      setToken: token => {
        set({ token });
      },
      setAuth: (user, token) => {
        set({ user, token, appName: import.meta.env.VITE_APP_NAME });
      },
      clearAuth: () => {
        set({ user: null, token: null, appName: null });
      },
    }),
    {
      name: 'auth-user',
    },
  ),
);

export default useAuthStore;
