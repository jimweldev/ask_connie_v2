import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
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

const StoreTab = () => {
  const { theme } = useThemeStore();
  const [isCopied, setIsCopied] = useState(false);

  const { control } = useFormContext<FormData>();
  const formValues = useWatch<FormData>({ control });

  if (!formValues.table) return null;

  const { group, table, table_fields } = formValues;

  const modelName = convertNaming(table, 'PascalSingular');
  const camelModel = convertNaming(table, 'CamelSingular');

  // Get the first string field for default sort (fallback to 'id')
  const stringFields =
    table_fields
      ?.filter(field => field.type === 'string' && field.name)
      .map(field => field.name) || [];

  const defaultSortField = stringFields.length > 0 ? stringFields[0] : 'id';

  const generateStoreCode = () => {
    const groupPath = group ? `/${convertNaming(group, 'KebabSingular')}` : '';
    const typePath = `${groupPath}/${convertNaming(table, 'KebabSingular')}`;
    const storeName = `use${modelName}Store`;
    const storageName = `${convertNaming(table, 'KebabSingular')}-preferences`;

    return `import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PaginationParams } from '@/04_types/_common/pagination';
import type { ${modelName} } from '@/04_types${typePath}';

type ${modelName}StoreProps = {
  selected${modelName}: ${modelName} | null;
  setSelected${modelName}: (${camelModel}: ${modelName} | null) => void;

  pagination: PaginationParams;
  setPagination: (data: Partial<PaginationParams>) => void;

  view: 'list' | 'grid';
  setView: (view: 'list' | 'grid') => void;
};

const defaultPagination: PaginationParams = {
  limit: '15',
  page: 1,
  sort: '${defaultSortField},id',
  searchTerm: '',
};

const ${storeName} = create<${modelName}StoreProps>()(
  persist(
    set => ({
      selected${modelName}: null,
      setSelected${modelName}: ${camelModel} =>
        set({ selected${modelName}: ${camelModel} }),

      pagination: defaultPagination,

      setPagination: data =>
        set(state => ({
          pagination: { ...state.pagination, ...data },
        })),

      view: 'list',
      setView: view => set({ view }),
    }),
    {
      name: '${storageName}',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        view: state.view,
        pagination: {
          limit: state.pagination.limit,
        },
      }),
      merge: (persistedState, currentState) => {
        // Start with current state (defaults)
        const merged = { ...currentState };

        // Only override persisted values
        if (persistedState && typeof persistedState === 'object') {
          if ('view' in persistedState && persistedState.view) {
            merged.view = persistedState.view as 'list' | 'grid';
          }

          if ('pagination' in persistedState && persistedState.pagination) {
            const persistedPagination =
              persistedState.pagination as Partial<PaginationParams>;
            merged.pagination = {
              // Start with defaults
              ...merged.pagination,
              // Apply only persisted fields (limit)
              ...persistedPagination,
              // Explicitly reset non-persisted fields to defaults
              page: defaultPagination.page,
              sort: defaultPagination.sort,
              searchTerm: defaultPagination.searchTerm,
            };
          }
        }

        return merged;
      },
    },
  ),
);

export default ${storeName};
`;
  };

  const code = generateStoreCode();

  const onCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <FilenameInputGroup
        tableName={`${group ? `${convertNaming(group, 'KebabSingular')}/` : ''}${convertNaming(table, 'KebabSingular')}-store.ts`}
      />

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

export default StoreTab;
