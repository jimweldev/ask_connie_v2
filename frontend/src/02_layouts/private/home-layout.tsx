import { FaFile, FaHouse } from 'react-icons/fa6';
import { Outlet } from 'react-router';
import type { SidebarGroup } from '@/03_templates/main/_components/main-template-sidebar';
import MainTemplate from '@/03_templates/main/main-template';

const HomeLayout = () => {
  const sidebarGroups: SidebarGroup[] = [
    {
      group: 'Pages',
      items: [
        {
          label: 'Home',
          to: '/',
          icon: FaHouse,
          end: true,
        },
        {
          label: 'Rag Files',
          to: '/rag-files',
          icon: FaFile,
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

export default HomeLayout;
