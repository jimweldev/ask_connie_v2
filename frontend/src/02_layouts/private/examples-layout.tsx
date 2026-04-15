import { BsTextareaResize } from 'react-icons/bs';
import {
  FaBorderAll,
  FaCaretDown,
  FaCircleDot,
  FaFileArrowUp,
  FaList,
  FaQuoteRight,
  FaRectangleList,
  FaSquareCheck,
  FaTable,
} from 'react-icons/fa6';
import { LuTextCursorInput } from 'react-icons/lu';
import { RiAiGenerateText } from 'react-icons/ri';
import { Outlet } from 'react-router';
import type { SidebarGroup } from '@/03_templates/main/_components/main-template-sidebar';
import MainTemplate from '@/03_templates/main/main-template';

const ExamplesLayout = () => {
  const sidebarGroups: SidebarGroup[] = [
    {
      group: 'Forms',
      items: [
        {
          label: 'Input',
          to: '/examples/forms/input',
          icon: LuTextCursorInput,
          end: true,
        },
        {
          label: 'Textarea',
          to: '/examples/forms/textarea',
          icon: BsTextareaResize,
        },
        {
          label: 'Checkbox',
          to: '/examples/forms/checkbox',
          icon: FaSquareCheck,
        },
        {
          label: 'Radio Group',
          to: '/examples/forms/radio-group',
          icon: FaCircleDot,
        },
        {
          label: 'React Dropzone',
          to: '/examples/forms/react-dropzone',
          icon: FaFileArrowUp,
        },
        {
          label: 'React Quill',
          to: '/examples/forms/react-quill',
          icon: FaQuoteRight,
        },
        {
          label: 'System Dropdown',
          to: '/examples/forms/system-dropdown',
          icon: FaRectangleList,
        },
        {
          label: 'React Select',
          to: '/examples/forms/react-select',
          icon: FaCaretDown,
        },
      ],
    },
    {
      group: 'Data Table',
      items: [
        {
          label: 'List',
          to: '/examples/data-table/list',
          icon: FaList,
          end: true,
        },
        {
          label: 'Grid',
          to: '/examples/data-table/grid',
          icon: FaBorderAll,
        },
        {
          label: 'List/Grid',
          to: '/examples/data-table/list-grid',
          icon: FaTable,
        },
      ],
    },
    {
      group: 'Builder',
      items: [
        {
          label: 'CRUD Builder',
          to: '/examples/builder',
          icon: RiAiGenerateText,
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

export default ExamplesLayout;
