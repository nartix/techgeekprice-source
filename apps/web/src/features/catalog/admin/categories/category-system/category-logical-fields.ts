import type {
  AdminCategoryLogicalField,
  AdminCategoryPublicProperty,
} from "@tgp/contracts";

const publicProperties: Readonly<
  Record<
    Exclude<AdminCategoryLogicalField, "hierarchy-context">,
    AdminCategoryPublicProperty
  >
> = {
  identifier: "id",
  parent: "parentId",
  name: "name",
  slug: "slug",
  active: "active",
  "created-at": "createdAt",
  "updated-at": "updatedAt",
  rank: "sortRank",
};

export function toAdminCategoryPublicProperty(
  field: AdminCategoryLogicalField,
): AdminCategoryPublicProperty | undefined {
  return field === "hierarchy-context" ? undefined : publicProperties[field];
}

export function toAdminCategorySortProperty(
  field: AdminCategoryLogicalField,
): AdminCategoryPublicProperty | undefined {
  return toAdminCategoryPublicProperty(field);
}
