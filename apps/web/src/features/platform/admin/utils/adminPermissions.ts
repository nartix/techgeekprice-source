import type {
  AdminActionDecision,
  AdminIdentity,
  AdminResourceAction,
  AdminResourceName,
} from "../types/admin.types";
import { getAdminResourceMetadata } from "../resources/adminResources";

const adminRoleNames = new Set(["ADMIN", "ROLE_ADMIN", "admin"]);
const moderatorRoleNames = new Set([
  "MODERATOR",
  "ROLE_MODERATOR",
  "moderator",
]);

export function hasAdminRole(
  identity: AdminIdentity | null | undefined,
): boolean {
  return identity?.roles.some((role) => adminRoleNames.has(role)) ?? false;
}

export function hasModeratorRole(
  identity: AdminIdentity | null | undefined,
): boolean {
  return identity?.roles.some((role) => moderatorRoleNames.has(role)) ?? false;
}

export function hasPermission(
  identity: AdminIdentity | null | undefined,
  permission: string,
): boolean {
  return identity?.permissions.includes(permission) ?? false;
}

export function canAccessAdminDashboard(
  identity: AdminIdentity | null | undefined,
): boolean {
  return canPerformAdminAction(identity, "dashboard", "list");
}

export function canPerformAdminAction(
  identity: AdminIdentity | null | undefined,
  resource: AdminResourceName,
  action: AdminResourceAction,
): boolean {
  if (!identity) {
    return false;
  }

  if (resource === "dashboard") {
    return (
      hasAdminRole(identity) ||
      hasModeratorRole(identity) ||
      hasPermission(identity, "admin:access")
    );
  }

  const metadata = getAdminResourceMetadata(resource);
  const permission = metadata.permissions[action];

  if (metadata.strictPermissions) {
    return permission ? hasPermission(identity, permission) : false;
  }

  if (hasAdminRole(identity)) {
    return true;
  }

  return permission ? hasPermission(identity, permission) : false;
}

export function canReadAdminResource(
  identity: AdminIdentity | null | undefined,
  resource: Exclude<AdminResourceName, "dashboard">,
): boolean {
  return canPerformAdminAction(identity, resource, "list");
}

export function canWriteAdminResource(
  identity: AdminIdentity | null | undefined,
  resource: Exclude<AdminResourceName, "dashboard">,
): boolean {
  return canPerformAdminAction(identity, resource, "edit");
}

export function decideAdminAccess(
  identity: AdminIdentity | null | undefined,
  resource: AdminResourceName,
  action: AdminResourceAction,
): AdminActionDecision {
  if (!identity) {
    return { can: false, reason: "unauthenticated" };
  }

  return canPerformAdminAction(identity, resource, action)
    ? { can: true }
    : { can: false, reason: "forbidden" };
}
