import { isRequestAbort, throwIfRequestAborted } from "../request-cancellation";

import type { AdminCsrfTokenDto } from "@tgp/contracts";

import {
  AdminApiClientError,
  ApiClientError,
  JsonParseError,
  mapAdminHttpError,
} from "../api-client-error";
import { normalizeBaseUrl, resolveSpringApiUrl } from "../spring-api-client";

export const ADMIN_API_PREFIX = "/api/v1/admin/";
export const ADMIN_CSRF_PATH = "/api/v1/admin/auth/csrf";
const ADMIN_ALLOWED_API_PATHS = [ADMIN_API_PREFIX] as const;

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const csrfCache = new Map<string, AdminCsrfTokenDto>();

export interface AdminFetchOptions extends Omit<RequestInit, "body"> {
  baseUrl: string | URL;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  fetcher?: typeof fetch;
  skipCsrf?: boolean;
}

export function clearAdminCsrfCache(baseUrl?: string | URL): void {
  if (baseUrl === undefined) {
    csrfCache.clear();
    return;
  }

  csrfCache.delete(normalizeBaseUrl(baseUrl).href);
}

export async function getAdminCsrfToken(
  baseUrl: string | URL,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal | null,
): Promise<AdminCsrfTokenDto> {
  return loadAdminCsrfToken(baseUrl, fetcher, { refresh: false, signal });
}

async function refreshAdminCsrfToken(
  baseUrl: string | URL,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal | null,
): Promise<AdminCsrfTokenDto> {
  return loadAdminCsrfToken(baseUrl, fetcher, { refresh: true, signal });
}

async function loadAdminCsrfToken(
  baseUrl: string | URL,
  fetcher: typeof fetch,
  options: { refresh: boolean; signal?: AbortSignal | null },
): Promise<AdminCsrfTokenDto> {
  throwIfRequestAborted(options.signal);
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const cacheKey = normalizedBaseUrl.href;
  const cachedToken = csrfCache.get(cacheKey);

  if (cachedToken && !options.refresh) {
    return cachedToken;
  }

  const csrfToken = await adminFetch<AdminCsrfTokenDto>(ADMIN_CSRF_PATH, {
    baseUrl: normalizedBaseUrl,
    fetcher,
    method: "GET",
    skipCsrf: true,
    signal: options.signal,
  });

  if (!csrfToken.token || !csrfToken.headerName) {
    throw new AdminApiClientError({
      code: "api_client.admin.csrf_unavailable",
      message: "Admin CSRF response did not include a token and header name.",
      details: csrfToken,
    });
  }

  csrfCache.set(cacheKey, csrfToken);
  return csrfToken;
}

export async function adminFetch<TResponse = unknown>(
  path: string,
  options: AdminFetchOptions,
): Promise<TResponse> {
  const response = await requestAdminResponse(path, options);
  return (await consumeAdminResponse(
    response,
    options.baseUrl,
    options.signal,
  )) as TResponse;
}

/** Internal raw transport shared by the legacy boundary and generated client. */
export async function requestAdminResponse(
  path: string,
  options: AdminFetchOptions,
): Promise<Response> {
  const { baseUrl, body, fetcher = fetch, skipCsrf = false, ...init } = options;
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const requestPath = assertAdminPath(path);
  throwIfRequestAborted(init.signal);
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  rejectAuthorizationHeader(headers);

  const requestInit: RequestInit = {
    ...init,
    credentials: "include",
    headers,
    method,
  };

  prepareBody(requestInit, headers, body);

  if (!skipCsrf && mutationMethods.has(method)) {
    const csrfToken = await refreshAdminCsrfToken(
      normalizedBaseUrl,
      fetcher,
      init.signal,
    );
    headers.set(csrfToken.headerName, csrfToken.token);
  }

  throwIfRequestAborted(init.signal);
  let response: Response;

  try {
    response = await fetcher(
      resolveSpringApiUrl(normalizedBaseUrl, requestPath),
      requestInit,
    );
  } catch (cause) {
    throwIfRequestAborted(init.signal);
    if (isRequestAbort(cause)) throw cause;
    throw new ApiClientError({
      code: "api_client.request.failed",
      message: "Admin API request failed before a response was received.",
      cause,
    });
  }

  throwIfRequestAborted(init.signal);
  return response;
}

/** Keep failed status authoritative even when its body cannot be consumed. */
export async function consumeAdminResponse(
  response: Response,
  baseUrl: string | URL,
  signal?: AbortSignal | null,
): Promise<unknown> {
  let parsedBody: unknown;
  try {
    parsedBody = await parseAdminJsonResponse(response);
  } catch (cause) {
    throwIfRequestAborted(signal);
    throw cause;
  }
  throwIfRequestAborted(signal);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAdminCsrfCache(baseUrl);
    }

    throw mapAdminHttpError({
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
    });
  }

  return parsedBody;
}

export function assertAdminPath(path: string): string {
  if (!isAllowedAdminApiPath(path)) {
    throw new AdminApiClientError({
      code: "api_client.admin.path_forbidden",
      message:
        "Admin API requests must use a relative configured admin API path.",
      details: { path },
    });
  }

  return path;
}

function isAllowedAdminApiPath(path: string): boolean {
  const pathname = path.split("?")[0] ?? path;

  return ADMIN_ALLOWED_API_PATHS.some((allowedPath) => {
    if (allowedPath.endsWith("/")) {
      return pathname.startsWith(allowedPath);
    }

    return pathname === allowedPath || pathname.startsWith(`${allowedPath}/`);
  });
}

function rejectAuthorizationHeader(headers: Headers): void {
  const authorization = headers.get("authorization");

  if (authorization) {
    throw new AdminApiClientError({
      code: "api_client.admin.authorization_forbidden",
      message:
        "Admin API requests must not include caller-supplied authorization.",
    });
  }
}

function prepareBody(
  requestInit: RequestInit,
  headers: Headers,
  body: AdminFetchOptions["body"],
): void {
  if (body === undefined || body === null) {
    return;
  }

  if (
    typeof body === "string" ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    requestInit.body = body;
    return;
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  requestInit.body = JSON.stringify(body);
}

async function parseAdminJsonResponse(response: Response): Promise<unknown> {
  let text: string;
  try {
    text = await response.text();
  } catch (cause) {
    if (isRequestAbort(cause) || response.ok) throw cause;
    // The status is authoritative even if the failure body cannot be read.
    return null;
  }

  if (text.length === 0) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    if (!response.ok) return null;
    throw new JsonParseError(cause);
  }
}
