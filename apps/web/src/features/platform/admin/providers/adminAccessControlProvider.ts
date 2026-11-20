import type { AccessControlProvider } from "@refinedev/core";

import { getAdminIdentity } from "../session/adminIdentityStore";
import type {
  AdminResourceAction,
  AdminResourceName,
} from "../types/admin.types";
import { decideAdminAccess } from "../utils/adminPermissions";

export function createAdminAccessControlProvider(): AccessControlProvider {
  return {
    can: async ({ resource, action }) => {
      const decision = decideAdminAccess(
        getAdminIdentity(),
        normalizeResource(resource),
        normalizeAction(action),
      );

      return {
        can: decision.can,
        reason: decision.reason,
      };
    },
    options: {
      buttons: {
        enableAccessControl: true,
        hideIfUnauthorized: true,
      },
    },
  };
}

function normalizeResource(resource: string | undefined): AdminResourceName {
  if (
    resource === "productCategories" ||
    resource === "users"
  ) {
    return resource;
  }

  return "dashboard";
}

function normalizeAction(action: string): AdminResourceAction {
  if (
    action === "list" ||
    action === "show" ||
    action === "create" ||
    action === "edit" ||
    action === "delete" ||
    action === "move" ||
    action === "state" ||
    action === "moderate" ||
    action === "revoke" ||
    action === "export" ||
    action === "custom"
  ) {
    return action;
  }

  return "custom";
}
