import { describe, expect, it, vi } from "vitest";

import { adminSpringDataProvider } from "./adminSpringDataProvider";
import { clearAdminCsrfCache } from "../admin/adminFetch";

const baseUrl = "https://spring.test";
const resources = [
  {
    name: "productCategories",
    apiPath: "/api/v1/admin/category-systems/catalogue/categories" as const,
  },
  { name: "users", apiPath: "/api/v1/admin/users" as const },
];

describe("adminSpringDataProvider", () => {
  it("maps Refine pagination and sorters to Spring page, size, and sort query params", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: [{ id: "category_1", name: "Keyboards" }],
        page: springPage({ number: 1, size: 20, totalElements: 1 }),
        sort: [{ property: "name", direction: "ASC" }],
        links: {
          self: "/api/v1/admin/category-systems/catalogue/categories?page=1",
          next: null,
          previous:
            "/api/v1/admin/category-systems/catalogue/categories?page=0",
        },
      }),
    ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    const result = await provider.getList({
      resource: "productCategories",
      pagination: { currentPage: 2, pageSize: 20 },
      sorters: [
        { field: "name", order: "asc" },
        { field: "updatedAt", order: "desc" },
      ],
    });

    const url = vi.mocked(fetcher).mock.calls[0]?.[0] as URL;
    expect(url.pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories",
    );
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("size")).toBe("20");
    expect(url.searchParams.getAll("sort")).toEqual([
      "name,asc",
      "updatedAt,desc",
    ]);
    expect(result.total).toBe(1);
    expect(result.links?.previous).toBe(
      "/api/v1/admin/category-systems/catalogue/categories?page=0",
    );
  });

  it("rejects page sizes above the configured maximum before fetching", async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await expect(
      provider.getList({
        resource: "productCategories",
        pagination: { currentPage: 1, pageSize: 101 },
      }),
    ).rejects.toMatchObject({
      code: "api_client.admin.page_size_exceeded",
    });

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps out-of-range Spring page metadata stable in the result", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: [],
        page: springPage({ number: 99, size: 20, totalPages: 3 }),
        sort: [],
        links: {
          self: "/api/v1/admin/category-systems/catalogue/categories?page=99",
          next: null,
          previous: null,
        },
      }),
    ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    const result = await provider.getList({ resource: "productCategories" });

    expect(result.data).toEqual([]);
    expect(result.page?.number).toBe(99);
    expect(result.page?.totalPages).toBe(3);
  });

  it("maps supported filters to Spring query params", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: [],
        page: springPage(),
        sort: [],
      }),
    ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.getList({
      resource: "users",
      filters: [
        { field: "q", operator: "contains", value: "admin" },
        { field: "active", operator: "eq", value: true },
        { field: "roles", operator: "eq", value: ["ADMIN", "MODERATOR"] },
      ],
    });

    const url = vi.mocked(fetcher).mock.calls[0]?.[0] as URL;
    expect(url.pathname).toBe("/api/v1/admin/users");
    expect(url.searchParams.get("q")).toBe("admin");
    expect(url.searchParams.get("active")).toBe("true");
    expect(url.searchParams.getAll("roles")).toEqual(["ADMIN", "MODERATOR"]);
  });

  it("serializes category parent filters and omits blank/null filters", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: [],
        page: springPage(),
        sort: [],
      }),
    ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.getList({
      resource: "productCategories",
      filters: [
        { field: "parentId", operator: "eq", value: 0 },
        { field: "q", operator: "contains", value: "" },
        { field: "slug", operator: "eq", value: null },
        { field: "active", operator: "eq", value: true },
      ],
    });

    const url = vi.mocked(fetcher).mock.calls[0]?.[0] as URL;
    expect(url.searchParams.get("parentId")).toBe("0");
    expect(url.searchParams.has("q")).toBe(false);
    expect(url.searchParams.has("slug")).toBe(false);
    expect(url.searchParams.get("active")).toBe("true");
    expect(url.searchParams.get("parentId")).not.toBe("null");
  });

  it("preserves repeated Spring sort params for ranked category requests", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        data: [],
        page: springPage(),
        sort: [],
      }),
    ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.getList({
      resource: "productCategories",
      sorters: [
        { field: "sortRank", order: "asc" },
        { field: "id", order: "asc" },
      ],
    });

    const url = vi.mocked(fetcher).mock.calls[0]?.[0] as URL;
    expect(url.searchParams.getAll("sort")).toEqual(["sortRank,asc", "id,asc"]);
  });

  it("rejects unsupported filter groups", async () => {
    const fetcher = vi.fn() as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await expect(
      provider.getList({
        resource: "productCategories",
        filters: [
          {
            operator: "or",
            value: [{ field: "name", operator: "contains", value: "keyboard" }],
          },
        ],
      }),
    ).rejects.toMatchObject({
      code: "api_client.admin.unsupported_filter",
    });

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("maps getOne, create, update, deleteOne, and custom paths through adminFetch", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "category_1" }))
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "category_2" }))
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: "category_2", name: "Updated" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "category_2" }))
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: "user_2", result: "locked" }),
      ) as unknown as typeof fetch;

    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.getOne({ resource: "productCategories", id: "category_1" });
    await provider.create({
      resource: "productCategories",
      variables: { name: "New" },
    });
    await provider.update({
      resource: "productCategories",
      id: "category_2",
      variables: { name: "Updated" },
    });
    await provider.deleteOne({
      resource: "productCategories",
      id: "category_2",
    });
    await provider.custom({
      url: "/api/v1/admin/users/user_2/lock",
      method: "post",
      payload: { reason: "ready" },
    });

    expect((vi.mocked(fetcher).mock.calls[0]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories/category_1",
    );
    expect((vi.mocked(fetcher).mock.calls[2]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories",
    );
    expect((vi.mocked(fetcher).mock.calls[4]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories/category_2",
    );
    expect((vi.mocked(fetcher).mock.calls[6]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories/category_2",
    );
    expect((vi.mocked(fetcher).mock.calls[8]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/users/user_2/lock",
    );
  });

  it("routes category and admin-user mutations to backend-aligned paths", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "ok" }))
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "ok" }))
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: "ok" }),
      ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.create({
      resource: "productCategories",
      variables: { name: "Category" },
    });
    await provider.update({
      id: "category_1",
      resource: "productCategories",
      variables: { name: "Category" },
    });
    await provider.create({
      resource: "users",
      variables: { username: "admin" },
    });

    expect((vi.mocked(fetcher).mock.calls[1]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories",
    );
    expect((vi.mocked(fetcher).mock.calls[3]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories/category_1",
    );
    expect((vi.mocked(fetcher).mock.calls[5]?.[0] as URL).pathname).toBe(
      "/api/v1/admin/users",
    );
  });

  it("preserves repeated custom query params for centralized option adapters", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({ data: [] }),
    ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.custom({
      method: "get",
      query: {
        q: "len",
        sort: ["name,asc", "id,asc"],
      },
      url: "/api/v1/admin/category-systems/catalogue/categories",
    });

    const url = vi.mocked(fetcher).mock.calls[0]?.[0] as URL;
    expect(url.searchParams.get("q")).toBe("len");
    expect(url.searchParams.getAll("sort")).toEqual(["name,asc", "id,asc"]);
  });

  it("forwards a custom-request abort signal to adminFetch", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async () =>
      jsonResponse({ data: [] }),
    ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.custom({
      method: "get",
      meta: { signal: controller.signal },
      url: "/api/v1/admin/category-systems/catalogue/categories/capabilities",
    });

    expect(vi.mocked(fetcher).mock.calls[0]?.[1]).toMatchObject({
      signal: controller.signal,
    });
  });

  it("supports typed catalogue category reorder boundary requests without visible reorder UI assumptions", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 2,
          parentId: null,
          sortRank: 10,
          name: "Laptops",
          slug: "laptops",
          active: true,
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        }),
      ) as unknown as typeof fetch;
    const provider = adminSpringDataProvider({ baseUrl, fetcher, resources });

    await provider.custom({
      method: "post",
      payload: {
        parentId: null,
        beforeId: null,
        afterId: 4,
        targetIndex: null,
      },
      url: "/api/v1/admin/category-systems/catalogue/categories/2/reorder",
    });

    const request = vi.mocked(fetcher).mock.calls[1];
    const url = request?.[0] as URL;
    const init = request?.[1] as RequestInit;

    expect(url.pathname).toBe(
      "/api/v1/admin/category-systems/catalogue/categories/2/reorder",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      parentId: null,
      beforeId: null,
      afterId: 4,
      targetIndex: null,
    });
  });
});

function springPage(overrides: Partial<SpringPage> = {}): SpringPage {
  return {
    number: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    first: true,
    last: true,
    ...overrides,
  };
}

interface SpringPage {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

it.each([
  "getList",
  "getOne",
  "create",
  "update",
  "deleteOne",
  "custom",
] as const)(
  "forwards meta.signal through %s including CSRF",
  async (operation) => {
    clearAdminCsrfCache();
    const controller = new AbortController();
    const seen: (AbortSignal | null | undefined)[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      seen.push(init?.signal);
      return String(url).endsWith("/csrf")
        ? jsonResponse({ token: "fresh", headerName: "X-CSRF-TOKEN" })
        : jsonResponse({ id: 1, data: [], page: { totalElements: 0 } });
    };
    const provider = adminSpringDataProvider({ baseUrl, resources, fetcher });
    const params = {
      resource: "users",
      id: 1,
      variables: {},
      meta: { signal: controller.signal },
    };
    if (operation === "custom")
      await provider.custom({
        url: "/api/v1/admin/users",
        method: "get",
        meta: params.meta,
      });
    else if (operation === "getList") await provider.getList(params);
    else if (operation === "getOne") await provider.getOne(params);
    else if (operation === "create") await provider.create(params);
    else if (operation === "update") await provider.update(params);
    else await provider.deleteOne(params);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((signal) => signal === controller.signal)).toBe(true);
  },
);
