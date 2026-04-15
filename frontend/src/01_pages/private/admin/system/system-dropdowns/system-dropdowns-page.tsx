import { Outlet } from 'react-router';
import CardTabList from '@/components/tabs/card-tab/card-tab-list';
import CardTabTrigger from '@/components/tabs/card-tab/card-tab-trigger';
import PageHeader from '@/components/typography/page-header';
import { Card, CardBody } from '@/components/ui/card';

const SystemDropdownsPage = () => {
  return (
    <>
      <PageHeader className="mb-3">System Dropdowns</PageHeader>

      <Card>
        <CardTabList>
          <CardTabTrigger to="/admin/system/dropdowns/dropdowns">
            Dropdowns
          </CardTabTrigger>
          <CardTabTrigger to="/admin/system/dropdowns/dropdown-modules">
            Dropdown Modules
          </CardTabTrigger>
        </CardTabList>
        <CardBody>
          <Outlet />
        </CardBody>
      </Card>
    </>
  );
};

export default SystemDropdownsPage;
