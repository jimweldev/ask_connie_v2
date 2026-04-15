import { useMemo } from 'react';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { PaginatedResponse } from '@/04_types/_common/pagination';
import { mainInstance } from '@/07_instances/main-instance';

type PaginatedQueryResult<T> = UseQueryResult<PaginatedResponse<T>>;

type PaginatedQueryConfig = {
  endpoint: string;
  params?: string;
  defaultSort?: string;
  defaultLimit?: string;
};

type PaginationParams = {
  limit: string;
  page: number;
  sort: string;
  searchTerm: string;
};

const useTanstackPaginateQuery = <T>(
  config: PaginatedQueryConfig,
  pagination?: PaginationParams, // optional
  options?: Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'>,
): PaginatedQueryResult<T> => {
  const queryClient = useQueryClient();

  const {
    limit = config.defaultLimit ?? '10',
    page = 1,
    sort = config.defaultSort ?? '',
    searchTerm = '',
  } = pagination ?? {};

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (limit) params.append('limit', limit);
    if (page) params.append('page', page.toString());
    if (sort) params.append('sort', sort);
    if (searchTerm) params.append('search', searchTerm);

    if (config.params) {
      config.params.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          params.append(key, value);
        }
      });
    }

    return `${config.endpoint}?${params.toString()}`;
  }, [config.endpoint, config.params, limit, page, sort, searchTerm]);

  const queryKey = [
    config.endpoint,
    config.params,
    pagination?.page,
    pagination?.limit,
    pagination?.sort,
    pagination?.searchTerm,
  ];

  const query = useQuery<PaginatedResponse<T>>({
    queryKey,
    queryFn: async ({ signal }) => {
      const response = await mainInstance.get(queryString, { signal });
      return response.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled:
      options?.enabled === undefined
        ? !queryClient.getQueryData(queryKey)
        : options?.enabled && !queryClient.getQueryData(queryKey),
    ...options,
  });

  return {
    ...query,
    refetch: options => {
      queryClient.invalidateQueries({ queryKey: [config.endpoint] });
      queryClient.removeQueries({ queryKey: [config.endpoint] });
      return query.refetch(options);
    },
  };
};

export default useTanstackPaginateQuery;
