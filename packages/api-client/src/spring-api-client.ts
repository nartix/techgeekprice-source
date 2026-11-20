import { ApiClientError } from "./api-client-error";
import { requestJson, type RequestJsonOptions } from "./request-json";

export interface SpringApiClientOptions {
  baseUrl: string | URL;
  defaultHeaders?: HeadersInit;
  fetcher?: typeof fetch;
}

export interface SpringApiClient {
  readonly baseUrl: string;
  requestJson<TResponse = unknown>(
    path: string | URL,
    options?: Omit<RequestJsonOptions, "fetcher">,
  ): Promise<TResponse>;
}

export function createSpringApiClient(
  options: SpringApiClientOptions,
): SpringApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  return {
    baseUrl: baseUrl.href,
    requestJson<TResponse = unknown>(
      path: string | URL,
      requestOptions: Omit<RequestJsonOptions, "fetcher"> = {},
    ) {
      return requestJson<TResponse>(resolveSpringApiUrl(baseUrl, path), {
        ...requestOptions,
        fetcher: options.fetcher,
        headers: mergeHeaders(options.defaultHeaders, requestOptions.headers),
      });
    },
  };
}

export function normalizeBaseUrl(baseUrl: string | URL): URL {
  try {
    const parsedUrl = baseUrl instanceof URL ? new URL(baseUrl.href) : new URL(baseUrl);
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");
    return parsedUrl;
  } catch (cause) {
    throw new ApiClientError({
      code: "api_client.config.invalid_base_url",
      message: "Spring API base URL must be an absolute URL.",
      cause,
    });
  }
}

export function resolveSpringApiUrl(baseUrl: URL, path: string | URL): URL {
  if (path instanceof URL) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const baseHref = baseUrl.href.endsWith("/") ? baseUrl.href : `${baseUrl.href}/`;

  return new URL(normalizedPath, baseHref);
}

function mergeHeaders(
  defaultHeaders: HeadersInit | undefined,
  requestHeaders: HeadersInit | undefined,
): Headers {
  const headers = new Headers(defaultHeaders);
  new Headers(requestHeaders).forEach((value, key) => {
    headers.set(key, value);
  });

  return headers;
}
