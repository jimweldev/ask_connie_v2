import { FaCaretDown, FaChartArea, FaGears, FaUsers } from 'react-icons/fa6';
import { Outlet } from 'react-router';
import type { SidebarGroup } from '@/03_templates/main/_components/main-template-sidebar';
import MainTemplate from '@/03_templates/main/main-template';

const AdminLayout = () => {
  const sidebarGroups: SidebarGroup[] = [
    {
      group: 'Admin',
      items: [
        {
          label: 'Dashboard',
          to: '/admin',
          icon: FaChartArea,
          end: true,
        },
      ],
    },
    {
      group: 'Users',
      items: [
        {
          label: 'Users',
          to: '/admin/users',
          icon: FaUsers,
        },
      ],
    },
    {
      group: 'System',
      items: [
        {
          label: 'System Settings',
          to: '/admin/system/settings',
          icon: FaGears,
        },
        {
          label: 'System Dropdowns',
          to: '/admin/system/dropdowns',
          icon: FaCaretDown,
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

export default AdminLayout;
