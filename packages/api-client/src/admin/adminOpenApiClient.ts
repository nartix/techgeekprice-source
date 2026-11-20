import createClient from "openapi-fetch";
import type { paths } from "@tgp/contracts";
import { JsonParseError } from "../api-client-error";
import { throwIfRequestAborted } from "../request-cancellation";
import { normalizeBaseUrl } from "../spring-api-client";
import {
  assertAdminPath,
  consumeAdminResponse,
  requestAdminResponse,
} from "./adminFetch";

export interface AdminOpenApiClientOptions {
  baseUrl: string | URL;
  fetcher?: typeof fetch;
}

// Request normally clones signals. Retain the caller signal for the existing
// injectable URL/init transport and CSRF preparation, including identity checks.
class AdminRequest extends Request {
  private readonly callerSignal: AbortSignal | null | undefined;
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
    this.callerSignal = init?.signal;
  }
  override get signal(): AbortSignal {
    return this.callerSignal ?? super.signal;
  }
}

// Preserve success status and non-length headers, but use the established JSON/cancellation
// semantics when openapi-fetch reads the response (with or without Content-Length).
class AdminJsonResponse extends Response {
  constructor(
    private readonly original: Response,
    private readonly signal: AbortSignal,
  ) {
    // Chromium may expose an empty network stream for no-content responses,
    // while Response construction requires a null body for these statuses.
    super(
      original.status === 204 || original.status === 205 ? null : original.body,
      {
        status: original.status,
        statusText: original.statusText,
        headers: original.headers,
      },
    );
    // Always consume success bodies, including inconsistent proxy length headers.
    this.headers.delete("content-length");
  }
  override async text(): Promise<string> {
    let text: string;
    try {
      text = await this.original.text();
    } catch (error) {
      throwIfRequestAborted(this.signal);
      throw error;
    }
    throwIfRequestAborted(this.signal);
    if (!text.length) return "null";
    try {
      JSON.parse(text);
    } catch (cause) {
      throw new JsonParseError(cause);
    }
    return text;
  }
  override async json(): Promise<unknown> {
    return JSON.parse(await this.text()) as unknown;
  }
}

/** Generated endpoint signatures; runtime JSON validation remains caller-owned. */
export function createAdminOpenApiClient(options: AdminOpenApiClientOptions) {
  const base = normalizeBaseUrl(options.baseUrl);
  const basePath = base.pathname.replace(/\/$/, "");
  const client = createClient<paths>({
    baseUrl: base.href.replace(/\/$/, ""),
    Request: AdminRequest,
    credentials: "include",
    // Schema-covered bodies are JSON. Preserve legacy object serialization even
    // when a dynamic caller supplies a different content-type header.
    bodySerializer: JSON.stringify,
    querySerializer(query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        for (const item of Array.isArray(value) ? value : [value])
          params.append(key, String(item));
      }
      return params.toString();
    },
    async fetch(request) {
      throwIfRequestAborted(request.signal);
      const url = new URL(request.url);
      if (
        url.origin !== base.origin ||
        !url.pathname.startsWith(`${basePath}/`)
      ) {
        assertAdminPath("");
      }
      const path = assertAdminPath(
        url.pathname.slice(basePath.length) + url.search,
      );
      const body = request.body === null ? undefined : await request.text();
      throwIfRequestAborted(request.signal);
      return requestAdminResponse(path, {
        baseUrl: base,
        fetcher: options.fetcher,
        method: request.method,
        headers: request.headers,
        signal: request.signal,
        body,
        cache: request.cache,
        redirect: request.redirect,
        mode: request.mode,
        integrity: request.integrity,
        keepalive: request.keepalive,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy,
        credentials: "include",
      });
    },
  });
  client.use({
    async onResponse({ request, response }) {
      throwIfRequestAborted(request.signal);
      if (!response.ok)
        await consumeAdminResponse(response, base, request.signal);
      return new AdminJsonResponse(response, request.signal);
    },
  });
  return client;
}
