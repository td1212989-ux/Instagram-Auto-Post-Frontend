// Shared response envelope contracts.

export interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  ok: false;
  message: string;
  /** Backend-defined error code, e.g. "VALIDATION_ERROR", "NOT_FOUND". */
  code?: string;
  /** Per-field validation errors. */
  errors?: Record<string, string[]>;
}

export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;
