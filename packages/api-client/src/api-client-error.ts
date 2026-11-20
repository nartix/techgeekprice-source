export type ApiClientErrorCode =
  | "api_client.request.failed"
  | "api_client.response.http_error"
  | "api_client.response.invalid_json"
  | "api_client.config.invalid_base_url"
  | "api_client.admin.path_forbidden"
  | "api_client.admin.authorization_forbidden"
  | "api_client.admin.csrf_unavailable"
  | "api_client.admin.unauthorized"
  | "api_client.admin.forbidden"
  | "api_client.admin.conflict"
  | "api_client.admin.page_size_exceeded"
  | "api_client.admin.unsupported_filter";

export interface ApiClientErrorOptions {
  code: ApiClientErrorCode;
  message: string;
  status?: number;
  cause?: unknown;
  details?: unknown;
}

export class ApiClientError extends Error {
  readonly code: ApiClientErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(options: ApiClientErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "ApiClientError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface HttpStatusErrorOptions {
  status: number;
  statusText: string;
  body: unknown;
}

export class HttpStatusError extends ApiClientError {
  constructor(options: HttpStatusErrorOptions) {
    super({
      code: "api_client.response.http_error",
      message: `Spring API request failed with status ${options.status}.`,
      status: options.status,
      details: options.body,
    });
    this.name = "HttpStatusError";
  }
}

export class JsonParseError extends ApiClientError {
  constructor(cause: unknown) {
    super({
      code: "api_client.response.invalid_json",
      message: "Spring API returned invalid JSON.",
      cause,
    });
    this.name = "JsonParseError";
  }
}

export interface AdminApiClientErrorOptions {
  code: Extract<ApiClientErrorCode, `api_client.admin.${string}`>;
  message: string;
  status?: number;
  cause?: unknown;
  details?: unknown;
}

export class AdminApiClientError extends ApiClientError {
  constructor(options: AdminApiClientErrorOptions) {
    super(options);
    this.name = "AdminApiClientError";
  }
}

export class AdminUnauthorizedError extends AdminApiClientError {
  constructor(details?: unknown) {
    super({
      code: "api_client.admin.unauthorized",
      message: "Admin session is not authenticated.",
      status: 401,
      details,
    });
    this.name = "AdminUnauthorizedError";
  }
}

export class AdminForbiddenError extends AdminApiClientError {
  constructor(details?: unknown) {
    super({
      code: "api_client.admin.forbidden",
      message: "Admin request is not authorized.",
      status: 403,
      details,
    });
    this.name = "AdminForbiddenError";
  }
}

export class AdminConflictError extends AdminApiClientError {
  constructor(details?: unknown) {
    super({
      code: "api_client.admin.conflict",
      message: "Admin resource changed before the request completed.",
      status: 409,
      details,
    });
    this.name = "AdminConflictError";
  }
}

export function mapAdminHttpError(
  options: HttpStatusErrorOptions,
): ApiClientError {
  if (options.status === 401) {
    return new AdminUnauthorizedError(options.body);
  }

  if (options.status === 403) {
    return new AdminForbiddenError(options.body);
  }

  if (options.status === 409) {
    return new AdminConflictError(options.body);
  }

  return new HttpStatusError(options);
}
