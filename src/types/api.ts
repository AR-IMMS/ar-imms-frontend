export interface ErrorResponse {
  code: string;
  message: string;
  details?: {
    status: number;
    instance?: string;
    type?: string;
    reason?: string;
    detail?: string;
  };
}

export interface MetaResponse {
  timestamp: string;
  correlationId: string;
  version: string;
}

export interface ApiSuccess<T> {
  success?: true;
  data: T;
  meta: MetaResponse;
  error?: never;
}

export interface ApiFailure {
  success?: false;
  error: ErrorResponse;
  meta: MetaResponse;
  data?: never;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: "username" | "email" | "status" | "createdAt" | "updatedAt";
  sortDirection?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
