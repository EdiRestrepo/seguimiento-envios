export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface SearchFilters {
  query?: string;
  operationType?: string;
  transportMode?: string;
  status?: string;
}
