import { http, HttpResponse } from "msw";

import {
  categoryTreePage,
  rankedExposedCapabilities,
  smallCategoryTree,
} from "../../src/features/catalog/admin/categories/__tests__/category-tree.fixtures";

export const adminTestIdentity = {
  id: "admin_1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: [
    "admin:access",
    "admin:users:read",
    "admin:users:status",
    "admin:users:write",
    "admin:products:read",
    "admin:products:write",
    "admin:products:moderate",
    "admin:catalogue-categories:read",
    "admin:catalogue-categories:write",
  ],
  sessionScope: "admin",
};

export const catalogueReadWriteAdminIdentity = adminTestIdentity;

export const catalogueReadOnlyAdminIdentity = {
  id: "catalogue_reader_1",
  username: "catalogue-reader",
  roles: [],
  permissions: ["admin:access", "admin:catalogue-categories:read"],
  sessionScope: "admin",
};

export const adminRoleOnlyIdentity = {
  id: "role_admin_1",
  username: "role-admin",
  roles: ["ADMIN"],
  permissions: ["admin:access"],
  sessionScope: "admin",
};

const categoryParentOptionFixtures = [
  parentOption({ id: 1, label: "Laptops", name: "Laptops", slug: "laptops" }),
  parentOption({
    id: 4,
    label: "Gaming laptops",
    name: "Gaming laptops",
    parentId: 1,
    slug: "gaming-laptops",
  }),
  parentOption({
    id: 2,
    label: "Accessories",
    name: "Accessories",
    slug: "accessories",
  }),
  parentOption({ id: 3, label: "Cameras", name: "Cameras", slug: "cameras" }),
  parentOption({
    active: false,
    disabledReason: "INACTIVE",
    id: 5,
    label: "Archived Accessories",
    name: "Archived Accessories",
    selectable: false,
    slug: "archived-accessories",
  }),
  parentOption({
    id: 27,
    label: "Large catalog target",
    name: "Large catalog target",
    slug: "large-catalog-target",
  }),
];
const CATALOGUE_CATEGORY_API_PATH =
  "/api/v1/admin/category-systems/catalogue/categories";

export const adminHandlers = [
  http.get("*/api/v1/admin/auth/csrf", () =>
    HttpResponse.json({ token: "csrf-test", headerName: "x-csrf-token" }),
  ),
  http.post("*/api/v1/admin/auth/login", () =>
    HttpResponse.json({ authenticated: true }),
  ),
  http.post("*/api/v1/admin/auth/logout", () =>
    HttpResponse.json({ success: true }),
  ),
  http.get("*/api/v1/admin/auth/me", () =>
    HttpResponse.json(adminTestIdentity),
  ),
  http.get("*/api/v1/admin/users", () =>
    HttpResponse.json(
      pageResponse([
        {
          id: "user_1",
          username: "admin",
          email: "admin@example.test",
          firstName: "Admin",
          lastName: "User",
          active: true,
          accountNonExpired: true,
          accountNonLocked: true,
          credentialsNonExpired: true,
          roles: ["ADMIN"],
          permissions: ["admin:users:read"],
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        },
      ]),
    ),
  ),
  http.get("*/api/v1/admin/users/:id", ({ params }) =>
    HttpResponse.json({
      id: params.id,
      username: "admin",
      email: "admin@example.test",
      firstName: "Admin",
      lastName: "User",
      active: true,
      accountNonExpired: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      roles: ["ADMIN"],
      permissions: ["admin:users:read"],
      createdAt: "2026-05-29T12:00:00.000Z",
      updatedAt: "2026-05-30T12:00:00.000Z",
    }),
  ),
  http.get("*/api/v1/products", () =>
    HttpResponse.json(
      pageResponse([
        {
          id: "product_1",
          title: "ThinkPad X1 Carbon",
          slug: "thinkpad-x1-carbon",
          family: "STORAGE",
          brand: { id: "brand_lenovo", name: "Lenovo" },
          manufacturer: { id: "manufacturer_lenovo", name: "Lenovo" },
          mainImageUrl: null,
          shortDescription: "Business laptop.",
          identifiers: [{ family: "MPN", value: "X1-123", primary: true }],
          categories: [],
          active: true,
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        },
      ]),
    ),
  ),
  http.get("*/api/v1/products/:id", ({ params }) =>
    HttpResponse.json({
      id: params.id,
      title: "ThinkPad X1 Carbon",
      slug: "thinkpad-x1-carbon",
      family: "STORAGE",
      brand: { id: "brand_lenovo", name: "Lenovo" },
      manufacturer: { id: "manufacturer_lenovo", name: "Lenovo" },
      mainImageUrl: null,
      shortDescription: "Business laptop.",
      identifiers: [{ family: "MPN", value: "X1-123", primary: true }],
      categories: [],
      active: true,
      createdAt: "2026-05-29T12:00:00.000Z",
      updatedAt: "2026-05-30T12:00:00.000Z",
    }),
  ),
  http.get("*/api/v1/admin/category-systems/catalogue/categories", () =>
    HttpResponse.json(
      pageResponse([
        {
          id: "1",
          parentId: null,
          sortRank: 1,
          depth: 0,
          hasChildren: true,
          name: "Laptops",
          slug: "laptops",
          active: true,
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        },
      ]),
    ),
  ),
  http.get(
    "*/api/v1/admin/category-systems/catalogue/categories/capabilities",
    () => HttpResponse.json(rankedExposedCapabilities),
  ),
  http.get(
    "*/api/v1/admin/category-systems/catalogue/categories/:id/breadcrumb",
    () =>
      HttpResponse.json([
        {
          id: 1,
          parentId: null,
          sortRank: 1,
          depth: 0,
          name: "Laptops",
          slug: "laptops",
          active: true,
          createdAt: "2026-05-29T12:00:00.000Z",
          updatedAt: "2026-05-30T12:00:00.000Z",
        },
      ]),
  ),
  http.get(
    "*/api/v1/admin/category-systems/catalogue/categories/tree",
    ({ request }) =>
      handleCategoryTreeRequest(request, `${CATALOGUE_CATEGORY_API_PATH}/tree`),
  ),
  http.get(
    "*/api/v1/admin/category-systems/catalogue/categories/parent-options",
    ({ request }) =>
      handleCategoryParentOptionsRequest(
        request,
        `${CATALOGUE_CATEGORY_API_PATH}/parent-options`,
      ),
  ),
  http.get(
    "*/api/v1/admin/category-systems/catalogue/categories/:id",
    ({ params }) => HttpResponse.json(categoryDetail(params.id)),
  ),
  http.post(
    "*/api/v1/admin/category-systems/catalogue/categories",
    async ({ request }) =>
      handleCategoryWriteRequest(request, CATALOGUE_CATEGORY_API_PATH, "1"),
  ),
  http.put(
    "*/api/v1/admin/category-systems/catalogue/categories/:id",
    async ({ params, request }) =>
      handleCategoryWriteRequest(
        request,
        `${CATALOGUE_CATEGORY_API_PATH}/${String(params.id)}`,
        params.id,
      ),
  ),
  http.patch(
    "*/api/v1/admin/category-systems/catalogue/categories/:id",
    async ({ params, request }) => {
      const body = await request.json().catch(() => ({}));

      return HttpResponse.json({
        ...categoryDetail(params.id),
        ...(isRecord(body) ? body : {}),
      });
    },
  ),
  http.delete(
    "*/api/v1/admin/category-systems/catalogue/categories/:id",
    ({ params }) => HttpResponse.json({ id: params.id }),
  ),
  http.post(
    "*/api/v1/admin/category-systems/catalogue/categories/:id/move",
    async ({ params, request }) =>
      handleCategoryMoveRequest(
        request,
        `${CATALOGUE_CATEGORY_API_PATH}/${String(params.id)}/move`,
        params.id,
      ),
  ),
  http.post(
    "*/api/v1/admin/category-systems/catalogue/categories/:id/reorder",
    async ({ params, request }) => {
      const body = await request.json().catch(() => ({}));

      if (!isRecord(body)) {
        return springErrorResponse({
          fieldErrors: [{ field: "parentId", message: "Reorder payload is required." }],
          path: `${CATALOGUE_CATEGORY_API_PATH}/${String(params.id)}/reorder`,
        });
      }

      return HttpResponse.json({
        ...categoryDetail(params.id),
        parentId: body.parentId ?? null,
        sortRank: body.targetIndex ?? 10,
      });
    },
  ),
  http.post(
    "*/api/v1/admin/category-systems/catalogue/categories/:id/activate",
    ({ params }) =>
      HttpResponse.json({ ...categoryDetail(params.id), active: true }),
  ),
  http.post(
    "*/api/v1/admin/category-systems/catalogue/categories/:id/deactivate",
    ({ params }) =>
      HttpResponse.json({ ...categoryDetail(params.id), active: false }),
  ),
  http.post("*/api/v1/products", async ({ request }) => {
    const body = await request.json().catch(() => ({}));

    if (isRecord(body) && body.slug === "duplicate-product") {
      return springErrorResponse({
        code: "DUPLICATE_PRODUCT_SLUG",
        fieldErrors: [],
        message: "Product slug already exists.",
        path: "/api/v1/products",
        status: 409,
      });
    }

    if (isRecord(body) && body.slug === "invalid-product") {
      return springErrorResponse({
        fieldErrors: [{ field: "slug", message: "Use a valid product slug." }],
        path: "/api/v1/products",
      });
    }

    return HttpResponse.json({ id: "product_1" });
  }),
  http.put("*/api/v1/products/:id", async ({ params, request }) => {
    const body = await request.json().catch(() => ({}));

    if (isRecord(body) && body.slug === "duplicate-product") {
      return springErrorResponse({
        code: "DUPLICATE_PRODUCT_SLUG",
        fieldErrors: [],
        message: "Product slug already exists.",
        path: `/api/v1/products/${String(params.id)}`,
        status: 409,
      });
    }

    return HttpResponse.json({ id: params.id });
  }),
  http.post("*/api/v1/admin/users", async ({ request }) => {
    const body = await request.json().catch(() => ({}));

    if (
      !isRecord(body) ||
      typeof body.password !== "string" ||
      body.password.trim().length === 0
    ) {
      return springErrorResponse({
        fieldErrors: [{ field: "password", message: "Password is required." }],
        path: "/api/v1/admin/users",
      });
    }

    if (isRecord(body) && body.email === "duplicate@example.test") {
      return springErrorResponse({
        code: "USER_ALREADY_EXISTS",
        fieldErrors: [],
        message: "User already exists.",
        path: "/api/v1/admin/users",
        status: 409,
      });
    }

    if (isRecord(body) && body.email === "invalid@example") {
      return springErrorResponse({
        fieldErrors: [{ field: "email", message: "Email must be valid." }],
        path: "/api/v1/admin/users",
      });
    }

    return HttpResponse.json({ id: "user_1" });
  }),
  http.put("*/api/v1/admin/users/:id", async ({ params, request }) => {
    const body = await request.json().catch(() => ({}));

    if (isRecord(body) && body.email === "duplicate@example.test") {
      return springErrorResponse({
        code: "USER_ALREADY_EXISTS",
        fieldErrors: [],
        message: "User already exists.",
        path: `/api/v1/admin/users/${String(params.id)}`,
        status: 409,
      });
    }

    return HttpResponse.json({ id: params.id });
  }),
  http.patch("*/api/v1/admin/users/:id/status", async ({ params, request }) => {
    const body = await request.json().catch(() => ({}));

    if (!isRecord(body) || !("active" in body)) {
      return springErrorResponse({
        fieldErrors: [{ field: "active", message: "Status is required." }],
        path: `/api/v1/admin/users/${String(params.id)}/status`,
      });
    }

    return HttpResponse.json({ id: params.id, active: Boolean(body.active) });
  }),
  http.get("*/api/v1/admin/empty", () => HttpResponse.json(pageResponse([]))),
  http.get("*/api/v1/admin/error", () =>
    HttpResponse.json(
      { error: { code: "admin.test.error", message: "Safe test error" } },
      { status: 500 },
    ),
  ),
  http.get("*/api/v1/admin/forbidden", () =>
    HttpResponse.json(
      { error: { code: "admin.test.forbidden", message: "Forbidden" } },
      { status: 403 },
    ),
  ),
  http.put("*/api/v1/admin/conflict", () =>
    HttpResponse.json(
      { error: { code: "admin.test.conflict", message: "Conflict" } },
      { status: 409 },
    ),
  ),
];

function pageResponse<TItem>(data: TItem[]) {
  return {
    data,
    page: {
      number: 0,
      size: 20,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      numberOfElements: data.length,
      first: true,
      last: true,
    },
    sort: [],
    links: {
      self: "/api/v1/admin/test?page=0&size=20",
      next: null,
      previous: null,
    },
  };
}

function springErrorResponse({
  code = "VALIDATION_FAILED",
  fieldErrors,
  message = "Request validation failed",
  path,
  status = 400,
}: {
  code?: string;
  fieldErrors: Array<{ field: string; message: string }>;
  message?: string;
  path: string;
  status?: number;
}) {
  return HttpResponse.json(
    {
      code,
      fieldErrors,
      message,
      path,
      timestamp: "2026-06-04T00:00:00.000Z",
    },
    { status },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function handleCategoryTreeRequest(request: Request, path: string) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page");

  if (page != null && page !== "0") {
    return springErrorResponse({
      code: "VALIDATION_FAILED",
      fieldErrors: [{ field: "page", message: "Page must be 0." }],
      message: "page must be 0 for complete tree requests",
      path,
    });
  }

  if (url.searchParams.has("sort")) {
    return springErrorResponse({
      code: "INVALID_SORT_FIELD",
      fieldErrors: [{ field: "sort", message: "Sort is not supported." }],
      message: "Sort is not supported for complete tree requests.",
      path,
    });
  }

  if (url.searchParams.get("fixture") === "too-large") {
    return springErrorResponse({
      code: "CATEGORY_TREE_TOO_LARGE",
      fieldErrors: [],
      message:
        "The category tree is too large for the full-tree view. Use the paginated category list instead.",
      path,
      status: 409,
    });
  }

  return HttpResponse.json(categoryTreePage(smallCategoryTree));
}

function handleCategoryParentOptionsRequest(request: Request, path: string) {
  const url = new URL(request.url);
  const excludeSubtreeId = toPositiveInteger(
    url.searchParams.get("excludeSubtreeId"),
  );
  const selectedIds = getSelectedIds(url);
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const limit = Math.min(
    toPositiveInteger(url.searchParams.get("limit")) ?? 25,
    25,
  );
  const cursor = url.searchParams.get("cursor")?.trim() ?? "";
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (excludeSubtreeId === 404) {
    return springErrorResponse({
      code: "CATEGORY_NOT_FOUND",
      fieldErrors: [],
      message: "Category was not found.",
      path,
      status: 404,
    });
  }

  if (cursor && cursor !== "window-2") {
    return springErrorResponse({
      code: "CATEGORY_PARENT_OPTIONS_CURSOR_INVALID",
      fieldErrors: [],
      message: "Parent option cursor is no longer valid.",
      path,
      status: 409,
    });
  }

  const excludedIds = getExcludedParentOptionIds(excludeSubtreeId);
  const selectedOptions = categoryParentOptionFixtures.filter(
    (option) => selectedIds.includes(option.id) && !excludedIds.has(option.id),
  );
  const ordinaryOptions = categoryParentOptionFixtures.filter((option) => {
    if (excludedIds.has(option.id) || selectedIds.includes(option.id)) {
      return false;
    }

    if (!includeInactive && !option.active) {
      return false;
    }

    if (!q) {
      return true;
    }

    return (
      String(option.id) === q ||
      option.label.toLowerCase().includes(q) ||
      option.name.toLowerCase().includes(q) ||
      option.slug.toLowerCase().includes(q)
    );
  });
  const windowStart = cursor === "window-2" ? limit : 0;
  const windowedOptions = ordinaryOptions.slice(windowStart, windowStart + limit);
  const hasMore = ordinaryOptions.length > windowStart + limit;

  return HttpResponse.json({
    data: [...selectedOptions, ...windowedOptions],
    hasMore,
    nextCursor: hasMore ? "window-2" : null,
  });
}

async function handleCategoryWriteRequest(
  request: Request,
  path: string,
  id: unknown,
) {
  const body = await request.json().catch(() => ({}));

  if (isRecord(body) && body.slug === "duplicate-category") {
    return springErrorResponse({
      code: "DUPLICATE_CATEGORY_SLUG",
      fieldErrors: [],
      message: "Category slug already exists.",
      path,
      status: 409,
    });
  }

  if (isRecord(body) && body.slug === "invalid-category") {
    return springErrorResponse({
      fieldErrors: [{ field: "slug", message: "Use a valid category slug." }],
      path,
    });
  }

  return HttpResponse.json(categoryDetail(id, isRecord(body) ? body : {}));
}

async function handleCategoryMoveRequest(
  request: Request,
  path: string,
  id: unknown,
) {
  const body = await request.json().catch(() => ({}));

  if (!isRecord(body) || !("newParentId" in body)) {
    return springErrorResponse({
      fieldErrors: [
        { field: "newParentId", message: "Choose a valid parent category." },
      ],
      path,
    });
  }

  if (body.newParentId === 999) {
    return springErrorResponse({
      code: "INVALID_CATEGORY_PLACEMENT_TARGET",
      fieldErrors: [],
      message: "The selected placement target is no longer valid.",
      path,
      status: 409,
    });
  }

  return HttpResponse.json({
    id: toPositiveInteger(String(id)) ?? String(id),
    newParentId: body.newParentId,
  });
}

function categoryDetail(id: unknown, overrides: Record<string, unknown> = {}) {
  return {
    id: String(id),
    parentId: null,
    sortRank: 1,
    name: "Laptops",
    slug: "laptops",
    active: true,
    createdAt: "2026-05-29T12:00:00.000Z",
    updatedAt: "2026-05-30T12:00:00.000Z",
    ...overrides,
  };
}

function getExcludedParentOptionIds(excludeSubtreeId: number | null): Set<number> {
  if (excludeSubtreeId == null) {
    return new Set();
  }

  const excludedIds = new Set([excludeSubtreeId]);
  let added = true;

  while (added) {
    added = false;

    for (const option of categoryParentOptionFixtures) {
      if (
        option.parentId != null &&
        excludedIds.has(option.parentId) &&
        !excludedIds.has(option.id)
      ) {
        excludedIds.add(option.id);
        added = true;
      }
    }
  }

  return excludedIds;
}

function parentOption(overrides: {
  active?: boolean;
  disabledReason?: string | null;
  id: number;
  label: string;
  name: string;
  parentId?: number | null;
  selectable?: boolean;
  slug: string;
}) {
  return {
    active: overrides.active ?? true,
    depth: 0,
    disabledReason: overrides.disabledReason ?? null,
    id: overrides.id,
    label: overrides.label,
    name: overrides.name,
    parentId: overrides.parentId ?? null,
    path: [],
    selectable: overrides.selectable ?? true,
    slug: overrides.slug,
  };
}

function getSelectedIds(url: URL): number[] {
  return [
    ...url.searchParams.getAll("includeIds"),
    ...url.searchParams.getAll("includeIds[]"),
  ]
    .flatMap((value) => value.split(","))
    .map(toPositiveInteger)
    .filter((value): value is number => value != null);
}

function toPositiveInteger(value: string | null): number | null {
  const numericValue = Number(value);

  return Number.isSafeInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
}
