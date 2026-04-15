// response
export type PaginatedResponse<T> = {
  records: T[];
  meta: PaginationMeta;
};

export type PaginationMeta = {
  total_records: number;
  total_pages: number;
};

// params
export type PaginationParams = {
  limit: string;
  page: number;
  sort: string;
  searchTerm: string;
};
