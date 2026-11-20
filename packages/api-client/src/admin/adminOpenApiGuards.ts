import type { components, operations } from "@tgp/contracts";

type Rule = "string" | "number" | "boolean" | "strings" | readonly string[];
type FieldRule<T> =
  NonNullable<T> extends string[]
    ? "strings"
    : NonNullable<T> extends number
      ? "number"
      : NonNullable<T> extends boolean
        ? "boolean"
        : string extends NonNullable<T>
          ? "string"
          : readonly Extract<NonNullable<T>, string>[];
type RuleMap<T> = { [K in keyof Required<T>]: FieldRule<T[K]> };

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function matchesRule(value: unknown, rule: Rule): boolean {
  if (typeof rule !== "string")
    return typeof value === "string" && rule.includes(value);
  if (rule === "strings")
    return Array.isArray(value) && value.every((v) => typeof v === "string");
  if (rule === "number")
    return typeof value === "number" && Number.isSafeInteger(value);
  return typeof value === rule;
}
function hasShape(
  value: unknown,
  rules: Record<string, Rule>,
  required: readonly string[] = [],
  exact = false,
): boolean {
  if (!isRecord(value)) return false;
  if (
    !required.every(
      (key) => Object.hasOwn(value, key) && value[key] !== undefined,
    )
  )
    return false;
  return Object.entries(value).every(([key, item]) => {
    const rule = Object.hasOwn(rules, key) ? rules[key] : undefined;
    return rule === undefined
      ? !exact
      : item === undefined || matchesRule(item, rule);
  });
}

// Decode only lossless supported query representations. Anything else keeps the
// existing generic transport; do not silently omit keys or coerce invalid input.
export function decodeQuery(
  search: URLSearchParams,
  rules: Record<string, Rule>,
): unknown {
  const result: Record<string, unknown> = {};
  for (const key of new Set(search.keys())) {
    const rule = Object.hasOwn(rules, key) ? rules[key] : undefined;
    if (!rule) return undefined;
    const values = search.getAll(key);
    if (rule === "strings") {
      result[key] = values;
      continue;
    }
    if (values.length !== 1) return undefined;
    const value = values[0]!;
    if (rule === "number") {
      const number = Number(value);
      if (!Number.isSafeInteger(number) || String(number) !== value)
        return undefined;
      result[key] = number;
    } else if (rule === "boolean") {
      if (value !== "true" && value !== "false") return undefined;
      result[key] = value === "true";
    } else result[key] = value;
  }
  return result;
}

export type UserListQuery = NonNullable<
  operations["listUsers_1"]["parameters"]["query"]
>;
export const userListQueryRules = {
  page: "number",
  size: "number",
  sort: "strings",
  search: "string",
  id: "number",
  username: "string",
  email: "string",
  firstName: "string",
  lastName: "string",
  active: "boolean",
  accountNonExpired: "boolean",
  accountNonLocked: "boolean",
  credentialsNonExpired: "boolean",
  lastLoginFrom: "string",
  lastLoginTo: "string",
  lastActivityFrom: "string",
  lastActivityTo: "string",
  createdFrom: "string",
  createdTo: "string",
  updatedFrom: "string",
  updatedTo: "string",
  createdBy: "string",
  updatedBy: "string",
  roles: "strings",
  role: "strings",
  permissions: "strings",
  permission: "strings",
  direction: ["asc", "desc"] as const,
} satisfies RuleMap<UserListQuery>;
export function isUserListQuery(value: unknown): value is UserListQuery {
  return hasShape(value, userListQueryRules, [], true);
}

export type RoleListQuery = NonNullable<
  operations["listRoles"]["parameters"]["query"]
>;
export const roleListQueryRules = {
  page: "number",
  size: "number",
  sort: "strings",
  q: "string",
  active: "boolean",
  direction: ["asc", "desc"] as const,
} satisfies RuleMap<RoleListQuery>;
export function isRoleListQuery(value: unknown): value is RoleListQuery {
  return hasShape(value, roleListQueryRules, [], true);
}

export type PermissionListQuery = NonNullable<
  operations["listPermissions"]["parameters"]["query"]
>;
export const permissionListQueryRules = {
  page: "number",
  size: "number",
  sort: "strings",
  q: "string",
  resource: "string",
  action: "string",
  active: "boolean",
  direction: ["asc", "desc"] as const,
} satisfies RuleMap<PermissionListQuery>;
export function isPermissionListQuery(
  value: unknown,
): value is PermissionListQuery {
  return hasShape(value, permissionListQueryRules, [], true);
}

export type CategoryListQuery = NonNullable<
  operations["listCategories_1"]["parameters"]["query"]
>;
export const categoryListQueryRules = {
  page: "number",
  size: "number",
  parentId: "string",
  active: "boolean",
  q: "string",
  slug: "string",
  sort: "strings",
  direction: "string",
} satisfies RuleMap<CategoryListQuery>;
export function isCategoryListQuery(
  value: unknown,
): value is CategoryListQuery {
  return hasShape(value, categoryListQueryRules, [], true);
}

export type CategoryTreeQuery = NonNullable<
  operations["listCategoryTree"]["parameters"]["query"]
>;
export const categoryTreeQueryRules = {
  page: "number",
  size: "number",
  sort: "strings",
  direction: "string",
} satisfies RuleMap<CategoryTreeQuery>;
export function isCategoryTreeQuery(
  value: unknown,
): value is CategoryTreeQuery {
  return hasShape(value, categoryTreeQueryRules, [], true);
}

export type CategoryParentQuery = NonNullable<
  operations["listParentOptions"]["parameters"]["query"]
>;
export const categoryParentQueryRules = {
  q: "string",
  limit: "number",
  cursor: "string",
  includeIds: "strings",
  excludeSubtreeId: "string",
  includeInactive: "string",
} satisfies RuleMap<CategoryParentQuery>;
export function isCategoryParentQuery(
  value: unknown,
): value is CategoryParentQuery {
  return hasShape(value, categoryParentQueryRules, [], true);
}

export type UserCreateBody = components["schemas"]["AdminCreateUserRequest"];
const userCreateBodyRules = {
  username: "string",
  email: "string",
  password: "string",
  firstName: "string",
  lastName: "string",
  active: "boolean",
  roles: "strings",
  permissions: "strings",
} satisfies RuleMap<UserCreateBody>;
export function isUserCreateBody(value: unknown): value is UserCreateBody {
  return hasShape(value, userCreateBodyRules, [
    "active",
    "email",
    "password",
    "username",
  ]);
}

export type UserMutationBody =
  components["schemas"]["AdminUserMutationRequest"];
const userMutationBodyRules = {
  username: "string",
  email: "string",
  firstName: "string",
  lastName: "string",
  active: "boolean",
  roles: "strings",
  permissions: "strings",
} satisfies RuleMap<UserMutationBody>;
export function isUserMutationBody(value: unknown): value is UserMutationBody {
  return hasShape(value, userMutationBodyRules, [
    "active",
    "email",
    "username",
  ]);
}

export type UserStatusBody = components["schemas"]["AdminUserStatusRequest"];
const userStatusBodyRules = {
  active: "boolean",
  accountNonExpired: "boolean",
  accountNonLocked: "boolean",
  credentialsNonExpired: "boolean",
} satisfies RuleMap<UserStatusBody>;
export function isUserStatusBody(value: unknown): value is UserStatusBody {
  return hasShape(value, userStatusBodyRules, []);
}

export type CategoryCreateBody =
  components["schemas"]["AdminCategoryCreateRequest"];
const categoryCreateBodyRules = {
  parentId: "number",
  beforeId: "number",
  afterId: "number",
  targetIndex: "number",
  name: "string",
  slug: "string",
  active: "boolean",
} satisfies RuleMap<CategoryCreateBody>;
export function isCategoryCreateBody(
  value: unknown,
): value is CategoryCreateBody {
  return hasShape(value, categoryCreateBodyRules, []);
}

export type CategoryUpdateBody =
  components["schemas"]["AdminCategoryUpdateRequest"];
const categoryUpdateBodyRules = {
  parentId: "number",
  name: "string",
  slug: "string",
  active: "boolean",
} satisfies RuleMap<CategoryUpdateBody>;
export function isCategoryUpdateBody(
  value: unknown,
): value is CategoryUpdateBody {
  return hasShape(value, categoryUpdateBodyRules, []);
}

export type CategoryMoveBody =
  components["schemas"]["AdminCategoryMoveRequest"];
const categoryMoveBodyRules = {
  newParentId: "number",
  beforeId: "number",
  afterId: "number",
  targetIndex: "number",
} satisfies RuleMap<CategoryMoveBody>;
export function isCategoryMoveBody(value: unknown): value is CategoryMoveBody {
  return hasShape(value, categoryMoveBodyRules, []);
}

export type CategoryReorderBody =
  components["schemas"]["AdminCategoryReorderRequest"];
const categoryReorderBodyRules = {
  parentId: "number",
  beforeId: "number",
  afterId: "number",
  targetIndex: "number",
} satisfies RuleMap<CategoryReorderBody>;
export function isCategoryReorderBody(
  value: unknown,
): value is CategoryReorderBody {
  return hasShape(value, categoryReorderBodyRules, []);
}
