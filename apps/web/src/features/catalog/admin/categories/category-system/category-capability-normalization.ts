import type { AdminCategoryCapabilitiesDto } from "@tgp/contracts";
import { z } from "zod";

import type { DeepReadonly } from "./category-system.types";

const operations = [
  "capabilities",
  "list",
  "tree",
  "parent-options",
  "get",
  "breadcrumb",
  "create",
  "replace",
  "patch",
  "delete",
  "move",
  "reorder",
  "activate",
  "deactivate",
] as const;
const placementModes = [
  "APPEND",
  "BEFORE_ID",
  "AFTER_ID",
  "TARGET_INDEX",
] as const;
const logicalFields = [
  "identifier",
  "parent",
  "name",
  "slug",
  "active",
  "created-at",
  "updated-at",
  "rank",
  "hierarchy-context",
] as const;
const publicProperties = [
  "id",
  "parentId",
  "name",
  "slug",
  "active",
  "createdAt",
  "updatedAt",
  "sortRank",
] as const;

const uniqueArray = <TValue extends z.ZodType>(item: TValue) =>
  z.array(item).superRefine((values, context) => {
    const seen = new Set<string>();

    values.forEach((value, index) => {
      const key = JSON.stringify(value);
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Capability arrays cannot contain duplicate values.",
          path: [index],
        });
      }
      seen.add(key);
    });
  });

const fallbackOrderSchema = z
  .object({
    property: z.enum(publicProperties),
    direction: z.enum(["ASC", "DESC"]),
  })
  .strict();
const limitsSchema = z
  .object({
    pageSize: z.number().int().positive().safe().nullable(),
    searchInputLength: z.number().int().positive().safe().nullable(),
    filterSelections: z.number().int().positive().safe().nullable(),
    sortSelections: z.number().int().positive().safe().nullable(),
    treeSize: z.number().int().positive().safe().nullable(),
    parentOptionPageSize: z.number().int().positive().safe().nullable(),
    includeIdCount: z.number().int().positive().safe().nullable(),
    hierarchyDepth: z.number().int().positive().safe().nullable(),
  })
  .strict();

const capabilitySchema = z
  .object({
    rankingEnabled: z.boolean(),
    placementModes: uniqueArray(z.enum(placementModes)),
    sortRankExposed: z.boolean(),
    fallbackOrder: uniqueArray(fallbackOrderSchema),
    supportedOperations: uniqueArray(z.enum(operations)),
    hierarchy: z
      .object({
        enabled: z.boolean(),
        readOperations: uniqueArray(z.enum(operations)),
        mutationOperations: uniqueArray(z.enum(operations)),
        rootModel: z.literal("IMPLICIT_NULL_PARENT").nullable(),
      })
      .strict(),
    limits: limitsSchema,
    lifecycle: z
      .object({
        enabled: z.boolean(),
        states: uniqueArray(z.enum(["ACTIVE", "INACTIVE"])),
        actions: uniqueArray(z.enum(["activate", "deactivate"])),
      })
      .strict(),
    identifierProfile: z.literal("NUMERIC_LONG_V1"),
    fields: uniqueArray(z.enum(logicalFields)),
    searchableFields: uniqueArray(z.enum(logicalFields)),
    allowedFilters: uniqueArray(z.enum(logicalFields)),
    allowedSorts: uniqueArray(z.enum(logicalFields)),
    ordering: z
      .object({
        orderingEnabled: z.boolean(),
        rankingEnabled: z.boolean(),
        rankExposed: z.boolean(),
        reorderSupported: z.boolean(),
        placementModes: uniqueArray(z.enum(placementModes)),
        fallbackOrder: uniqueArray(fallbackOrderSchema),
      })
      .strict(),
  })
  .strict();

export type AdminCategoryCapabilityNormalizationResult =
  | {
      readonly ok: true;
      readonly value: DeepReadonly<AdminCategoryCapabilitiesDto>;
    }
  | { readonly ok: false; readonly error: Error };

function orderedEquals<TValue>(
  left: readonly TValue[],
  right: readonly TValue[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) => JSON.stringify(value) === JSON.stringify(right[index]),
    )
  );
}

function deepFreeze<TValue>(value: TValue): DeepReadonly<TValue> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach((item) => deepFreeze(item));
    Object.freeze(value);
  }

  return value as DeepReadonly<TValue>;
}

export function normalizeAdminCategoryCapabilities(
  value: unknown,
): AdminCategoryCapabilityNormalizationResult {
  const parsed = capabilitySchema.safeParse(value);

  if (!parsed.success) {
    return {
      ok: false,
      error: new Error("Invalid category capability response."),
    };
  }

  const capabilities = parsed.data as AdminCategoryCapabilitiesDto;
  const aliasesMatch =
    capabilities.rankingEnabled === capabilities.ordering.rankingEnabled &&
    capabilities.sortRankExposed === capabilities.ordering.rankExposed &&
    orderedEquals(
      capabilities.placementModes,
      capabilities.ordering.placementModes,
    ) &&
    orderedEquals(
      capabilities.fallbackOrder,
      capabilities.ordering.fallbackOrder,
    );

  if (!aliasesMatch) {
    return {
      ok: false,
      error: new Error("Category capability aliases do not match ordering."),
    };
  }

  return { ok: true, value: deepFreeze(capabilities) };
}
