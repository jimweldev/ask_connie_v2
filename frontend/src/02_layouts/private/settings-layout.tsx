import { FaGear, FaLock, FaUser } from 'react-icons/fa6';
import { Outlet } from 'react-router';
import type { SidebarGroup } from '@/03_templates/main/_components/main-template-sidebar';
import MainTemplate from '@/03_templates/main/main-template';

const SettingsLayout = () => {
  const sidebarGroups: SidebarGroup[] = [
    {
      group: 'Admin',
      items: [
        {
          label: 'Profile',
          to: '/settings',
          icon: FaUser,
          end: true,
        },
        {
          label: 'Password',
          to: '/settings/password',
          icon: FaLock,
          end: true,
        },
        {
          label: 'General',
          to: '/settings/general',
          icon: FaGear,
          end: true,
        },
      ],
    },
  ];

  return (
    <MainTemplate sidebarGroups={sidebarGroups}>
      <Outlet />
    </MainTemplate>
  );
};

export default SettingsLayout;
