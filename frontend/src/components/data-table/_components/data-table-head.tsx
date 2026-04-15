import type { ReactNode } from 'react';
import { FaCaretUp } from 'react-icons/fa6';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataTableColumn = {
  label: string | ReactNode;
  field?: string;
  className?: string;
};

type DataTableHeadProps = {
  column: DataTableColumn;
  index: number;
  handleSort: (field: string) => void;
  sortState: string;
};

const DataTableHead = ({
  column,
  index,
  handleSort,
  sortState,
}: DataTableHeadProps) => {
  return (
    <TableHead
      key={`column-${index}`}
      className={cn(
        column.field ? 'cursor-pointer select-none' : '',
        column.className,
      )}
      onClick={() => handleSort(column.field!)}
    >
      <div className="flex w-full items-center justify-between gap-2">
        {column.label}

        {column.field && (
          <FaCaretUp
            className={`transition-transform ${
              sortState === 'desc' ? 'rotate-180' : ''
            } ${sortState ? 'opacity-100' : 'opacity-30'}`}
          />
        )}
      </div>
    </TableHead>
  );
};

export default DataTableHead;
