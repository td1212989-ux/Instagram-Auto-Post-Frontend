export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}