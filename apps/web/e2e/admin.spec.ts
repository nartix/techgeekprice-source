import {
  expect,
  test,
  type Locator,
  type Page,
  type Route,
} from "@playwright/test";

type AdminIdentity = {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  sessionScope: string;
};

const adminIdentity: AdminIdentity = {
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

const moderatorIdentity: AdminIdentity = {
  id: "moderator_1",
  username: "moderator",
  roles: ["MODERATOR"],
  permissions: [
    "admin:access",
    "admin:products:read",
    "admin:products:moderate",
  ],
  sessionScope: "admin",
};

const catalogueReadOnlyIdentity: AdminIdentity = {
  id: "catalogue_reader_1",
  username: "catalogue-reader",
  roles: [],
  permissions: ["admin:access", "admin:catalogue-categories:read"],
  sessionScope: "admin",
};

const adminRoleOnlyIdentity: AdminIdentity = {
  id: "role_admin_1",
  username: "role-admin",
  roles: ["ADMIN"],
  permissions: ["admin:access"],
  sessionScope: "admin",
};

const categoryFixture = {
  id: 1,
  parentId: null,
  sortRank: 1,
  depth: 0,
  hasChildren: true,
  name: "Laptops",
  slug: "laptops",
  active: true,
  createdAt: "2026-05-29T12:00:00.000Z",
  updatedAt: "2026-05-30T12:00:00.000Z",
};

const categoryTreeFixtures = [
  categoryFixture,
  {
    ...categoryFixture,
    id: 2,
    parentId: null,
    sortRank: 2,
    depth: 0,
    hasChildren: false,
    name: "Accessories",
    slug: "accessories",
  },
  {
    ...categoryFixture,
    id: 7,
    parentId: 1,
    sortRank: 1,
    depth: 1,
    hasChildren: false,
    name: "Gaming laptops",
    slug: "gaming-laptops",
  },
];

const categoryEditFixture = {
  id: 1,
  parentId: null,
  sortRank: 1,
  depth: 0,
  hasChildren: true,
  name: "Laptops",
  slug: "laptops",
  active: true,
  createdAt: "2026-05-29T12:00:00.000Z",
  updatedAt: "2026-05-30T12:00:00.000Z",
};

const categoryEditWithParentFixture = {
  id: 4,
  parentId: 2,
  sortRank: 3,
  depth: 1,
  hasChildren: false,
  name: "Mirrorless Cameras",
  slug: "mirrorless-cameras",
  active: true,
  createdAt: "2026-05-29T12:00:00.000Z",
  updatedAt: "2026-05-30T12:00:00.000Z",
};

const categoryEditWithInactiveParentFixture = {
  id: 6,
  parentId: 5,
  sortRank: 4,
  depth: 1,
  hasChildren: false,
  name: "Tripods",
  slug: "tripods",
  active: true,
  createdAt: "2026-05-29T12:00:00.000Z",
  updatedAt: "2026-05-30T12:00:00.000Z",
};

const categoryParentOptionFixtures = [
  {
    active: true,
    depth: 0,
    disabledReason: null,
    id: 2,
    label: "Accessories (accessories)",
    name: "Accessories",
    parentId: null,
    path: [],
    selectable: true,
    slug: "accessories",
  },
  {
    active: true,
    depth: 0,
    disabledReason: null,
    id: 3,
    label: "Cameras (cameras)",
    name: "Cameras",
    parentId: null,
    path: [],
    selectable: true,
    slug: "cameras",
  },
  {
    active: false,
    depth: 0,
    disabledReason: "INACTIVE",
    id: 5,
    label: "Archived Accessories (archived-accessories)",
    name: "Archived Accessories",
    parentId: null,
    path: [],
    selectable: false,
    slug: "archived-accessories",
  },
  {
    active: true,
    depth: 0,
    disabledReason: null,
    id: 27,
    label: "Large catalog target (large-catalog-target)",
    name: "Large catalog target",
    parentId: null,
    path: [],
    selectable: true,
    slug: "large-catalog-target",
  },
];

const parentCategoryOptionName = {
  accessories: /accessories \(accessories\)/i,
  cameras: /cameras \(cameras\)/i,
};

const userFixture = {
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
};

test("renders public login separately from the protected shell", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/en-CA/admin/login");

  await expect(
    page.getByRole("heading", { name: /admin sign in/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /sign out/i })).toHaveCount(0);

  const loginShell = page.locator("main");
  const shellBox = await loginShell.boundingBox();
  const usernameBox = await page
    .getByRole("textbox", { name: /username or email/i })
    .boundingBox();
  const viewport = page.viewportSize();

  if (!shellBox || !usernameBox || !viewport) {
    throw new Error("Unable to measure the admin login shell.");
  }

  expect(shellBox.x + shellBox.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(usernameBox.x).toBeGreaterThanOrEqual(24);
  expect(viewport.width - usernameBox.x - usernameBox.width).toBeGreaterThanOrEqual(
    24,
  );
});

test("admin sign-in stays disabled before hydration and uses POST for native submission", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  try {
    const page = await context.newPage();
    await page.goto("/en-CA/admin/login");
    await expect(page.locator("form")).toHaveAttribute("method", "post");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeDisabled();
  } finally {
    await context.close();
  }
});

test("keeps the login form and copyright in view on short laptops", async ({
  page,
}) => {
  await page.goto("/en-CA/admin/login");
  test.skip(
    await page.getByRole("button", { name: "Use demo account" }).isVisible(),
    "The optional portfolio demo panel can extend the form on short viewports.",
  );
  await page.evaluate(() => document.fonts.ready);
  for (const viewport of [
    { width: 1366, height: 650 },
    { width: 1280, height: 600 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator("form")).toBeInViewport({ ratio: 1 });
    await expect(page.locator("footer")).toBeInViewport({ ratio: 1 });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(height).toBe(viewport.height);
  }
});

test("admin can log in, reach dashboard, and log out under two minutes", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });
  const startedAt = Date.now();

  await page.goto("/en-CA/admin/login");
  await page.getByRole("textbox", { name: /username or email/i }).fill("admin");
  await page.getByLabel(/^password/i).fill("secret");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/en-CA\/admin$/);
  await expect(
    page.getByRole("heading", { name: /^overview$/i }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /open account menu for admin/i })
    .click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/en-CA\/admin\/login$/);
  expect(Date.now() - startedAt).toBeLessThan(120_000);
});

test("dashboard cards open the localized resource without fetching listings in advance", async ({ page }) => {
  const categoryListRequests: URL[] = [];
  await mockAdminApi(page, {
    identity: catalogueReadOnlyIdentity,
    onCategoryListRequest: (url) => categoryListRequests.push(url),
  });
  await page.goto("/fr-CA/admin");
  const main = page.getByRole("main");
  const category = main.getByRole("link", { name: "Catégories de produits" });
  await expect(main.getByRole("link")).toHaveCount(1);
  await expect(category).toHaveAccessibleDescription("Classez les produits par catégorie.");
  expect(categoryListRequests).toHaveLength(0);
  await category.press("Enter");
  await expect(page).toHaveURL(/\/fr-CA\/admin\/products\/categories$/);
  await expect.poll(() => categoryListRequests.length).toBeGreaterThan(0);
});

test("mobile Escape dismisses the account menu before closing navigation", async ({ page }) => {
  await mockAdminApi(page, { identity: adminIdentity });
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto("/en-CA/admin");

  const open = page.getByRole("button", { name: "Open navigation" });
  await open.press("Enter");
  const account = page.getByRole("button", { name: /open account menu for admin/i });
  await account.press("Enter");
  const signOut = page.getByRole("menuitem", { name: "Sign out" });
  await expect(signOut).toBeFocused();
  await signOut.press("Escape");
  await expect(account).toBeFocused();
  await account.press("Escape");
  await expect(open).toBeFocused();
  await expect(open).toHaveAttribute("aria-expanded", "false");
  const sidebar = page.locator(".mantine-AppShell-navbar");
  await expect(sidebar).toHaveJSProperty("inert", true);
  await expect(sidebar).not.toBeInViewport();
});

test("desktop resource navigation clears an open mobile drawer", async ({ page }) => {
  await mockAdminApi(page, { identity: adminIdentity });
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto("/en-CA/admin");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.setViewportSize({ width: 820, height: 900 });
  await page.getByRole("navigation").getByRole("link", { name: "Users", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await page.setViewportSize({ width: 390, height: 650 });
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("main")).toHaveJSProperty("inert", false);
});

test("moderator login succeeds with limited navigation", async ({ page }) => {
  await mockAdminApi(page, { identity: moderatorIdentity });

  await page.goto("/en-CA/admin/login");
  await page
    .getByRole("textbox", { name: /username or email/i })
    .fill("moderator");
  await page.getByLabel(/^password/i).fill("secret");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/en-CA\/admin$/);
  await expect(
    page.getByRole("heading", { name: /^overview$/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /categories/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /users/i })).toHaveCount(0);
});

test("invalid login shows a safe error and keeps the user on login", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity, invalidLogin: true });

  await page.goto("/en-CA/admin/login");
  await page.getByRole("textbox", { name: /username or email/i }).fill("admin");
  await page.getByLabel(/^password/i).fill("bad-password");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/en-CA\/admin\/login$/);
  await expect(page.getByText(/we could not sign you in/i)).toBeVisible();
});

test("auth redirects preserve non-default locale", async ({ page }) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/fr-CA/admin/login");
  await page
    .getByRole("textbox", { name: /nom d'utilisateur ou courriel/i })
    .fill("admin");
  await page.getByLabel(/^mot de passe/i).fill("secret");
  await page.getByRole("button", { name: /se connecter/i }).click();

  await expect(page).toHaveURL(/\/fr-CA\/admin$/);
});

test("unauthenticated protected routes redirect to localized login", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: null });

  for (const path of protectedAdminPaths) {
    await page.goto(`/en-CA${path}`);
    await expect(page).toHaveURL(/\/en-CA\/admin\/login$/);
  }
});

test("direct forbidden user route shows safe denial for product moderator", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: moderatorIdentity });

  await page.goto("/en-CA/admin/users");

  await expect(page.getByText(/access denied/i)).toBeVisible();
});

test("generated admin detail routes support direct URLs, list navigation, locale paths, and unsupported locales", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/users/user_1");
  await expect(page.getByRole("heading", { name: /^admin$/i })).toBeVisible();
  await expect(page.getByText("admin@example.test")).toBeVisible();

  await page.goto("/en-CA/admin/users");
  await page.getByRole("link", { name: /view details/i }).first().click();
  await expect(page).toHaveURL(/\/en-CA\/admin\/users\/user_1$/);
  await expect(
    page.getByRole("main").getByText("ADMIN", { exact: true }),
  ).toBeVisible();

  await page.goto("/fr-CA/admin/products/categories/1");
  await expect(page.getByRole("heading", { name: /^Laptops$/i })).toBeVisible();
  await expect(page.getByText("laptops", { exact: true }).first()).toBeVisible();

  await page.goto("/en-CA/admin/products/categories");
  await openFirstRowActionMenu(page);
  await page.getByRole("menuitem", { name: /view details/i }).click();
  await expect(page).toHaveURL(/\/en-CA\/admin\/products\/categories\/1$/);
  await expect(page.getByRole("heading", { name: /^Laptops$/i })).toBeVisible();

  const unsupportedLocaleResponse = await page.goto("/zz/admin/users/user_1");
  expect(unsupportedLocaleResponse?.status()).toBe(404);
});

test("generated admin detail routes redirect unauthenticated visitors to localized login", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: null });

  await page.goto("/fr-CA/admin/products/categories/cat_1");

  await expect(page).toHaveURL(/\/fr-CA\/admin\/login$/);
});

test("admin routes render across key viewport widths and color schemes", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await mockAdminApi(page, { identity: adminIdentity });

  for (const colorScheme of ["light", "dark", "no-preference"] as const) {
    await page.emulateMedia({ colorScheme });

    for (const viewport of [
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);

      await page.goto("/en-CA/admin/login");
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

      await page.goto("/en-CA/admin");
      await expect(
        page.getByRole("heading", { name: /^overview$/i }),
      ).toBeVisible();

      await page.goto("/en-CA/admin/products/categories");
      await expect(
        page.getByRole("heading", { name: /^product categories$/i }),
      ).toBeVisible();

      await page.goto("/en-CA/admin/users");
      await expect(page.getByRole("heading", { name: /^users$/i })).toBeVisible();
    }
  }
});

test("category lazy listing scopes serialize safe requests", async ({ page }) => {
  const categoryListRequests: URL[] = [];

  await mockAdminApi(page, {
    identity: adminIdentity,
    onCategoryListRequest: (url) => categoryListRequests.push(url),
  });

  await page.goto("/en-CA/admin/products/categories");
  await expect(
    page.getByRole("heading", { name: /^product categories$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Laptops", exact: true }),
  ).toBeVisible();
  expect(categoryListRequests.at(-1)?.searchParams.has("parentId")).toBe(false);
  expect(categoryListRequests.at(-1)?.searchParams.getAll("sort")).toEqual([
    "updatedAt,desc",
  ]);
  await expect(page.getByText(/category hierarchy/i)).toHaveCount(0);
  await expect(page.getByText(/1 \/ Laptops/i)).toHaveCount(0);

  await page.getByRole("link", { name: /^root categories$/i }).click();
  await expect(page).toHaveURL(
    /\/en-CA\/admin\/products\/categories\?parentId=0$/,
  );
  await expect.poll(() => categoryListRequests.at(-1)?.searchParams.get("parentId"))
    .toBe("0");
  expect(categoryListRequests.at(-1)?.searchParams.getAll("sort")).toEqual([
    "sortRank,asc",
    "id,asc",
  ]);

  await page.getByRole("link", { name: /view children for laptops/i }).click();
  await expect(page).toHaveURL(
    /\/en-CA\/admin\/products\/categories\?parentId=1$/,
  );
  await expect
    .poll(() => categoryListRequests.at(-1)?.searchParams.get("parentId"))
    .toBe("1");
});

test("deactivating a category refreshes the active-only list", async ({ page }) => {
  let active = true;
  let activeOnly = false;
  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryListItems: () =>
      activeOnly && !active ? [] : [{ ...categoryFixture, active }],
    onCategoryListRequest: (url) => {
      activeOnly = url.searchParams.get("active") === "true";
    },
    onCategoryMutation: (body) => {
      if (typeof body.active === "boolean") active = body.active;
    },
  });

  await page.goto("/en-CA/admin/products/categories");
  const category = page.getByRole("cell", { name: "Laptops", exact: true });
  await expect(category).toBeVisible();
  await page.getByRole("combobox", { name: "Status" }).click();
  await page.getByRole("option", { name: "Active", exact: true }).click();
  await expect.poll(() => activeOnly).toBe(true);
  await openFirstRowActionMenu(page);
  await page.getByRole("menuitem", { name: "Deactivate", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(category).toHaveCount(0, { timeout: 5000 });

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(category).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Inactive", exact: true }),
  ).toBeVisible();
});

test("product category generic listing uses catalogue navigation, filters, pagination, and child scopes", async ({
  page,
}) => {
  const categoryListRequests: URL[] = [];

  await mockAdminApi(page, {
    identity: adminIdentity,
    onCategoryListRequest: (url) => categoryListRequests.push(url),
  });

  await page.goto("/en-CA/admin/products/categories");
  await expect(page.getByText("Products")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /^product categories$/i }),
  ).toHaveAttribute("data-active");
  await expect(
    page.getByRole("heading", { name: /^product categories$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Laptops", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => categoryListRequests.at(-1)?.pathname)
    .toBe("/api/v1/admin/category-systems/catalogue/categories");
  expect(categoryListRequests.at(-1)?.searchParams.getAll("sort")).toEqual([
    "updatedAt,desc",
  ]);

  await page.getByRole("textbox", { name: /^search$/i }).fill("lap");
  await expect
    .poll(() => categoryListRequests.at(-1)?.searchParams.get("q"))
    .toBe("lap");
  await page.getByRole("combobox", { name: /rows per page/i }).click();
  await page.getByRole("option", { name: "50" }).click();
  await expect
    .poll(() => categoryListRequests.at(-1)?.searchParams.get("size"))
    .toBe("50");

  await page.getByRole("button", { name: /clear filters/i }).click();
  await page.getByRole("link", { name: /^root categories$/i }).click();
  await expect(page).toHaveURL(
    /\/en-CA\/admin\/products\/categories\?parentId=0$/,
  );
  await expect
    .poll(() => categoryListRequests.at(-1)?.searchParams.get("parentId"))
    .toBe("0");
  expect(categoryListRequests.at(-1)?.searchParams.getAll("sort")).toEqual([
    "sortRank,asc",
    "id,asc",
  ]);

  await page.getByRole("link", { name: /view children for laptops/i }).click();
  await expect(page).toHaveURL(
    /\/en-CA\/admin\/products\/categories\?parentId=1$/,
  );
  await expect
    .poll(() => categoryListRequests.at(-1)?.searchParams.get("parentId"))
    .toBe("1");
});

test("product category workflows use catalogue routes without legacy category calls", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const categoryMutationBodies: Array<Record<string, unknown>> = [];
  const cataloguePath = "/api/v1/admin/category-systems/catalogue/categories";
  const catalogueRequests: Array<{ method: string; pathname: string }> = [];
  const legacyRequests: Array<{ method: string; pathname: string }> = [];

  page.on("request", (request) => {
    const { pathname } = new URL(request.url());
    const trace = { method: request.method(), pathname };

    if (pathname.startsWith(cataloguePath)) {
      catalogueRequests.push(trace);
    }

    if (pathname.startsWith(["/api/v1/admin", "categories"].join("/"))) {
      legacyRequests.push(trace);
    }
  });

  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryMutationBodies,
  });

  await page.goto("/en-CA/admin/products/categories/tree");
  await expect(
    page.getByRole("heading", { name: /^category tree$/i }),
  ).toBeVisible();
  await expect(page.getByText("Gaming laptops")).toBeVisible();
  await expect
    .poll(() => hasTracedRequest(catalogueRequests, "GET", `${cataloguePath}/tree`))
    .toBe(true);

  await page.goto("/en-CA/admin/products/categories/1");
  await expect(page.getByRole("heading", { name: /^Laptops$/i })).toBeVisible();
  await expect
    .poll(() => hasTracedRequest(catalogueRequests, "GET", `${cataloguePath}/1`))
    .toBe(true);

  await page.goto("/en-CA/admin/products/categories/create");
  await expect(page.getByRole("heading", { name: /create category/i })).toBeVisible();
  await page.getByRole("textbox", { name: /^name/i }).fill("Headphones");
  await page.getByRole("button", { name: /create category/i }).click();
  await expect(page.getByText(/the category was created/i)).toBeVisible();
  await expect
    .poll(() => hasTracedRequest(catalogueRequests, "POST", cataloguePath))
    .toBe(true);

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();
  await page.getByRole("textbox", { name: /^name/i }).fill("Laptop PCs");
  await page.getByRole("button", { name: /save category/i }).click();
  await expect(page.getByText(/the category was updated/i)).toBeVisible();
  await expect
    .poll(() => hasTracedRequest(catalogueRequests, "PATCH", `${cataloguePath}/1`))
    .toBe(true);

  await page.goto("/en-CA/admin/products/categories");
  await expect(
    page.getByRole("heading", { name: /^product categories$/i }),
  ).toBeVisible();

  await openFirstRowActionMenu(page);
  await page.getByRole("menuitem", { name: /deactivate/i }).click();
  await page.getByRole("button", { name: /confirm/i }).click();
  await expect
    .poll(() =>
      hasTracedRequest(catalogueRequests, "POST", `${cataloguePath}/1/deactivate`),
    )
    .toBe(true);

  await openFirstRowActionMenu(page);
  await page.getByRole("menuitem", { name: /^move$/i }).click();
  await getMoveParentCategorySelect(page).click();
  await page
    .getByRole("option", { name: parentCategoryOptionName.accessories })
    .click();
  await page.getByRole("button", { name: /^move category$/i }).click();
  await expect
    .poll(() => hasTracedRequest(catalogueRequests, "POST", `${cataloguePath}/1/move`))
    .toBe(true);
  expect(
    categoryMutationBodies.some(
      (body) =>
        body.newParentId === 2 &&
        Object.keys(body).every((key) => key === "newParentId"),
    ),
  ).toBe(true);

  await openFirstRowActionMenu(page);
  await page.getByRole("menuitem", { name: /^delete$/i }).click();
  await page.getByRole("button", { name: /confirm/i }).click();
  await expect
    .poll(() => hasTracedRequest(catalogueRequests, "DELETE", `${cataloguePath}/1`))
    .toBe(true);

  expect(legacyRequests).toEqual([]);
});

test("product category strict permissions deny admin-role-only direct routes before catalogue reads", async ({
  page,
}) => {
  const cataloguePath = "/api/v1/admin/category-systems/catalogue/categories";
  const catalogueRequests: Array<{ method: string; pathname: string }> = [];

  page.on("request", (request) => {
    const { pathname } = new URL(request.url());

    if (pathname.startsWith(cataloguePath)) {
      catalogueRequests.push({ method: request.method(), pathname });
    }
  });

  await mockAdminApi(page, { identity: adminRoleOnlyIdentity });

  for (const path of [
    "/en-CA/admin/products/categories",
    "/en-CA/admin/products/categories/tree",
    "/en-CA/admin/products/categories/1",
  ]) {
    await page.goto(path);
    await expect(page.getByText(/access denied/i)).toBeVisible();
    await expect(
      page.getByText(/permission to use this admin workflow/i),
    ).toBeVisible();
  }

  await expect(
    page.getByRole("link", { name: /^product categories$/i }),
  ).toHaveCount(0);
  expect(catalogueRequests).toEqual([]);
});

test("product category read-only permissions allow reads and hide mutating entry points", async ({
  page,
}) => {
  const cataloguePath = "/api/v1/admin/category-systems/catalogue/categories";
  const catalogueRequests: Array<{ method: string; pathname: string }> = [];

  page.on("request", (request) => {
    const { pathname } = new URL(request.url());

    if (pathname.startsWith(cataloguePath)) {
      catalogueRequests.push({ method: request.method(), pathname });
    }
  });

  await mockAdminApi(page, { identity: catalogueReadOnlyIdentity });

  await page.goto("/en-CA/admin/products/categories");
  await expect(
    page.getByRole("link", { name: /^product categories$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Laptops", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create category/i }),
  ).toHaveCount(0);

  await openFirstRowActionMenu(page);
  await expect(
    page.getByRole("menuitem", { name: /view details/i }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /^edit$/i })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: /^move$/i })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: /deactivate/i })).toHaveCount(
    0,
  );
  await expect(page.getByRole("menuitem", { name: /^delete$/i })).toHaveCount(0);

  await page.goto("/en-CA/admin/products/categories/1");
  await expect(page.getByRole("heading", { name: /^Laptops$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^edit$/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^move$/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /deactivate/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^delete$/i })).toHaveCount(0);

  await page.goto("/en-CA/admin/products/categories/tree");
  await expect(
    page.getByRole("heading", { name: /^category tree$/i }),
  ).toBeVisible();
  await page
    .getByRole("row", { name: /laptops/i })
    .getByRole("button", { name: /more actions for laptops/i })
    .click();
  await expect(
    page.getByRole("menuitem", { name: /view details/i }),
  ).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /^move$/i })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: /deactivate/i })).toHaveCount(
    0,
  );
  await expect(page.getByRole("menuitem", { name: /^delete$/i })).toHaveCount(0);

  await page.goto("/en-CA/admin/products/categories/create");
  await expect(page.getByText(/access denied/i)).toBeVisible();

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByText(/access denied/i)).toBeVisible();

  expect(
    catalogueRequests.filter((request) => request.method !== "GET"),
  ).toEqual([]);
});

test("category full tree route loads the complete tree without lazy-list controls", async ({
  page,
}) => {
  const categoryTreeRequests: URL[] = [];

  await mockAdminApi(page, {
    identity: adminIdentity,
    onCategoryTreeRequest: (url) => categoryTreeRequests.push(url),
  });

  await page.goto("/en-CA/admin/products/categories");
  await page.getByRole("link", { name: /open full tree/i }).click();
  await expect(page).toHaveURL(
    /\/en-CA\/admin\/products\/categories\/tree$/,
  );
  await expect(
    page.getByRole("heading", { name: /^category tree$/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: /laptops/i }).first(),
  ).toBeVisible();
  await expect(page.getByText("Gaming laptops")).toBeVisible();
  expect(categoryTreeRequests.at(-1)?.searchParams.get("page")).toBe("0");
  expect(categoryTreeRequests.at(-1)?.searchParams.get("size")).toBe("10000");
  expect(categoryTreeRequests.at(-1)?.searchParams.has("sort")).toBe(false);
  await expect(page.getByRole("combobox", { name: /rows per page/i })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: /collapse laptops/i }).click();
  await expect(page.getByText("Gaming laptops")).toHaveCount(0);
});

test("category full tree too-large fallback links back to the paginated list", async ({
  page,
}) => {
  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryTreeFixture: "too-large",
  });

  await page.goto("/en-CA/admin/products/categories/tree");

  await expect(page.getByText(/too large for the tree view/i)).toBeVisible();
  await page.getByRole("link", { name: /open paginated list/i }).click();
  await expect(page).toHaveURL(/\/en-CA\/admin\/products\/categories$/);
});

test("category full tree move submits append payload and refreshes the tree", async ({
  page,
}) => {
  const categoryMutationBodies: Array<Record<string, unknown>> = [];
  let moved = false;
  let categoryTreeRequestCount = 0;

  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryMutationBodies,
    // The moved node's existing parent must be returned for includeIds=1.
    // Omitting it correctly puts the picker into its stale-category state.
    categoryParentOptions: [
      ...categoryParentOptionFixtures,
      {
        active: true,
        depth: 0,
        disabledReason: null,
        id: categoryFixture.id,
        label: "Laptops (laptops)",
        name: categoryFixture.name,
        parentId: null,
        path: [],
        selectable: true,
        slug: categoryFixture.slug,
      },
    ],
    categoryTreeItems: () => {
      categoryTreeRequestCount += 1;

      return categoryTreeFixtures.map((item) =>
        item.id === 7
          ? {
              ...item,
              parentId: moved ? 2 : 1,
            }
          : item,
      );
    },
    onCategoryMutation: (body) => {
      moved = body.newParentId === 2;
    },
  });

  await page.goto("/en-CA/admin/products/categories/tree");
  await expect(page.getByText("Gaming laptops")).toBeVisible();
  const initialCategoryTreeRequestCount = categoryTreeRequestCount;
  await page
    .getByRole("row", { name: /gaming laptops/i })
    .getByRole("button", { name: /more actions for gaming laptops/i })
    .click();
  await page.getByRole("menuitem", { name: /^move$/i }).click();
  await expect(page.getByRole("dialog", { name: /^move category$/i })).toBeVisible();
  const moveParentSelect = getMoveParentCategorySelect(page);
  await expect(moveParentSelect).toHaveValue("Laptops (laptops)");
  await expect(moveParentSelect).toBeEnabled();
  await moveParentSelect.click();
  await page
    .getByRole("option", { name: parentCategoryOptionName.accessories })
    .click();
  await page.getByRole("button", { name: /^move category$/i }).click();

  await expect.poll(() => categoryMutationBodies.length).toBe(1);
  expectLatestMoveParentId(categoryMutationBodies, 2);
  expect(Object.keys(categoryMutationBodies[0] ?? {}).sort()).toEqual([
    "newParentId",
  ]);
  await expect
    .poll(() => categoryTreeRequestCount)
    .toBeGreaterThan(initialCategoryTreeRequestCount);
});

test("generated admin create and edit forms submit with mocked Spring responses", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/create");
  await expect(page.getByRole("heading", { name: /create category/i })).toBeVisible();
  await page.getByRole("textbox", { name: /^name/i }).fill("Laptops");
  await page.getByRole("button", { name: /create category/i }).click();
  await expect(page.getByText(/the category was created/i)).toBeVisible();

  await page.goto("/en-CA/admin/users/create");
  await expect(page.getByRole("heading", { name: /create user/i })).toBeVisible();
  await page.getByRole("textbox", { name: /^username/i }).fill("admin");
  await page
    .getByRole("textbox", { name: /^email/i })
    .fill("admin@example.test");
  await page.getByLabel(/^password/i).fill("secret123");
  await page.getByLabel(/^confirm password/i).fill("secret123");
  await page.getByRole("button", { name: /create user/i }).click();
  await expect(page.getByText(/the user was created/i)).toBeVisible();
});

test("category parent select supports real browser keyboard reopening and navigation", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = page.getByRole("combobox", { name: /parent id/i });

  await parentSelect.click();
  await page
    .getByRole("option", { name: /accessories \(accessories\)/i })
    .click();
  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expectActiveComboboxOption(parentSelect, /accessories \(accessories\)/i);
  await page.keyboard.press("ArrowDown");
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await expect(
    page.getByRole("option", { name: /cameras \(cameras\)/i }),
  ).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(parentSelect).toHaveValue("Cameras (cameras)");
});

test("category list move dialog parent select supports ArrowDown from an existing parent", async ({
  page,
}) => {
  const categoryMutationBodies: Array<Record<string, unknown>> = [];
  let moved = false;
  let categoryListRequestCount = 0;

  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryListItems: () => {
      categoryListRequestCount += 1;

      return [
        {
          ...categoryEditWithParentFixture,
          parentId: moved ? 3 : categoryEditWithParentFixture.parentId,
        },
      ];
    },
    categoryMutationBodies,
    onCategoryMutation: (body) => {
      moved = body.newParentId === 3;
    },
  });

  await page.goto("/en-CA/admin/products/categories");
  await expect(page.getByText("Mirrorless Cameras")).toBeVisible();
  const initialCategoryListRequestCount = categoryListRequestCount;
  await openCategoryMoveDialog(page);

  const parentSelect = getMoveParentCategorySelect(page);

  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.accessories }),
  ).toBeVisible();
  await expectComboboxDropdownSurface(parentSelect);
  await expectActiveComboboxOption(parentSelect, parentCategoryOptionName.accessories);
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.cameras }),
  ).toBeVisible();
  await expectActiveComboboxOption(parentSelect, parentCategoryOptionName.cameras);
  await expectActiveComboboxOptionHighlight(parentSelect);
  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await page.keyboard.press("Enter");
  await expect(parentSelect).toHaveValue("Cameras (cameras)");

  await page.getByRole("button", { name: /^move category$/i }).click();
  await expect.poll(() => categoryMutationBodies.length).toBe(1);
  expectLatestMoveParentId(categoryMutationBodies, 3);
  await expect(
    page.getByRole("cell", { name: "Mirrorless Cameras", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => categoryListRequestCount)
    .toBeGreaterThan(initialCategoryListRequestCount);
});

test("category list move dialog parent select keeps the current parent visible while options load", async ({
  page,
}) => {
  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryListItems: [categoryEditWithParentFixture],
    categoryParentOptionsDelayMs: 3_000,
  });

  await page.goto("/en-CA/admin/products/categories");
  await openCategoryMoveDialog(page);

  const parentSelect = getMoveParentCategorySelect(page);

  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(parentSelect).not.toHaveValue("");

  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.cameras }),
  ).toBeVisible();
  await expectComboboxDropdownSurface(parentSelect);
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
});

test("category list move dialog parent select cancels keyboard navigation with Escape", async ({
  page,
}) => {
  const categoryMutationBodies: Array<Record<string, unknown>> = [];

  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryListItems: [categoryEditWithParentFixture],
    categoryMutationBodies,
  });

  await page.goto("/en-CA/admin/products/categories");
  await openCategoryMoveDialog(page);

  const parentSelect = getMoveParentCategorySelect(page);

  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expectActiveComboboxOption(parentSelect, parentCategoryOptionName.accessories);
  await page.keyboard.press("ArrowDown");
  await expectComboboxDropdownSurface(parentSelect);
  await expectActiveComboboxOption(parentSelect, parentCategoryOptionName.cameras);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.cameras }),
  ).toHaveCount(0);
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await expect(
    page.getByRole("button", { name: /^move category$/i }),
  ).toBeDisabled();
  expect(categoryMutationBodies).toHaveLength(0);
});

test("category parent select supports ArrowDown from an initially selected parent", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/4/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = page.getByRole("combobox", { name: /parent id/i });

  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await expect(parentSelect).not.toHaveAttribute("data-expanded", "");

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: /accessories \(accessories\)/i }),
  ).toBeVisible();
  await expectActiveComboboxOption(parentSelect, /accessories \(accessories\)/i);
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("option", { name: /cameras \(cameras\)/i }),
  ).toBeVisible();
  await expectActiveComboboxOption(parentSelect, /cameras \(cameras\)/i);
  await expectActiveComboboxOptionHighlight(parentSelect);
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await expect(
    page.getByRole("option", { name: /cameras \(cameras\)/i }),
  ).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(parentSelect).not.toHaveAttribute("data-expanded", "");
  await expect(parentSelect).toHaveValue("Cameras (cameras)");
});

test("category parent select does not clear an existing parent from keyboard submit", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/4/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = page.getByRole("combobox", { name: /parent id/i });

  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: /accessories \(accessories\)/i }),
  ).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(parentSelect).toHaveValue("Accessories (accessories)");
});

test("category parent select keeps an inactive selected parent visible on ArrowDown", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/6/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = page.getByRole("combobox", { name: /parent id/i });

  await expect(parentSelect).toHaveValue(
    "Archived Accessories (archived-accessories)",
  );

  await parentSelect.click();
  await page.keyboard.press("ArrowDown");
  await expect(parentSelect).toHaveValue(
    "Archived Accessories (archived-accessories)",
  );
  await expect(
    page.getByRole("option", { name: /cameras \(cameras\)/i }),
  ).toBeVisible();
});

test("category parent select keeps the parent visible while options load", async ({
  page,
}) => {
  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryParentOptionsDelayMs: 3_000,
  });

  await page.goto("/en-CA/admin/products/categories/4/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = page.getByRole("combobox", { name: /parent id/i });

  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await expect(parentSelect).not.toHaveAttribute("data-expanded", "");

  await parentSelect.click();
  await expect(parentSelect).toHaveAttribute("data-expanded", "true");
  await page.keyboard.press("ArrowDown");
  await expect(parentSelect).toHaveAttribute("data-expanded", "true");
  await expect(parentSelect).not.toHaveValue("");

  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await expect(
    page.getByRole("option", { name: /cameras \(cameras\)/i }),
  ).toBeVisible();
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
});

test("category parent select supports keyboard-only ArrowDown selection", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = page.getByRole("combobox", { name: /parent id/i });

  await expect(page.getByRole("textbox", { name: /^name/i })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(parentSelect).toBeFocused();
  await expect(
    page.getByRole("option", { name: /accessories \(accessories\)/i }),
  ).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expectActiveComboboxOption(parentSelect, /accessories \(accessories\)/i);
  await page.keyboard.press("Enter");

  await expect(parentSelect).toHaveValue("Accessories (accessories)");
});

test("category parent select supports ArrowDown after typed search", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = page.getByRole("combobox", { name: /parent id/i });

  await parentSelect.fill("cam");
  await expect(
    page.getByRole("option", { name: /cameras \(cameras\)/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: /accessories \(accessories\)/i }),
  ).toHaveCount(0);

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await expect(parentSelect).toHaveValue("Cameras (cameras)");
});

test("category parent select keeps the committed parent while ArrowDown cycles options", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/4/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = getParentCategorySelect(page);
  const activeOptionIds = new Set<string>();

  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.accessories }),
  ).toBeVisible();

  for (let index = 0; index < 4; index += 1) {
    await page.keyboard.press("ArrowDown");
    await expect(parentSelect).toHaveValue("Accessories (accessories)");

    const activeOptionId = await parentSelect.getAttribute(
      "aria-activedescendant",
    );

    if (activeOptionId) {
      activeOptionIds.add(activeOptionId);
    }
  }

  expect(activeOptionIds.size).toBeGreaterThan(1);

  await page.keyboard.press("Escape");
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
});

test("category parent select commits keyboard choices with Enter and Space", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = getParentCategorySelect(page);

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.accessories }),
  ).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expectActiveComboboxOption(parentSelect, parentCategoryOptionName.accessories);
  await page.keyboard.press("ArrowDown");
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await page.keyboard.press("Enter");
  await expect(parentSelect).toHaveValue("Cameras (cameras)");
});

test("category parent select preserves parent ID until reopened selection is confirmed", async ({
  page,
}) => {
  const categoryMutationBodies: Array<Record<string, unknown>> = [];

  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryMutationBodies,
  });

  await page.goto("/en-CA/admin/products/categories/4/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = getParentCategorySelect(page);

  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.cameras }),
  ).toBeVisible();
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.cameras }),
  ).toHaveCount(0);
  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await page.getByRole("button", { name: /save category/i }).click();
  await expect.poll(() => categoryMutationBodies.length).toBe(1);
  expectLatestSubmittedParentId(categoryMutationBodies, 2);

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.cameras }),
  ).toBeVisible();
  await page
    .getByRole("option", { name: parentCategoryOptionName.cameras })
    .click();
  await expect(parentSelect).toHaveValue("Cameras (cameras)");

  await page.getByRole("button", { name: /save category/i }).click();
  await expect.poll(() => categoryMutationBodies.length).toBe(2);
  expectLatestSubmittedParentId(categoryMutationBodies, 3);
});

test("category parent select handles an empty parent option list from the keyboard", async ({
  page,
}) => {
  const categoryMutationBodies: Array<Record<string, unknown>> = [];

  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryMutationBodies,
    categoryParentOptions: [],
  });

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = getParentCategorySelect(page);

  await parentSelect.click();
  await expect(page.getByRole("option", { name: /root category/i })).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(1);

  for (const key of ["ArrowDown", "Enter", "Space"]) {
    await page.keyboard.press(key);
  }

  await page.getByRole("button", { name: /save category/i }).click();
  await expect.poll(() => categoryMutationBodies.length).toBe(1);
  expectLatestSubmittedParentId(categoryMutationBodies, null);
});

test("category parent select handles a single category and re-selecting it", async ({
  page,
}) => {
  const categoryMutationBodies: Array<Record<string, unknown>> = [];

  await mockAdminApi(page, {
    identity: adminIdentity,
    categoryMutationBodies,
    categoryParentOptions: [categoryParentOptionFixtures[0]],
  });

  await page.goto("/en-CA/admin/products/categories/1/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = getParentCategorySelect(page);

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.accessories }),
  ).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await expect(parentSelect).toHaveValue("");
  await page.keyboard.press("Enter");
  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await page.keyboard.press("Enter");
  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await page.getByRole("button", { name: /save category/i }).click();
  await expect.poll(() => categoryMutationBodies.length).toBe(1);
  expectLatestSubmittedParentId(categoryMutationBodies, 2);
});

test("category parent select tolerates rapid ArrowDown presses without clearing the parent", async ({
  page,
}) => {
  await mockAdminApi(page, { identity: adminIdentity });

  await page.goto("/en-CA/admin/products/categories/4/edit");
  await expect(page.getByRole("heading", { name: /edit category/i })).toBeVisible();

  const parentSelect = getParentCategorySelect(page);

  await expect(parentSelect).toHaveValue("Accessories (accessories)");

  await parentSelect.click();
  await expect(
    page.getByRole("option", { name: parentCategoryOptionName.accessories }),
  ).toBeVisible();

  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("ArrowDown");
  }

  await expect(parentSelect).toHaveValue("Accessories (accessories)");
  await page.keyboard.press("Escape");
  await expect(parentSelect).toHaveValue("Accessories (accessories)");
});

const protectedAdminPaths = [
  "/admin",
  "/admin/users",
  "/admin/users/create",
  "/admin/users/user_1",
  "/admin/users/user_1/edit",
  "/admin/products/categories",
  "/admin/products/categories",
  "/admin/products/categories/tree",
  "/admin/products/categories/create",
  "/admin/products/categories/1",
  "/admin/products/categories/1/edit",
  "/admin/products/categories/tree",
  "/admin/products/categories/create",
  "/admin/products/categories/cat_1",
  "/admin/products/categories/cat_1/edit",
];

async function mockAdminApi(
  page: Page,
  options: {
    identity: AdminIdentity | null;
    categoryListDelayMs?: number;
    categoryListItems?: CategoryListItems;
    categoryMutationBodies?: Array<Record<string, unknown>>;
    categoryParentOptionsDelayMs?: number;
    categoryParentOptions?: unknown[];
    categoryTreeFixture?: "too-large";
    categoryTreeItems?: CategoryListItems;
    invalidLogin?: boolean;
    onCategoryListRequest?: (url: URL) => void;
    onCategoryTreeRequest?: (url: URL) => void;
    onCategoryMutation?: (body: Record<string, unknown>) => void;
  },
) {
  await page.route(
    "**/api/v1/admin/auth/csrf",
    async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ token: "csrf-e2e", headerName: "x-csrf-token" }),
      });
    },
  );

  await page.route(
    "**/api/v1/admin/auth/login",
    async (route) => {
      if (options.invalidLogin) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: { code: "auth.invalid", message: "Invalid" },
          }),
        });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ authenticated: true }),
      });
    },
  );

  await page.route(
    "**/api/v1/admin/auth/logout",
    async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    },
  );

  await page.route(
    "**/api/v1/admin/auth/me",
    async (route) => {
      if (!options.identity) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: { code: "auth.required", message: "Required" },
          }),
        });
        return;
      }

      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(options.identity),
      });
    },
  );

  await page.route("**/api/v1/products**", fulfillProducts);
  await page.route(
    "**/api/v1/admin/category-systems/catalogue/categories**",
    async (route) => {
      await fulfillCategories(route, {
        mutationBodies: options.categoryMutationBodies,
        listDelayMs: options.categoryListDelayMs,
        listItems: options.categoryListItems,
        onMutation: options.onCategoryMutation,
        parentOptionsDelayMs: options.categoryParentOptionsDelayMs,
        parentOptions: options.categoryParentOptions,
        onListRequest: options.onCategoryListRequest,
        onTreeRequest: options.onCategoryTreeRequest,
        treeFixture: options.categoryTreeFixture,
        treeItems: options.categoryTreeItems,
      });
    },
  );
  await page.route("**/api/v1/admin/roles**", async (route) => {
    await fulfillPage(route, [
      {
        active: true,
        code: "ADMIN",
        description: "Default administrator role",
        id: "role_admin",
        name: "Administrator",
      },
    ]);
  });
  await page.route("**/api/v1/admin/permissions**", async (route) => {
    await fulfillPage(route, [
      {
        action: "read",
        active: true,
        code: "admin:users:read",
        description: "Allows reading user records",
        id: "permission_admin_users_read",
        name: "Read admin users",
        resource: "admin-users",
      },
    ]);
  });
  await page.route(
    "**/api/v1/admin/users**",
    async (route) => {
      await fulfillUsers(route);
    },
  );
}

async function fulfillProducts(route: Route) {
  const method = route.request().method();

  if (method === "GET" && route.request().url().match(/\/products\/[^/?]+/)) {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: "product_1",
        title: "ThinkPad X1",
        slug: "thinkpad-x1",
        family: "STORAGE",
        brand: { id: "brand_lenovo", name: "Lenovo" },
        manufacturer: { id: "manufacturer_lenovo", name: "Lenovo" },
        mainImageUrl: null,
        shortDescription: "Business laptop.",
        identifiers: [],
        categories: [],
        active: true,
        createdAt: "2026-05-29T12:00:00.000Z",
        updatedAt: "2026-05-30T12:00:00.000Z",
      }),
    });
    return;
  }

  if (method === "POST" || method === "PUT") {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "product_1" }),
    });
    return;
  }

  await fulfillPage(route);
}

async function fulfillCategories(
  route: Route,
  options: {
    listDelayMs?: number;
    listItems?: CategoryListItems;
    mutationBodies?: Array<Record<string, unknown>>;
    onMutation?: (body: Record<string, unknown>) => void;
    onListRequest?: (url: URL) => void;
    onTreeRequest?: (url: URL) => void;
    parentOptionsDelayMs?: number;
    parentOptions?: unknown[];
    treeFixture?: "too-large";
    treeItems?: CategoryListItems;
  } = {},
) {
  const method = route.request().method();
  const url = new URL(route.request().url());

  if (method === "GET" && url.pathname.endsWith("/capabilities")) {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        rankingEnabled: true,
        placementModes: ["APPEND", "BEFORE_ID", "AFTER_ID", "TARGET_INDEX"],
        sortRankExposed: true,
        fallbackOrder: [{ property: "name", direction: "ASC" }],
        supportedOperations: ["capabilities", "list", "tree", "parent-options", "get", "breadcrumb", "create", "replace", "patch", "delete", "move", "reorder", "activate", "deactivate"],
        hierarchy: { enabled: true, readOperations: ["tree", "parent-options", "breadcrumb"], mutationOperations: ["move"], rootModel: "IMPLICIT_NULL_PARENT" },
        limits: { pageSize: 1000, searchInputLength: 120, filterSelections: 4, sortSelections: 5, treeSize: 10000, parentOptionPageSize: 50, includeIdCount: 25, hierarchyDepth: 2147483647 },
        lifecycle: { enabled: true, states: ["ACTIVE", "INACTIVE"], actions: ["activate", "deactivate"] },
        identifierProfile: "NUMERIC_LONG_V1",
        fields: ["identifier", "parent", "name", "slug", "active", "created-at", "updated-at", "rank", "hierarchy-context"],
        searchableFields: ["name", "slug"], allowedFilters: ["parent", "slug", "active"], allowedSorts: ["identifier", "parent", "name", "slug", "active", "created-at", "updated-at", "rank"],
        ordering: { orderingEnabled: true, rankingEnabled: true, rankExposed: true, reorderSupported: true, placementModes: ["APPEND", "BEFORE_ID", "AFTER_ID", "TARGET_INDEX"], fallbackOrder: [{ property: "name", direction: "ASC" }] },
      }),
    });
    return;
  }

  if (method === "GET" && url.pathname.endsWith("/breadcrumb")) {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
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
    });
    return;
  }

  if (method === "GET" && url.pathname.endsWith("/parent-options")) {
    if (options.parentOptionsDelayMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, options.parentOptionsDelayMs),
      );
    }

    await fulfillParentOptions(route, url, options.parentOptions);
    return;
  }

  if (method === "GET" && url.pathname.endsWith("/tree")) {
    options.onTreeRequest?.(url);

    if (options.treeFixture === "too-large") {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          code: "CATEGORY_TREE_TOO_LARGE",
          fieldErrors: [],
          message: "Tree too large",
          path: "/api/v1/admin/category-systems/catalogue/categories/tree",
          timestamp: "2026-06-04T00:00:00.000Z",
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        categoryTreeResponse(getCategoryTreeItems(options.treeItems)),
      ),
    });
    return;
  }

  if (
    method === "GET" &&
    url.pathname.match(/\/categories\/[^/?]+$/)
  ) {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        url.pathname.endsWith("/1")
          ? categoryEditFixture
          : url.pathname.endsWith("/4")
            ? categoryEditWithParentFixture
            : url.pathname.endsWith("/6")
              ? categoryEditWithInactiveParentFixture
            : categoryFixture,
      ),
    });
    return;
  }

  if (method === "DELETE") {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "cat_1" }),
    });
    return;
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const requestBody = route.request().postData();

    if (requestBody) {
      const body = JSON.parse(requestBody) as Record<string, unknown>;

      options.mutationBodies?.push(body);
      options.onMutation?.(body);
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "cat_1" }),
    });
    return;
  }

  if (options.listDelayMs) {
    await new Promise((resolve) => setTimeout(resolve, options.listDelayMs));
  }

  options.onListRequest?.(url);

  await fulfillPage(route, getCategoryListItems(options.listItems));
}

async function fulfillParentOptions(
  route: Route,
  url: URL,
  parentOptions: unknown[] = categoryParentOptionFixtures,
) {
  const excludeSubtreeId = toPositiveInteger(
    url.searchParams.get("excludeSubtreeId"),
  );
  const includeIds = getPositiveIntegers([
    ...url.searchParams.getAll("includeIds"),
    ...url.searchParams.getAll("includeIds[]"),
  ]);
  const includeInactive = url.searchParams.get("includeInactive") === "true";
  const limit = Math.min(
    toPositiveInteger(url.searchParams.get("limit")) ?? 25,
    25,
  );
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const cursor = url.searchParams.get("cursor")?.trim() ?? "";

  if (excludeSubtreeId === 404) {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        code: "CATEGORY_NOT_FOUND",
        fieldErrors: [],
        message: "Category was not found.",
      }),
    });
    return;
  }

  if (cursor && cursor !== "window-2") {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        code: "CATEGORY_PARENT_OPTIONS_CURSOR_INVALID",
        fieldErrors: [],
        message: "Parent option cursor is no longer valid.",
      }),
    });
    return;
  }

  const options = parentOptions.filter(isParentOption);
  const excludedIds = new Set(
    excludeSubtreeId == null ? [] : [excludeSubtreeId],
  );
  const selectedOptions = options.filter(
    (option) => includeIds.includes(option.id) && !excludedIds.has(option.id),
  );
  const ordinaryOptions = options.filter((option) => {
    if (excludedIds.has(option.id) || includeIds.includes(option.id)) {
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

  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
      data: [...selectedOptions, ...windowedOptions],
      hasMore,
      nextCursor: hasMore ? "window-2" : null,
    }),
  });
}

type CategoryListItems = unknown[] | (() => unknown[]);

function getCategoryListItems(listItems: CategoryListItems | undefined) {
  if (typeof listItems === "function") {
    return listItems();
  }

  return listItems ?? [categoryFixture];
}

function getCategoryTreeItems(treeItems: CategoryListItems | undefined) {
  if (typeof treeItems === "function") {
    return treeItems();
  }

  return treeItems ?? categoryTreeFixtures;
}

function hasTracedRequest(
  requests: Array<{ method: string; pathname: string }>,
  method: string,
  pathname: string,
) {
  return requests.some(
    (request) => request.method === method && request.pathname === pathname,
  );
}

function categoryTreeResponse(data: unknown[]) {
  return {
    data,
    page: {
      number: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
      numberOfElements: data.length,
      first: true,
      last: true,
    },
    sort: [],
    links: {
      self: "/api/v1/admin/category-systems/catalogue/categories/tree?page=0",
      next: null,
      previous: null,
    },
  };
}

function isParentOption(value: unknown): value is {
  active: boolean;
  id: number;
  label: string;
  name: string;
  slug: string;
} {
  return (
    Boolean(value && typeof value === "object") &&
    typeof (value as { active?: unknown }).active === "boolean" &&
    typeof (value as { id?: unknown }).id === "number" &&
    typeof (value as { label?: unknown }).label === "string" &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { slug?: unknown }).slug === "string"
  );
}

function getPositiveIntegers(values: string[]): number[] {
  return values
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

function getParentCategorySelect(page: Page) {
  return page.getByRole("combobox", { name: /parent id/i });
}

async function openFirstRowActionMenu(page: Page) {
  await page.getByRole("button", { name: /more actions for/i }).first().click();
}

async function openCategoryMoveDialog(page: Page) {
  await expect(
    page.getByRole("heading", { name: /^product categories$/i }),
  ).toBeVisible();
  await openFirstRowActionMenu(page);
  await page.getByRole("menuitem", { name: /^move$/i }).click();
  await expect(page.getByRole("dialog", { name: /^move category$/i })).toBeVisible();
}

function getMoveParentCategorySelect(page: Page) {
  return page
    .getByRole("dialog", { name: /^move category$/i })
    .getByRole("combobox", { name: /^new parent/i });
}

async function expectActiveComboboxOption(
  combobox: Locator,
  expectedName: RegExp,
) {
  await expect
    .poll(async () =>
      combobox.evaluate((input) => {
        const activeOptionId = input.getAttribute("aria-activedescendant");

        if (activeOptionId) {
          const activeOptionText = document
            .getElementById(activeOptionId)
            ?.textContent?.trim();

          if (activeOptionText) {
            return activeOptionText;
          }
        }

        return (
          getComboboxOptionsList(input)
            ?.querySelector<HTMLElement>(
              "[data-combobox-selected], [aria-selected='true']",
            )
            ?.textContent?.trim() ??
          ""
        );

        function getComboboxOptionsList(input: Element): HTMLElement | null {
          const listId = input.getAttribute("aria-controls");
          const candidates = [
            listId ? document.getElementById(listId) : null,
            ...Array.from(document.querySelectorAll<HTMLElement>("[role='listbox']")),
          ].filter((candidate): candidate is HTMLElement => Boolean(candidate));

          return candidates.find(isVisibleElement) ?? candidates[0] ?? null;
        }

        function isVisibleElement(element: HTMLElement) {
          const rect = element.getBoundingClientRect();

          return rect.width > 0 && rect.height > 0;
        }
      }),
    )
    .toMatch(expectedName);
}

async function expectActiveComboboxOptionHighlight(combobox: Locator) {
  await expect
    .poll(async () =>
      combobox.evaluate((input) => {
        const activeOptionId = input.getAttribute("aria-activedescendant");

        const activeOption = activeOptionId
          ? document.getElementById(activeOptionId)
          : getComboboxOptionsList(input)?.querySelector<HTMLElement>(
              "[data-combobox-selected], [aria-selected='true']",
            );

        if (!activeOption) {
          return JSON.stringify({
            highlighted: false,
            reason: "missing active option",
          });
        }

        const listbox = activeOption.closest("[role='listbox']");
        const optionBackground =
          window.getComputedStyle(activeOption).backgroundColor;
        const listboxBackground = listbox
          ? window.getComputedStyle(listbox).backgroundColor
          : "";

        const highlighted =
          isOpaqueBackgroundColor(optionBackground) &&
          optionBackground !== "transparent" &&
          optionBackground !== "rgba(0, 0, 0, 0)" &&
          optionBackground !== listboxBackground;

        return highlighted
          ? "highlighted"
          : JSON.stringify({
              activeOptionClassName: activeOption.className,
              dataComboboxSelected: activeOption.getAttribute(
                "data-combobox-selected",
              ),
              highlighted,
              listboxClassName: listbox?.className ?? "",
              optionBackground,
              optionText: activeOption.textContent?.trim() ?? "",
            });

	        function isOpaqueBackgroundColor(color: string) {
          const rgbaMatch = color.match(/^rgba?\(([^)]+)\)$/);

          if (!rgbaMatch?.[1]) {
            return Boolean(color);
          }

          const colorParts = rgbaMatch[1].split(",").map((part) => part.trim());

          if (colorParts.length < 4) {
            return true;
          }

	          return Number(colorParts[3]) >= 1;
	        }

        function getComboboxOptionsList(input: Element): HTMLElement | null {
          const listId = input.getAttribute("aria-controls");
          const candidates = [
            listId ? document.getElementById(listId) : null,
            ...Array.from(document.querySelectorAll<HTMLElement>("[role='listbox']")),
          ].filter((candidate): candidate is HTMLElement => Boolean(candidate));

          return candidates.find(isVisibleElement) ?? candidates[0] ?? null;
        }

        function isVisibleElement(element: HTMLElement) {
          const rect = element.getBoundingClientRect();

          return rect.width > 0 && rect.height > 0;
        }
      }),
    )
    .toBe("highlighted");
}

async function expectComboboxDropdownSurface(combobox: Locator) {
  await expect
    .poll(async () =>
      combobox.evaluate((input) => {
        const listId = input.getAttribute("aria-controls");
        const listboxCandidates = [
          listId ? document.getElementById(listId) : null,
          ...Array.from(document.querySelectorAll<HTMLElement>("[role='listbox']")),
        ].filter((candidate): candidate is HTMLElement => Boolean(candidate));
        const listbox =
          listboxCandidates.find((candidate) => {
            const rect = candidate.getBoundingClientRect();

            return rect.width > 0 && rect.height > 0;
          }) ??
          listboxCandidates[0] ??
          null;

        if (!listbox) {
          return JSON.stringify({
            reason: "missing listbox",
            surfaceReady: false,
          });
        }

        const dropdown =
          (listbox.closest("[class*='parentDropdown']") as HTMLElement | null) ??
          (listbox.closest(".mantine-Combobox-dropdown") as HTMLElement | null) ??
          (listbox.closest(".mantine-Popover-dropdown") as HTMLElement | null) ??
          listbox;
        const dialog = input.closest("[role='dialog']");
        const dropdownBackground =
          window.getComputedStyle(dropdown).backgroundColor;
        const listboxBackground =
          window.getComputedStyle(listbox).backgroundColor;
        const dropdownRect = dropdown.getBoundingClientRect();
        const listboxRect = listbox.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        const surfaceOpaque =
          isOpaqueBackgroundColor(dropdownBackground) ||
          isOpaqueBackgroundColor(listboxBackground);
        const visiblySized =
          (dropdownRect.width >= Math.min(160, inputRect.width * 0.75) &&
            dropdownRect.height >= 40) ||
          (listboxRect.width >= Math.min(160, inputRect.width * 0.75) &&
            listboxRect.height >= 40);
        const outsideDialog = !dialog || !dialog.contains(dropdown);
        const surfaceReady = visiblySized && outsideDialog;

        return surfaceReady
          ? "ready"
          : JSON.stringify({
              dropdownBackground,
              dropdownClassName: dropdown.className,
              dropdownHeight: dropdownRect.height,
              dropdownInsideDialog: dialog?.contains(dropdown) ?? false,
              dropdownWidth: dropdownRect.width,
              listboxBackground,
              listboxClassName: listbox.className,
              listboxHeight: listboxRect.height,
              listboxWidth: listboxRect.width,
              surfaceOpaque,
              reason: "dropdown surface is not opaque and portaled",
              surfaceReady,
            });

        function isOpaqueBackgroundColor(color: string) {
          const rgbaMatch = color.match(/^rgba?\(([^)]+)\)$/);

          if (!rgbaMatch?.[1]) {
            return Boolean(color);
          }

          const colorParts = rgbaMatch[1].split(",").map((part) => part.trim());

          if (colorParts.length < 4) {
            return color !== "transparent";
          }

          return Number(colorParts[3]) >= 1;
        }
      }),
    )
    .toBe("ready");
}

function expectLatestSubmittedParentId(
  categoryMutationBodies: Array<Record<string, unknown>>,
  parentId: number | null,
) {
  expect(categoryMutationBodies[categoryMutationBodies.length - 1]).toEqual(
    expect.objectContaining({ parentId }),
  );
}

function expectLatestMoveParentId(
  categoryMutationBodies: Array<Record<string, unknown>>,
  newParentId: number | null,
) {
  expect(categoryMutationBodies[categoryMutationBodies.length - 1]).toEqual(
    expect.objectContaining({ newParentId }),
  );
}

async function fulfillUsers(route: Route) {
  const method = route.request().method();

  if (method === "GET" && route.request().url().match(/\/admin\/users\/[^/?]+/)) {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(userFixture),
    });
    return;
  }

  if (method === "POST") {
    const body = route.request().postDataJSON() as Record<string, unknown>;

    if (typeof body.password !== "string" || body.password.trim().length === 0) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          code: "VALIDATION_FAILED",
          fieldErrors: [{ field: "password", message: "Password is required." }],
          message: "Request validation failed",
          path: "/api/v1/admin/users",
          timestamp: "2026-06-04T00:00:00.000Z",
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "user_1" }),
    });
    return;
  }

  if (method === "PUT") {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ id: "user_1" }),
    });
    return;
  }

  await fulfillPage(route, [userFixture]);
}

async function fulfillPage(route: Route, data: unknown[] = []) {
  await route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({
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
    }),
  });
}
