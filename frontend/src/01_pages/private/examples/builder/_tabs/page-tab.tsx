import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import ReactSelect from 'react-select';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {
  docco,
  monokaiSublime,
} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import useThemeStore from '@/05_stores/_common/theme-store';
import { Button } from '@/components/ui/button';
import convertNaming from '@/lib/naming/naming-helper';
import { type FormData } from '../crud-builder-page';
import FilenameInputGroup from './_components/filename-input-group';

const PageTab = () => {
  const { theme } = useThemeStore();
  const [isCopied, setIsCopied] = useState(false);

  const [pageViewType, setPageViewType] = useState<
    'list' | 'grid' | 'list/grid'
  >('list');

  const { control } = useFormContext<FormData>();
  const formValues = useWatch<FormData>({ control });

  if (!formValues.table) return null;

  const { group, table, route, table_fields } = formValues;

  // For table name like "system_settings" (already plural)
  // We need to handle singular and plural correctly
  const tableSingular = convertNaming(table, 'PascalSingular'); // SystemSetting
  const tablePlural = convertNaming(table, 'PascalPlural'); // SystemSettings (should be correct)

  // For filenames and variable names, use the singular form
  const modelName = tableSingular;
  const pascalPlural = tablePlural;
  const camelSingular = convertNaming(table, 'CamelSingular'); // systemSetting
  const camelPlural = convertNaming(table, 'CamelPlural'); // systemSettings
  const kebabSingular = convertNaming(table, 'KebabSingular'); // system-setting
  const kebabPlural = convertNaming(table, 'KebabPlural'); // system-settings
  const readablePlural = convertNaming(table, 'ReadablePlural'); // System Settings
  const groupPath = group ? `/${convertNaming(group, 'KebabSingular')}` : '';

  const validFields =
    table_fields?.filter(f => f.name && f.name.trim() !== '') || [];

  // Get the first string field for grid display (fallback to first field or id)
  const stringFields = validFields.filter(f => f.type === 'string');
  const displayField =
    stringFields.length > 0
      ? stringFields[0].name
      : validFields.length > 0
        ? validFields[0].name
        : 'id';

  // Generate columns configuration
  const generateColumns = () => {
    const columns = [
      `    {
      label: 'ID',
      field: 'id',
      className: 'w-[100px]',
    },`,
    ];

    // Add string fields first
    stringFields.forEach(field => {
      columns.push(`    {
      label: '${convertNaming(field.name!, 'Readable')}',
      field: '${field.name},id',
    },`);
    });

    // Add other non-string fields
    validFields.forEach(field => {
      if (field.type !== 'string') {
        columns.push(`    {
      label: '${convertNaming(field.name!, 'Readable')}',
      field: '${field.name}',
    },`);
      }
    });

    columns.push(`    {
      label: 'Date Created',
      field: 'created_at',
      className: 'w-[200px]',
    },`);

    if (pageViewType !== 'grid') {
      columns.push(`    {
      label: 'Actions',
      className: 'w-[100px]',
    },`);
    }

    return columns.join('\n');
  };

  // Generate table cells for list view
  const generateTableCells = () => {
    const cells = [
      `                <TableCell className="font-medium">{${camelSingular}.id}</TableCell>`,
    ];

    validFields.forEach(field => {
      cells.push(
        `                <TableCell>{${camelSingular}.${field.name}}</TableCell>`,
      );
    });

    cells.push(`                <TableCell>
                  {getDateTimezone(${camelSingular}.created_at, 'date_time')}
                </TableCell>
                <TableCell>
                  <ButtonGroup>
                    <Button
                      variant="info"
                      size="icon-xs"
                      onClick={() => {
                        setSelected${modelName}(${camelSingular});
                        setOpenUpdateDialog(true);
                      }}
                    >
                      <FaPenToSquare />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-xs"
                      onClick={() => {
                        setSelected${modelName}(${camelSingular});
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <FaTrash />
                    </Button>
                  </ButtonGroup>
                </TableCell>`);

    return cells.join('\n');
  };

  // Generate grid card content
  const generateGridCard = () => {
    const fields = [
      `                  <div className="space-y-1">
                    <h4 className="font-semibold">{${camelSingular}.${displayField}}</h4>
                    <p className="text-xs text-muted-foreground">
                      ID: {${camelSingular}.id}
                    </p>
                  </div>`,
    ];

    // Add additional fields to grid (excluding the display field)
    validFields.forEach(field => {
      if (field.name !== displayField) {
        fields.push(`                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">${convertNaming(field.name!, 'Readable')}:</span> {${camelSingular}.${field.name}}
                  </div>`);
      }
    });

    fields.push(`                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Created:</span> {getDateTimezone(${camelSingular}.created_at, 'date_time')}
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-3">
                    <ButtonGroup>
                      <Button
                        variant="info"
                        size="icon-xs"
                        onClick={() => {
                          setSelected${modelName}(${camelSingular});
                          setOpenUpdateDialog(true);
                        }}
                      >
                        <FaPenToSquare />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        onClick={() => {
                          setSelected${modelName}(${camelSingular});
                          setOpenDeleteDialog(true);
                        }}
                      >
                        <FaTrash />
                      </Button>
                    </ButtonGroup>
                  </div>`);

    return fields.join('\n');
  };

  // -------------------------
  // LIST PAGE TEMPLATE
  // -------------------------
  const generateListPage = () => {
    const columns = generateColumns();
    const tableCells = generateTableCells();

    return `import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { ${modelName} } from '@/04_types${groupPath}/${kebabSingular}';
import use${modelName}Store from '@/05_stores${groupPath}/${kebabSingular}-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import Create${modelName}Dialog from './_dialogs/create-${kebabSingular}-dialog';
import Delete${modelName}Dialog from './_dialogs/delete-${kebabSingular}-dialog';
import Update${modelName}Dialog from './_dialogs/update-${kebabSingular}-dialog';

const ${pascalPlural}Page = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelected${modelName} } =
    use${modelName}Store();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const ${camelPlural}Pagination = useTanstackPaginateQuery<${modelName}>(
    {
      endpoint: '${route}',
    },
    pagination,
  );

  // UI: table column configuration
  const columns = [${columns}
  ];

  // UI ACTIONS: header actions (create button)
  const Actions = (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpenCreateDialog(true);
        }}
      >
        Create
      </Button>
    </>
  );

  return (
    <>
      <h1 className="mb-3 text-2xl font-semibold">${readablePlural}</h1>

      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...${camelPlural}Pagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
          >
            {/* UI: render records */}
            {${camelPlural}Pagination.data?.records.map(${camelSingular} => (
              <TableRow key={${camelSingular}.id}>
${tableCells}
              </TableRow>
            ))}
          </DataTable>
        </CardBody>
      </Card>

      {/* CREATE DIALOG */}
      <Create${modelName}Dialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={${camelPlural}Pagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <Update${modelName}Dialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={${camelPlural}Pagination.refetch}
      />

      {/* DELETE DIALOG */}
      <Delete${modelName}Dialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={${camelPlural}Pagination.refetch}
      />
    </>
  );
};

export default ${pascalPlural}Page;`;
  };

  // -------------------------
  // GRID PAGE TEMPLATE
  // -------------------------
  const generateGridPage = () => {
    const columns = generateColumns()
      .split('\n')
      .filter(line => !line.includes('Actions'))
      .join('\n');
    const gridCard = generateGridCard();

    return `import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { ${modelName} } from '@/04_types${groupPath}/${kebabSingular}';
import use${modelName}Store from '@/05_stores${groupPath}/${kebabSingular}-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import Create${modelName}Dialog from './_dialogs/create-${kebabSingular}-dialog';
import Delete${modelName}Dialog from './_dialogs/delete-${kebabSingular}-dialog';
import Update${modelName}Dialog from './_dialogs/update-${kebabSingular}-dialog';

const ${pascalPlural}Page = () => {
  // STORE: pagination + selected record state
  const { pagination, setPagination, setSelected${modelName} } =
    use${modelName}Store();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const ${camelPlural}Pagination = useTanstackPaginateQuery<${modelName}>(
    {
      endpoint: '${route}',
    },
    pagination,
  );

  // UI: table column configuration (used for sorting)
  const columns = [${columns}
  ];

  // UI ACTIONS: header actions (create button)
  const Actions = (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpenCreateDialog(true);
        }}
      >
        Create
      </Button>
    </>
  );

  return (
    <>
      <h1 className="mb-3 text-2xl font-semibold">${readablePlural}</h1>

      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...${camelPlural}Pagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
            defaultView="grid"
          >
            {/* UI: render records in grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {${camelPlural}Pagination.data?.records.map(${camelSingular} => (
                <div
                  key={${camelSingular}.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
                >
${gridCard}
                </div>
              ))}
            </div>
          </DataTable>
        </CardBody>
      </Card>

      {/* CREATE DIALOG */}
      <Create${modelName}Dialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={${camelPlural}Pagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <Update${modelName}Dialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={${camelPlural}Pagination.refetch}
      />

      {/* DELETE DIALOG */}
      <Delete${modelName}Dialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={${camelPlural}Pagination.refetch}
      />
    </>
  );
};

export default ${pascalPlural}Page;`;
  };

  // -------------------------
  // COMBINED LIST + GRID TEMPLATE
  // -------------------------
  const generateListGridPage = () => {
    const columns = generateColumns();
    const tableCells = generateTableCells();
    const gridCard = generateGridCard();

    return `import { useState } from 'react';
import { FaPenToSquare, FaTrash } from 'react-icons/fa6';
import type { ${modelName} } from '@/04_types${groupPath}/${kebabSingular}';
import use${modelName}Store from '@/05_stores${groupPath}/${kebabSingular}-store';
import DataTable from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardBody } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import useTanstackPaginateQuery from '@/hooks/tanstack/use-tanstack-paginate-query';
import { getDateTimezone } from '@/lib/date/get-date-timezone';
import Create${modelName}Dialog from './_dialogs/create-${kebabSingular}-dialog';
import Delete${modelName}Dialog from './_dialogs/delete-${kebabSingular}-dialog';
import Update${modelName}Dialog from './_dialogs/update-${kebabSingular}-dialog';

const ${pascalPlural}Page = () => {
  // STORE: pagination + selected record state + view
  const { pagination, setPagination, setSelected${modelName}, view, setView } =
    use${modelName}Store();

  // DIALOG STATE
  const [openCreateDialog, setOpenCreateDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);

  // QUERY: fetch paginated records
  const ${camelPlural}Pagination = useTanstackPaginateQuery<${modelName}>(
    {
      endpoint: '${route}',
    },
    pagination,
  );

  // UI: table column configuration (used for sorting)
  const columns = [${columns}
  ];

  // UI ACTIONS: header actions (create button)
  const Actions = (
    <>
      <Button
        size="sm"
        onClick={() => {
          setOpenCreateDialog(true);
        }}
      >
        Create
      </Button>
    </>
  );

  // Render list view (table rows)
  const renderListView = () => {
    return ${camelPlural}Pagination.data?.records.map(${camelSingular} => (
      <TableRow key={${camelSingular}.id}>
${tableCells}
      </TableRow>
    ));
  };

  // Render grid view (cards)
  const renderGridView = () => {
    return ${camelPlural}Pagination.data?.records.map(${camelSingular} => (
      <div
        key={${camelSingular}.id}
        className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/50"
      >
${gridCard}
      </div>
    ));
  };

  return (
    <>
      <h1 className="mb-3 text-2xl font-semibold">${readablePlural}</h1>

      <Card>
        <CardBody>
          <DataTable
            pagination={{
              ...${camelPlural}Pagination,
              pagination,
              setPagination,
            }}
            columns={columns}
            actions={Actions}
            showViewToggle
            defaultView={view}
            onViewChange={setView}
            list={renderListView()}
            grid={renderGridView()}
          />
        </CardBody>
      </Card>

      {/* CREATE DIALOG */}
      <Create${modelName}Dialog
        open={openCreateDialog}
        setOpen={setOpenCreateDialog}
        refetch={${camelPlural}Pagination.refetch}
      />

      {/* UPDATE DIALOG */}
      <Update${modelName}Dialog
        open={openUpdateDialog}
        setOpen={setOpenUpdateDialog}
        refetch={${camelPlural}Pagination.refetch}
      />

      {/* DELETE DIALOG */}
      <Delete${modelName}Dialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        refetch={${camelPlural}Pagination.refetch}
      />
    </>
  );
};

export default ${pascalPlural}Page;`;
  };

  // -------------------------
  // MAIN GENERATOR SWITCH
  // -------------------------
  const generatePageCode = () => {
    if (pageViewType === 'list') return generateListPage();
    if (pageViewType === 'grid') return generateGridPage();
    return generateListGridPage();
  };

  const code = generatePageCode();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <FilenameInputGroup tableName={`${kebabPlural}-page.tsx`} />

      <div className="relative z-50 mb-2 flex justify-end">
        <ReactSelect
          className="react-select-container-sm w-[250px]"
          classNamePrefix="react-select-sm"
          options={[
            { label: 'List', value: 'list' },
            { label: 'Grid', value: 'grid' },
            { label: 'List/Grid', value: 'list/grid' },
          ]}
          value={{
            label:
              pageViewType === 'list'
                ? 'List'
                : pageViewType === 'grid'
                  ? 'Grid'
                  : 'List/Grid',
            value: pageViewType,
          }}
          onChange={option =>
            setPageViewType(option?.value as 'list' | 'grid' | 'list/grid')
          }
        />
      </div>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-2 right-2 z-10"
          onClick={onCopy}
        >
          {isCopied ? <Check /> : <Copy />}
        </Button>

        <SyntaxHighlighter
          language="typescript"
          style={theme === 'dark' ? monokaiSublime : docco}
          showLineNumbers
          wrapLines
          customStyle={{
            maxHeight: '600px',
            overflow: 'auto',
            borderRadius: '10px',
            fontSize: '14px',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </>
  );
};

export default PageTab;
