import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import useAuthStore from '@/05_stores/_common/auth-store';

const PrivateLayout = () => {
  const navigate = useNavigate();

  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div>
      <Outlet />
    </div>
  );
};

export default PrivateLayout;
