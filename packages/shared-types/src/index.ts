// ─── Common API response types ───────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Re-exports ──────────────────────────────────────────

export * from './auth';
export * from './user';
export * from './event';
export * from './registration';
export * from './team';
export * from './notification';
