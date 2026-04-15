import { useEffect, useRef, useState, type ReactNode } from 'react';
import { type UseQueryResult } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  FaArrowsRotate,
  FaBackward,
  FaBackwardStep,
  FaForward,
  FaForwardStep,
  FaListUl,
  FaTableCellsLarge,
} from 'react-icons/fa6';
import { TbReportSearch } from 'react-icons/tb';
import Tooltip from '../tooltip/tooltip';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../ui/table';
import type { DataTableColumn } from './_components/data-table-head';
import DataTableHead from './_components/data-table-head';

type PaginationState = {
  limit: string;
  page: number;
  sort: string;
  searchTerm: string;
};

type PaginationControls = {
  pagination: PaginationState;
  setPagination: (data: Partial<PaginationState>) => void;
};

type PaginatedResponse<T> = {
  records: T[];
  meta: {
    total_records: number;
    total_pages: number;
  };
};

type DataTableProps<T> = {
  pagination: UseQueryResult<PaginatedResponse<T>> & PaginationControls;
  limits?: string[];
  actions?: ReactNode;
  showHeader?: boolean;
  columns?: DataTableColumn[];
  skeleton?: ReactNode;
  showViewToggle?: boolean;
  defaultView?: 'list' | 'grid';
  onViewChange?: (view: 'list' | 'grid') => void;
  children?: ReactNode;
  list?: ReactNode;
  grid?: ReactNode;
  listSkeleton?: ReactNode;
  gridSkeleton?: ReactNode;
};

const DataTable = <T,>({
  pagination,
  limits = ['10', '15', '20', '50', '100'],
  actions,
  showHeader = true,
  columns = [],
  skeleton = <Skeleton className="h-5" />,
  showViewToggle = false,
  defaultView = 'list',
  onViewChange,
  children,
  list,
  grid,
  listSkeleton,
  gridSkeleton,
}: DataTableProps<T>) => {
  const [view, setView] = useState<'list' | 'grid'>(defaultView);
  const [searchInput, setSearchInput] = useState(
    pagination.pagination.searchTerm,
  );

  const hasReset = useRef(false);

  const { page, limit, searchTerm, sort } = pagination.pagination;

  const totalRecords = pagination.data?.meta?.total_records ?? 0;
  const totalPages = pagination.data?.meta?.total_pages ?? 1;

  const numericLimit = Number(limit);

  const start = totalRecords === 0 ? 0 : (page - 1) * numericLimit + 1;
  const end = Math.min(page * numericLimit, totalRecords);

  // Reset page and search when component mounts (only once)
  useEffect(() => {
    if (!hasReset.current) {
      hasReset.current = true;
      pagination.setPagination({
        page: 1,
        searchTerm: '',
      });
    }
  }, [pagination]);

  // Update searchInput when searchTerm from pagination changes
  useEffect(() => {
    setSearchInput(pagination.pagination.searchTerm);
  }, [pagination.pagination.searchTerm]);

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        pagination.setPagination({
          searchTerm: searchInput,
          page: 1,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchTerm, pagination]);

  const goFirst = () => pagination.setPagination({ page: 1 });

  const goPrev = () =>
    pagination.setPagination({
      page: Math.max(page - 1, 1),
    });

  const goNext = () =>
    pagination.setPagination({
      page: Math.min(page + 1, totalPages),
    });

  const goLast = () =>
    pagination.setPagination({
      page: totalPages,
    });

  const handleSort = (field?: string) => {
    if (!field) return;

    let nextSort = field;

    if (sort === field) {
      nextSort = `-${field}`;
    } else if (sort === `-${field}`) {
      nextSort = field;
    }

    pagination.setPagination({
      sort: nextSort,
      page: 1,
    });
  };

  const getSortState = (field?: string) => {
    if (!field) return null;
    if (sort === field) return 'asc';
    if (sort === `-${field}`) return 'desc';
    return null;
  };

  const handleViewChange = (newView: 'list' | 'grid') => {
    setView(newView);
    onViewChange?.(newView);
  };

  // Default grid skeleton component
  const DefaultGridSkeleton = () => (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex justify-end gap-2 border-t pt-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );

  // Determine what to render for list view
  const renderListContent = () => {
    if (pagination.isFetching) {
      return Array.from({ length: numericLimit }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="font-medium" colSpan={columns.length}>
            {listSkeleton || skeleton}
          </TableCell>
        </TableRow>
      ));
    }

    if (pagination.isError) {
      return (
        <TableRow>
          <TableCell
            className="text-center whitespace-pre-wrap"
            colSpan={columns.length}
          >
            <div className="flex flex-col">
              <p className="font-semibold">
                {isAxiosError(pagination.error) &&
                pagination.error.response?.data?.message
                  ? pagination.error.response.data.message
                  : 'An error occurred'}
              </p>
              <p className="text-destructive">
                {isAxiosError(pagination.error) &&
                pagination.error.response?.data?.error
                  ? pagination.error.response.data.error
                  : 'Unknown error occurred'}
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (pagination.data?.records?.length === 0) {
      return (
        <TableRow>
          <TableCell
            className="text-center font-medium"
            colSpan={columns.length}
          >
            No records found
          </TableCell>
        </TableRow>
      );
    }

    return list || children;
  };

  // Determine what to render for grid view
  const renderGridContent = () => {
    if (pagination.isFetching) {
      return (
        <>
          {Array.from({ length: numericLimit }).map((_, index) => (
            <div key={index}>{gridSkeleton || <DefaultGridSkeleton />}</div>
          ))}
        </>
      );
    }

    if (pagination.isError) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <p className="font-semibold">
            {isAxiosError(pagination.error) &&
            pagination.error.response?.data?.message
              ? pagination.error.response.data.message
              : 'An error occurred'}
          </p>
          <p className="text-sm text-destructive">
            {isAxiosError(pagination.error) &&
            pagination.error.response?.data?.error
              ? pagination.error.response.data.error
              : 'Unknown error occurred'}
          </p>
        </div>
      );
    }

    if (pagination.data?.records?.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <TbReportSearch className="mb-4 size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No records found</p>
        </div>
      );
    }

    return grid || children;
  };

  return (
    <div className="space-y-3">
      {/* Top Controls */}
      <div className="flex flex-col items-start justify-between gap-2 @sm/main:flex-row">
        <div className="flex flex-1 flex-wrap gap-2">{actions}</div>

        <div className="flex flex-wrap justify-center gap-2">
          <div className="flex min-w-full flex-1 gap-2 @sm/main:min-w-auto">
            <Input
              type="search"
              inputSize="sm"
              placeholder="Search..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />

            <Select
              value={limit}
              onValueChange={value =>
                pagination.setPagination({
                  limit: value,
                  page: 1,
                })
              }
            >
              <SelectTrigger size="sm" className="w-25">
                <SelectValue placeholder="Select entry" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {limits.map(limit => (
                    <SelectItem key={limit} value={limit}>
                      {limit}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Tooltip content="Refresh">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => pagination.refetch()}
                disabled={pagination.isFetching}
              >
                <FaArrowsRotate
                  className={pagination.isFetching ? 'animate-spin' : ''}
                />
              </Button>
            </Tooltip>
          </div>

          {/* View Toggle */}
          {showViewToggle && (
            <ButtonGroup>
              <Tooltip content="List View">
                <Button
                  size="icon-sm"
                  variant={view === 'list' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('list')}
                >
                  <FaListUl />
                </Button>
              </Tooltip>
              <Tooltip content="Grid View">
                <Button
                  size="icon-sm"
                  variant={view === 'grid' ? 'default' : 'outline'}
                  onClick={() => handleViewChange('grid')}
                >
                  <FaTableCellsLarge />
                </Button>
              </Tooltip>
            </ButtonGroup>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {/* List View */}
        {view === 'list' && (
          <Table className={pagination.isFetching ? 'border-primary' : ''}>
            {showHeader && columns.length > 0 && (
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => {
                    const sortState = getSortState(column.field);

                    return (
                      <DataTableHead
                        key={index}
                        column={column}
                        index={index}
                        handleSort={handleSort}
                        sortState={sortState!}
                      />
                    );
                  })}
                </TableRow>
              </TableHeader>
            )}
            <TableBody className="border-b">{renderListContent()}</TableBody>
          </Table>
        )}

        {/* Grid View */}
        {view === 'grid' && (
          <div
            className={`pt-layout ${pagination.isFetching ? 'border-primary' : ''}`}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderGridContent()}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="mt-layout flex flex-wrap items-center justify-between gap-4">
        <h6 className="text-sm text-muted-foreground">
          Showing {start} to {end} of {totalRecords} entries
        </h6>

        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page === 1}
              onClick={goFirst}
            >
              <FaBackwardStep />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page === 1}
              onClick={goPrev}
            >
              <FaBackward />
            </Button>
          </div>

          <Button
            className="cursor-default font-mono text-foreground select-none hover:bg-transparent"
            variant="outline"
            size="sm"
          >
            {page} / {totalPages === 0 ? 1 : totalPages}
          </Button>

          <div className="flex">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page === totalPages}
              onClick={goNext}
            >
              <FaForward />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page === totalPages}
              onClick={goLast}
            >
              <FaForwardStep />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
