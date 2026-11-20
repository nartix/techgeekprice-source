import {
  adminFetch,
  assertAdminPath,
  type AdminFetchOptions,
} from "./adminFetch";
import { createAdminOpenApiClient } from "./adminOpenApiClient";
import * as guard from "./adminOpenApiGuards";
import { throwIfRequestAborted } from "../request-cancellation";

type Client = ReturnType<typeof createAdminOpenApiClient>;
type DispatchOptions = Omit<AdminFetchOptions, "baseUrl" | "fetcher">;
const categoryPath = "/api/v1/admin/category-systems/{systemKey}/categories";

/** Literal generated operations behind the open-ended Refine compatibility API. */
export function dispatchAdminOpenApi(
  client: Client,
  path: string,
  options: DispatchOptions = {},
): Promise<unknown> | undefined {
  assertAdminPath(path);
  // Match legacy cancellation precedence before inspecting/serializing inputs.
  throwIfRequestAborted(options.signal);
  if (path.includes("#")) return undefined;
  const separator = path.indexOf("?");
  const pathname = separator < 0 ? path : path.slice(0, separator);
  const search = separator < 0 ? "" : path.slice(separator + 1);
  const query = new URLSearchParams(search);
  const method = (options.method ?? "GET").toUpperCase();
  const body = options.body;
  const common = {
    signal: options.signal,
    headers: options.headers,
    cache: options.cache,
    redirect: options.redirect,
  };
  const noBody = body === undefined || body === null;
  // Unusual RequestInit settings remain on the existing extension transport.
  if (
    options.skipCsrf ||
    options.mode ||
    options.integrity ||
    options.keepalive ||
    options.referrer ||
    options.referrerPolicy
  )
    return undefined;
  function result(
    promise: Promise<{ data?: unknown; response: Response }>,
  ): Promise<unknown> {
    return promise.then((value) => {
      throwIfRequestAborted(options.signal);
      return value.data ?? null;
    });
  }

  if (
    pathname === "/api/v1/admin/auth/me" &&
    method === "GET" &&
    noBody &&
    !query.size
  ) {
    return result(client.GET("/api/v1/admin/auth/me", common));
  }
  if (pathname === "/api/v1/admin/users") {
    if (method === "GET" && noBody) {
      const decoded = guard.decodeQuery(query, guard.userListQueryRules);
      if (guard.isUserListQuery(decoded))
        return result(
          client.GET("/api/v1/admin/users", {
            ...common,
            params: { query: decoded },
          }),
        );
    }
    if (method === "POST" && !query.size && guard.isUserCreateBody(body))
      return result(client.POST("/api/v1/admin/users", { ...common, body }));
    return undefined;
  }
  if (method === "GET" && noBody && pathname === "/api/v1/admin/roles") {
    const decoded = guard.decodeQuery(query, guard.roleListQueryRules);
    if (guard.isRoleListQuery(decoded))
      return result(
        client.GET("/api/v1/admin/roles", {
          ...common,
          params: { query: decoded },
        }),
      );
  }
  if (method === "GET" && noBody && pathname === "/api/v1/admin/permissions") {
    const decoded = guard.decodeQuery(query, guard.permissionListQueryRules);
    if (guard.isPermissionListQuery(decoded))
      return result(
        client.GET("/api/v1/admin/permissions", {
          ...common,
          params: { query: decoded },
        }),
      );
  }
  const user = /^\/api\/v1\/admin\/users\/(\d+)(\/status)?$/.exec(pathname);
  if (user && !query.size) {
    const id = numericId(user[1]!);
    if (id === undefined) return undefined;
    const params = { path: { id } };
    if (user[2] && method === "PATCH" && guard.isUserStatusBody(body))
      return result(
        client.PATCH("/api/v1/admin/users/{id}/status", {
          ...common,
          params,
          body,
        }),
      );
    if (!user[2]) {
      if (method === "GET" && noBody)
        return result(
          client.GET("/api/v1/admin/users/{id}", { ...common, params }),
        );
      if (method === "DELETE" && noBody)
        return result(
          client.DELETE("/api/v1/admin/users/{id}", { ...common, params }),
        );
      if (method === "PUT" && guard.isUserMutationBody(body))
        return result(
          client.PUT("/api/v1/admin/users/{id}", { ...common, params, body }),
        );
    }
  }
  const category =
    /^\/api\/v1\/admin\/category-systems\/([a-zA-Z0-9_-]+)\/categories(?:\/(.*))?$/.exec(
      pathname,
    );
  if (!category) return undefined;
  const systemKey = category[1]!;
  const suffix = category[2] ?? "";
  const systemParams = { path: { systemKey } };
  if (method === "GET" && noBody) {
    if (!suffix) {
      const decoded = guard.decodeQuery(query, guard.categoryListQueryRules);
      if (guard.isCategoryListQuery(decoded))
        return result(
          client.GET(categoryPath, {
            ...common,
            params: { ...systemParams, query: decoded },
          }),
        );
    }
    if (suffix === "tree") {
      const decoded = guard.decodeQuery(query, guard.categoryTreeQueryRules);
      if (guard.isCategoryTreeQuery(decoded))
        return result(
          client.GET(
            "/api/v1/admin/category-systems/{systemKey}/categories/tree",
            { ...common, params: { ...systemParams, query: decoded } },
          ),
        );
    }
    if (suffix === "parent-options") {
      const decoded = guard.decodeQuery(query, guard.categoryParentQueryRules);
      if (guard.isCategoryParentQuery(decoded))
        return result(
          client.GET(
            "/api/v1/admin/category-systems/{systemKey}/categories/parent-options",
            { ...common, params: { ...systemParams, query: decoded } },
          ),
        );
    }
    if (suffix === "capabilities" && !query.size)
      return result(
        client.GET(
          "/api/v1/admin/category-systems/{systemKey}/categories/capabilities",
          { ...common, params: systemParams },
        ),
      );
  }
  if (query.size) return undefined;
  if (!suffix && method === "POST" && guard.isCategoryCreateBody(body))
    return result(
      client.POST(categoryPath, { ...common, params: systemParams, body }),
    );
  const item =
    /^(\d+)(?:\/(breadcrumb|move|reorder|activate|deactivate))?$/.exec(suffix);
  if (!item) return undefined;
  const id = numericId(item[1]!);
  if (id === undefined) return undefined;
  const params = { path: { systemKey, id } };
  const operation = item[2];
  if (!operation) {
    if (method === "GET" && noBody)
      return result(
        client.GET(
          "/api/v1/admin/category-systems/{systemKey}/categories/{id}",
          { ...common, params },
        ),
      );
    if (method === "DELETE" && noBody)
      return result(
        client.DELETE(
          "/api/v1/admin/category-systems/{systemKey}/categories/{id}",
          { ...common, params },
        ),
      );
    if (method === "PUT" && guard.isCategoryUpdateBody(body))
      return result(
        client.PUT(
          "/api/v1/admin/category-systems/{systemKey}/categories/{id}",
          { ...common, params, body },
        ),
      );
  }
  if (operation === "breadcrumb" && method === "GET" && noBody)
    return result(
      client.GET(
        "/api/v1/admin/category-systems/{systemKey}/categories/{id}/breadcrumb",
        { ...common, params },
      ),
    );
  if (method !== "POST") return undefined;
  if (operation === "move" && guard.isCategoryMoveBody(body))
    return result(
      client.POST(
        "/api/v1/admin/category-systems/{systemKey}/categories/{id}/move",
        { ...common, params, body },
      ),
    );
  if (operation === "reorder" && guard.isCategoryReorderBody(body))
    return result(
      client.POST(
        "/api/v1/admin/category-systems/{systemKey}/categories/{id}/reorder",
        { ...common, params, body },
      ),
    );
  if (operation === "activate" && noBody)
    return result(
      client.POST(
        "/api/v1/admin/category-systems/{systemKey}/categories/{id}/activate",
        { ...common, params },
      ),
    );
  if (operation === "deactivate" && noBody)
    return result(
      client.POST(
        "/api/v1/admin/category-systems/{systemKey}/categories/{id}/deactivate",
        { ...common, params },
      ),
    );
  return undefined;
}

function numericId(value: string): number | undefined {
  const number = Number(value);
  return Number.isSafeInteger(number) && String(number) === value
    ? number
    : undefined;
}

/** Existing generic response boundary, retained for Refine's arbitrary resource types.
 * Request inputs are narrowed above; callers needing static endpoint checking use
 * createAdminOpenApiClient directly. This assertion does not validate live JSON.
 */
export async function adminOpenApiRequest<TResponse = unknown>(
  path: string,
  options: AdminFetchOptions,
): Promise<TResponse> {
  const response = dispatchAdminOpenApi(
    createAdminOpenApiClient(options),
    path,
    options,
  );
  if (!response) return adminFetch<TResponse>(path, options);
  return (await response) as TResponse;
}
