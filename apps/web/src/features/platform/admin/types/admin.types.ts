export type AdminResourceName =
  | "dashboard"
  | "productCategories"
  | "users";

export type AdminResourceGroupKey = "pages" | "products";

export type AdminResourceAction =
  | "list"
  | "show"
  | "create"
  | "edit"
  | "delete"
  | "move"
  | "state"
  | "moderate"
  | "revoke"
  | "export"
  | "custom";

export interface AdminIdentity {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
  sessionScope: string;
}

export type AdminPermissionMetadata = Partial<
  Record<AdminResourceAction, string>
>;

export interface AdminResourceMetadata {
  name: Exclude<AdminResourceName, "dashboard">;
  list: string;
  create: string;
  show: string;
  edit: string;
  apiPath: `/api/v1/${string}`;
  groupKey?: AdminResourceGroupKey;
  labelKey: string;
  icon: "productCategories" | "users";
  strictPermissions?: boolean;
  permissions: AdminPermissionMetadata;
  capabilities: {
    filters: string[];
    search: string[];
    optionalActions: string[];
  };
}

export interface AdminActionDecision {
  can: boolean;
  reason?: "unauthenticated" | "forbidden";
}
