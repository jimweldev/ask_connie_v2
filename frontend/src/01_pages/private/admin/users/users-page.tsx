import { Outlet } from 'react-router';
import PageTabList from '@/components/tabs/page-tab/page-tab-list';
import PageTabTrigger from '@/components/tabs/page-tab/page-tab-trigger';
import PageHeader from '@/components/typography/page-header';

const UsersPage = () => {
  return (
    <>
      <div className="mb-3 flex justify-between gap-2">
        <PageHeader>Users</PageHeader>

        <PageTabList>
          <PageTabTrigger to="active-users">Active Users</PageTabTrigger>
          <PageTabTrigger to="archived-users">Archived Users</PageTabTrigger>
        </PageTabList>
      </div>

      <Outlet />
    </>
  );
};

export default UsersPage;
