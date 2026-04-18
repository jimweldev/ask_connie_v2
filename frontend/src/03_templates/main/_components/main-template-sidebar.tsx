import type { ComponentType } from 'react';
import { Link, NavLink } from 'react-router';
import ReactImage from '@/components/image/react-image';

export type SidebarGroup = {
  group: string;
  items: SidebarGroupLink[];
};

type SidebarGroupLink = {
  label: string;
  to: string;
  icon: ComponentType;
  end?: boolean;
};

type MainTemplateSidebarProps = {
  isSidebarOpen: boolean;
  sidebarGroups: SidebarGroup[];
};

const MainTemplateSidebar = ({
  isSidebarOpen,
  sidebarGroups,
}: MainTemplateSidebarProps) => {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`w-70 shrink-0 border-r bg-card transition-all ${
          isSidebarOpen ? '-ml-70 md:ml-0' : 'md:-ml-70'
        }`}
        aria-label="Sidebar navigation"
      >
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 p-4">
          <ReactImage
            className="size-6"
            imagePath="/logos/app-logo.png"
            alt="MegaTool Logo"
          />
          <h1 className="font-semibold text-muted-foreground">
            {import.meta.env.VITE_APP_NAME}
          </h1>
        </Link>

        {/* Navigation Links */}
        <nav className="p-4" aria-label="Main navigation">
          {sidebarGroups.map((group, index) => (
            <div key={`group-${index}`} className="mb-6">
              {group.group ? (
                <h2 className="mb-3 pl-2 text-xs font-semibold tracking-wider text-muted-foreground">
                  {group.group}
                </h2>
              ) : null}
              <ul className="space-y-1">
                {group.items.map(item => (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 transition-colors duration-200 ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-transparent text-muted-foreground hover:bg-primary/10'
                        }`
                      }
                      end={item.end}
                    >
                      <item.icon aria-hidden="true" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default MainTemplateSidebar;
