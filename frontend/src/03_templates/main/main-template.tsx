import { useState } from 'react';
import {
  FaBarsStaggered,
  FaCode,
  FaGear,
  FaHouse,
  FaRightFromBracket,
  FaUserGear,
} from 'react-icons/fa6';
import { Link, NavLink, useLocation } from 'react-router';
import useAuthStore from '@/05_stores/_common/auth-store';
import ReactImage from '@/components/image/react-image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { formatName } from '@/lib/user/format-name';
import MainTemplateSidebar, {
  type SidebarGroup,
} from './_components/main-template-sidebar';

type MainTemplateProps = {
  sidebarGroups: SidebarGroup[];
  children?: React.ReactNode;
};

const MainTemplate = ({ sidebarGroups, children }: MainTemplateProps) => {
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // /admin /home
  const mainMenuLinks = [
    { label: 'Admin', to: '/admin', icon: FaUserGear },
    { label: 'Home', to: '/', icon: FaHouse },
    ...(import.meta.env.VITE_ENV === 'development'
      ? [{ label: 'Examples', to: '/examples', icon: FaCode }]
      : []),
  ];

  const excludedMainMenuLinks = ['/admin', '/examples', '/settings'];
  const isExcluded = excludedMainMenuLinks.some(link =>
    location.pathname.startsWith(link),
  );

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <MainTemplateSidebar
        isSidebarOpen={isSidebarOpen}
        sidebarGroups={sidebarGroups}
      />

      {/* Main content area */}
      <div className="flex min-w-full flex-1 flex-col overflow-hidden md:min-w-0">
        {/* Header */}
        <header className="flex shrink-0 justify-between border-b bg-card p-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              aria-expanded={isSidebarOpen}
            >
              <FaBarsStaggered aria-hidden="true" />
            </Button>
            <Separator orientation="vertical" />

            {/* Secondary Navigation */}
            <nav aria-label="Secondary navigation">
              <ul className="flex">
                {mainMenuLinks.map(item => {
                  if (item.to === '/') {
                    const active = !isExcluded;

                    return (
                      <li key={item.label}>
                        <NavLink
                          to={item.to}
                          className={`-my-2 flex min-w-20 flex-col items-center border-b-2 px-5 py-2 uppercase transition-colors duration-200 ${active ? 'border-secondary bg-secondary/10 text-secondary' : 'border-transparent text-muted-foreground hover:bg-secondary/10'}`}
                        >
                          <item.icon
                            className={`size-5 ${active ? 'text-secondary' : 'text-muted-foreground'}`}
                            aria-hidden="true"
                          />
                          <span className="text-[10px] font-medium">
                            {item.label}
                          </span>
                        </NavLink>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          `-my-2 flex min-w-20 flex-col items-center border-b-2 px-5 py-2 uppercase transition-colors duration-200 ${
                            isActive
                              ? 'border-secondary bg-secondary/10 text-secondary'
                              : 'border-transparent text-muted-foreground hover:bg-secondary/10'
                          } `
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className={`size-5 ${isActive ? 'text-secondary' : 'text-muted-foreground'}`}
                              aria-hidden="true"
                            />
                            <span className="text-[10px] font-medium">
                              {item.label}
                            </span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="shrink-0 outline-0"
                  aria-label="User menu"
                  aria-haspopup="menu"
                >
                  <ReactImage
                    className="flex size-7 items-center justify-center overflow-hidden rounded-full border border-card outline-2 outline-primary"
                    baseUrl={import.meta.env.VITE_STORAGE_BASE_URL}
                    imagePath={user?.avatar_path}
                    alt={formatName(user)}
                    fallback="/images/default-avatar.png"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="font-medium">{formatName(user)}</span>
                      <span className="text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/settings">
                    <DropdownMenuItem>
                      <FaGear />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => clearAuth()}>
                    <FaRightFromBracket />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="@container/main flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t bg-card p-2 text-sm text-muted-foreground">
          <p>{import.meta.env.VITE_APP_NAME} | Version 2.5.3 | Feb 28, 2026</p>
        </footer>
      </div>
    </div>
  );
};

export default MainTemplate;
