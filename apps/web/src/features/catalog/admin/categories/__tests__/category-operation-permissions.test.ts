import { describe, expect, it } from "vitest";

import { catalogueCategorySystemDefinition } from "../category-system/catalogue-category-system.definition";
import {
  getCategoryOperationAvailability,
  isCategoryOperationUsable,
} from "../category-system/category-operation-availability";
import { createCatalogueCapabilities } from "./category-capability.fixtures";

describe("category operation permissions", () => {
  it("requires declared support and the exact configured permission", () => {
    const ready = {
      status: "ready" as const,
      identity: {
        systemKey: "catalogue",
        apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
      },
      capabilities: createCatalogueCapabilities(),
    };

    expect(
      isCategoryOperationUsable({
        definition: catalogueCategorySystemDefinition,
        capabilityState: ready,
        identityPermissions: ["admin:catalogue-categories:read"],
        operation: "list",
      }),
    ).toBe(true);
    expect(
      isCategoryOperationUsable({
        definition: catalogueCategorySystemDefinition,
        capabilityState: ready,
        identityPermissions: [],
        operation: "list",
      }),
    ).toBe(false);
  });

  it("fails closed while capabilities are unavailable", () => {
    expect(
      isCategoryOperationUsable({
        definition: catalogueCategorySystemDefinition,
        capabilityState: {
          status: "loading",
          identity: {
            systemKey: "catalogue",
            apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
          },
        },
        identityPermissions: ["admin:catalogue-categories:read"],
        operation: "list",
      }),
    ).toBe(false);
  });

  it("returns structured closed reasons for visibility, facets, and record state", () => {
    const ready = {
      status: "ready" as const,
      identity: {
        systemKey: "catalogue",
        apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
      },
      capabilities: createCatalogueCapabilities({
        hierarchy: {
          enabled: true,
          readOperations: ["tree"],
          mutationOperations: [],
          rootModel: "IMPLICIT_NULL_PARENT",
        },
      }),
    };

    expect(
      getCategoryOperationAvailability({
        definition: catalogueCategorySystemDefinition,
        capabilityState: ready,
        identityPermissions: ["admin:catalogue-categories:read"],
        operation: "move",
        requireHierarchyMutation: "move",
      }),
    ).toMatchObject({ usable: false, reason: "missing-permission" });

    expect(
      getCategoryOperationAvailability({
        definition: catalogueCategorySystemDefinition,
        capabilityState: ready,
        identityPermissions: ["admin:catalogue-categories:write"],
        operation: "move",
        requireHierarchyMutation: "move",
      }),
    ).toMatchObject({ usable: false, reason: "missing-hierarchy-facet" });

    expect(
      getCategoryOperationAvailability({
        definition: catalogueCategorySystemDefinition,
        capabilityState: ready,
        identityPermissions: ["admin:catalogue-categories:write"],
        operation: "activate",
        requireLifecycleAction: "activate",
        recordState: "ACTIVE",
      }),
    ).toMatchObject({ usable: false, reason: "record-state" });
  });

  it("returns authorization failures before capability-specific detail", () => {
    const ready = {
      status: "ready" as const,
      identity: {
        systemKey: "catalogue",
        apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
      },
      capabilities: createCatalogueCapabilities(),
    };

    expect(
      getCategoryOperationAvailability({
        definition: catalogueCategorySystemDefinition,
        capabilityState: ready,
        authenticated: false,
        identityPermissions: [],
        operation: "tree",
        requireHierarchyRead: "tree",
      }),
    ).toEqual({ usable: false, reason: "unauthenticated" });

    expect(
      getCategoryOperationAvailability({
        definition: catalogueCategorySystemDefinition,
        capabilityState: ready,
        authenticated: true,
        identityPermissions: ["ROLE_ADMIN"],
        operation: "tree",
        requireHierarchyRead: "tree",
      }),
    ).toEqual({ usable: false, reason: "missing-permission" });
  });

  it("fails closed for screen, identity, profile, and canonical ordering requirements", () => {
    const ready = {
      status: "ready" as const,
      identity: {
        systemKey: "catalogue",
        apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
      },
      capabilities: createCatalogueCapabilities(),
    };
    const input = {
      definition: catalogueCategorySystemDefinition,
      capabilityState: ready,
      identityPermissions: ["admin:catalogue-categories:read"],
      operation: "list" as const,
    };

    expect(
      getCategoryOperationAvailability({
        ...input,
        screen: "tree",
        definition: {
          ...catalogueCategorySystemDefinition,
          screens: { ...catalogueCategorySystemDefinition.screens, tree: false },
        },
      }),
    ).toEqual({ usable: false, reason: "screen-disabled" });

    expect(
      getCategoryOperationAvailability({
        ...input,
        capabilityState: {
          ...ready,
          identity: { ...ready.identity, systemKey: "another-system" },
        },
      }),
    ).toEqual({ usable: false, reason: "identity-mismatch" });

    expect(
      getCategoryOperationAvailability({
        ...input,
        requireIdentifierProfile: "NUMERIC_LONG_V1",
        definition: {
          ...catalogueCategorySystemDefinition,
          identifierProfile: "OTHER_PROFILE" as never,
        },
      }),
    ).toEqual({ usable: false, reason: "identifier-profile-mismatch" });

    expect(
      getCategoryOperationAvailability({
        ...input,
        requireOrdering: "rank-exposed",
        capabilityState: {
          ...ready,
          capabilities: createCatalogueCapabilities({
            ordering: {
              ...ready.capabilities.ordering,
              rankExposed: false,
            },
          }),
        },
      }),
    ).toEqual({ usable: false, reason: "missing-ordering-facet" });
  });

  it.each([
    [
      {
        definition: undefined,
        capabilityState: {
          status: "loading" as const,
          identity: {
            systemKey: "catalogue",
            apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
          },
        },
        authenticated: true,
        identityPermissions: ["admin:catalogue-categories:read"],
        operation: "list" as const,
      },
      "definition-missing",
    ],
    [
      {
        definition: catalogueCategorySystemDefinition,
        capabilityState: {
          status: "loading" as const,
          identity: {
            systemKey: "catalogue",
            apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
          },
        },
        identityPermissions: ["admin:catalogue-categories:read"],
        operation: "list" as const,
      },
      "not-ready",
    ],
    [
      {
        definition: catalogueCategorySystemDefinition,
        capabilityState: {
          status: "ready" as const,
          identity: {
            systemKey: "catalogue",
            apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
          },
          capabilities: createCatalogueCapabilities({
            supportedOperations: [],
          }),
        },
        identityPermissions: ["admin:catalogue-categories:read"],
        operation: "list" as const,
      },
      "unsupported",
    ],
    [
      {
        definition: catalogueCategorySystemDefinition,
        capabilityState: {
          status: "ready" as const,
          identity: {
            systemKey: "catalogue",
            apiBasePath: catalogueCategorySystemDefinition.apiBasePath,
          },
          capabilities: createCatalogueCapabilities(),
        },
        identityPermissions: ["admin:catalogue-categories:write"],
        operation: "reorder" as const,
        visible: true,
      },
      "hidden",
    ],
  ] as const)("returns %s without falling through", (input, reason) => {
    expect(getCategoryOperationAvailability(input)).toEqual({
      usable: false,
      reason,
    });
  });
});
