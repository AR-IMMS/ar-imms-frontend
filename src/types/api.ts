export interface MetaResponse {
  request_id: string;
  trace_id?: string;
}

export interface CursorPagination {
  type: 'cursor';
  next_cursor: string | null;
}

export interface PagePagination {
  type: 'page';
  page: number;
  page_size: number;
  total_items: number | null;
  total_pages: number | null;
  has_next: boolean;
  has_prev: boolean;
}

export type Pagination = CursorPagination | PagePagination;

export interface SingleResponse<T> {
  data: T;
  meta?: MetaResponse;
}

export interface ListResponse<T> {
  data: T[];
  meta?: MetaResponse;
  pagination?: Pagination;
}

export type ValidationErrorCode =
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'OUT_OF_RANGE'
  | 'UNKNOWN_FIELD'
  | 'INVALID_VALUE';

export interface FieldError {
  field: Array<string | number>;
  code: ValidationErrorCode;
  message: string;
}

export interface ErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  request_id: string;
  trace_id?: string;
  errors?: FieldError[];
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  title?: string;
  detail?: string;
  instance?: string;
  requestId?: string;
  traceId?: string;
  errors?: FieldError[];
}

export type ApiResponse<T> = SingleResponse<T> | ListResponse<T>;

export interface PaginationParams {
  page?: number;
  page_size?: number;
  cursor?: string;
  sort?: string;
}
