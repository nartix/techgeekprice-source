import { isRequestAbort, throwIfRequestAborted } from "./request-cancellation";
import {
  ApiClientError,
  HttpStatusError,
  JsonParseError,
} from "./api-client-error";

export interface RequestJsonOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  fetcher?: typeof fetch;
}

export async function requestJson<TResponse = unknown>(
  input: string | URL | Request,
  options: RequestJsonOptions = {},
): Promise<TResponse> {
  const { body, fetcher = fetch, headers, ...init } = options;
  const signal =
    init.signal === undefined && input instanceof Request
      ? input.signal
      : init.signal;
  const requestHeaders = new Headers(headers);
  const requestInit: RequestInit = { ...init, headers: requestHeaders };

  if (body !== undefined) {
    requestHeaders.set("content-type", "application/json");
    requestInit.body = JSON.stringify(body);
  }

  throwIfRequestAborted(signal);
  let response: Response;

  try {
    response = await fetcher(input, requestInit);
  } catch (cause) {
    throwIfRequestAborted(signal);
    if (isRequestAbort(cause)) throw cause;
    throw new ApiClientError({
      code: "api_client.request.failed",
      message: "Spring API request failed before a response was received.",
      cause,
    });
  }

  throwIfRequestAborted(signal);
  let parsedBody: unknown;
  try {
    parsedBody = await parseJsonResponse(response);
  } catch (cause) {
    throwIfRequestAborted(signal);
    throw cause;
  }
  throwIfRequestAborted(signal);

  if (!response.ok) {
    throw new HttpStatusError({
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
    });
  }

  return parsedBody as TResponse;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
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
