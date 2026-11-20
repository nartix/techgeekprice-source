import { describe, expect, it } from "vitest";

import { createCategoryAdminSchema } from "../schemas/category-admin.schema";

const messages = {
  nameRequired: "Enter a category name.",
  nameSize: "Category name is too long.",
  parentIdInvalid: "Choose a valid parent category.",
  selfParentInvalid: "A category cannot be its own parent.",
  slugInvalid: "Use a valid category slug.",
  slugRequired: "Enter a category slug.",
};

describe("category admin schema", () => {
  it("accepts backend-aligned category values", () => {
    const schema = createCategoryAdminSchema(messages);

    expect(
      schema.parse({
        active: true,
        id: "1",
        name: "Laptops",
        parentId: "2",
        slug: "laptops",
        slugManuallyEdited: false,
      }),
    ).toMatchObject({
      name: "Laptops",
      parentId: "2",
    });
  });

  it("rejects invalid slugs and self-parent values", () => {
    const schema = createCategoryAdminSchema(messages);
    const result = schema.safeParse({
      active: true,
      id: "1",
      name: "",
      parentId: "1",
      slug: "Bad Slug",
      slugManuallyEdited: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["name", "parentId", "slug"]),
    );
  });

  it("rejects non-numeric parent ids before backend submission", () => {
    const schema = createCategoryAdminSchema(messages);
    const result = schema.safeParse({
      active: true,
      id: "1",
      name: "Laptops",
      parentId: "cat_2",
      slug: "laptops",
      slugManuallyEdited: false,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Choose a valid parent category.",
    );
  });
});
