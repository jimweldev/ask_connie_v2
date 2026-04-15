import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import SystemDropdownModulesTab from './01_pages/private/admin/system/system-dropdowns/_tabs/system-dropdown-modules/system-dropdown-modules-tab';
import SystemDropdownsTab from './01_pages/private/admin/system/system-dropdowns/_tabs/system-dropdowns/system-dropdowns-tab';
import SystemDropdownsPage from './01_pages/private/admin/system/system-dropdowns/system-dropdowns-page';
import SystemSettingsPage from './01_pages/private/admin/system/system-settings/system-settings-page';
import ActiveUsersTab from './01_pages/private/admin/users/active-users/active-users-tab';
import ArchivedUsersTab from './01_pages/private/admin/users/archived-users/archived-users-tab';
import UsersPage from './01_pages/private/admin/users/users-page';
import CrudBuilderPage from './01_pages/private/examples/builder/crud-builder-page';
import GridPage from './01_pages/private/examples/data-table/grid-page';
import ListGridPage from './01_pages/private/examples/data-table/list-grid-page';
import ListPage from './01_pages/private/examples/data-table/list-page';
import CheckboxPage from './01_pages/private/examples/forms/checkbox-page';
import InputPage from './01_pages/private/examples/forms/input-page';
import RadioGroupPage from './01_pages/private/examples/forms/radio-group-page';
import ReactDropzonePage from './01_pages/private/examples/forms/react-dropzone-page';
import ReactQuillPage from './01_pages/private/examples/forms/react-quill-page';
import ReactSelectPage from './01_pages/private/examples/forms/react-select-page';
import SystemDropdownPage from './01_pages/private/examples/forms/system-dropdown-page';
import TextareaPage from './01_pages/private/examples/forms/textarea-page';
import RagFilesPage from './01_pages/private/home/rag-files/rag-files-page';
import LoginPage from './01_pages/public/login-page';
import AdminLayout from './02_layouts/private/admin-layout';
import ExamplesLayout from './02_layouts/private/examples-layout';
import HomeLayout from './02_layouts/private/home-layout';
import PrivateLayout from './02_layouts/private/private-layout';
import PublicLayout from './02_layouts/public/public-layout';
import useAuthStore from './05_stores/_common/auth-store';

const App = () => {
  const { token } = useAuthStore();

  const publicRoutes = [
    {
      element: <PublicLayout />,
      children: [
        {
          path: '/login',
          element: <LoginPage />,
        },
      ],
    },
    {
      path: '/*',
      element: <Navigate to="/login" replace />,
    },
  ];

  const privateRoutes = [
    {
      element: <PrivateLayout />,
      children: [
        // HOME LAYOUT
        {
          element: <HomeLayout />,
          children: [
            {
              path: '/',
              element: <h1>Home</h1>,
            },
            {
              path: '/rag-files',
              element: <RagFilesPage />,
            },
          ],
        },

        // ADMIN LAYOUT
        {
          element: <AdminLayout />,
          children: [
            {
              path: '/admin',
              children: [
                {
                  index: true,
                  element: <h1>Dashboard</h1>,
                },
                {
                  path: 'users',
                  element: <UsersPage />,
                  children: [
                    {
                      index: true,
                      element: (
                        <Navigate to="/admin/users/active-users" replace />
                      ),
                    },
                    {
                      path: 'active-users',
                      element: <ActiveUsersTab />,
                    },
                    {
                      path: 'archived-users',
                      element: <ArchivedUsersTab />,
                    },
                  ],
                },
                {
                  path: 'system',
                  children: [
                    {
                      index: true,
                      element: <Navigate to="/admin/system/settings" replace />,
                    },
                    {
                      path: 'settings',
                      element: <SystemSettingsPage />,
                    },
                    {
                      path: 'dropdowns',
                      element: <SystemDropdownsPage />,
                      children: [
                        {
                          index: true,
                          element: (
                            <Navigate
                              to="/admin/system/dropdowns/dropdowns"
                              replace
                            />
                          ),
                        },
                        {
                          path: 'dropdowns',
                          element: <SystemDropdownsTab />,
                        },
                        {
                          path: 'dropdown-modules',
                          element: <SystemDropdownModulesTab />,
                        },
                      ],
                    },
                  ],
                },
                {
                  path: 'mails',
                  children: [
                    {
                      index: true,
                      element: <h1>Mails</h1>,
                    },
                    {
                      path: 'templates',
                      element: <h1>Templates</h1>,
                    },
                  ],
                },
              ],
            },
          ],
        },

        // EXAMPLES LAYOUT
        ...(import.meta.env.VITE_ENV === 'development'
          ? [
              {
                element: <ExamplesLayout />,
                children: [
                  {
                    path: '/examples',
                    children: [
                      {
                        index: true,
                        element: (
                          <Navigate to="/examples/forms/input" replace />
                        ),
                      },
                      {
                        path: 'forms',
                        children: [
                          {
                            index: true,
                            element: (
                              <Navigate to="/examples/forms/input" replace />
                            ),
                          },
                          {
                            path: 'input',
                            element: <InputPage />,
                          },
                          {
                            path: 'textarea',
                            element: <TextareaPage />,
                          },
                          {
                            path: 'checkbox',
                            element: <CheckboxPage />,
                          },
                          {
                            path: 'radio-group',
                            element: <RadioGroupPage />,
                          },
                          {
                            path: 'react-dropzone',
                            element: <ReactDropzonePage />,
                          },
                          {
                            path: 'react-quill',
                            element: <ReactQuillPage />,
                          },
                          {
                            path: 'system-dropdown',
                            element: <SystemDropdownPage />,
                          },
                          {
                            path: 'react-select',
                            element: <ReactSelectPage />,
                          },
                        ],
                      },
                      {
                        path: 'data-table',
                        children: [
                          {
                            index: true,
                            element: (
                              <Navigate
                                to="/examples/data-table/list"
                                replace
                              />
                            ),
                          },
                          {
                            path: 'list',
                            element: <ListPage />,
                          },
                          {
                            path: 'grid',
                            element: <GridPage />,
                          },
                          {
                            path: 'list-grid',
                            element: <ListGridPage />,
                          },
                        ],
                      },
                      {
                        path: 'builder',
                        element: <CrudBuilderPage />,
                      },
                    ],
                  },
                ],
              },
            ]
          : []),
      ],
    },
    {
      path: '/*',
      element: <Navigate to="/" replace />,
    },
  ];

  const routes = token ? privateRoutes : publicRoutes;

  const router = createBrowserRouter(routes);

  return <RouterProvider router={router} />;
};

export default App;
