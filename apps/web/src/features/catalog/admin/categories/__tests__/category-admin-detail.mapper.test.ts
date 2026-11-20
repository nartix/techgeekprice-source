import type { AdminCategoryDetailDto, AdminCategoryDto } from "@tgp/contracts";
import { describe, expect, it } from "vitest";

import { mapCategoryDtoToDetailViewModel } from "../mappers/category-admin-detail.mapper";

describe("category admin detail mapper", () => {
  it("maps safe display model fields and formatted dates", () => {
    const viewModel = mapCategoryDtoToDetailViewModel(categoryDto(), "en-CA");

    expect(viewModel).toMatchObject({
      active: true,
      id: "1",
      name: "Laptops",
      parentId: "2",
      slug: "laptops",
    });
    expect(viewModel.createdAtLabel).toContain("2026");
    expect(viewModel.updatedAtLabel).toContain("2026");
    expect(viewModel).not.toHaveProperty("dto");
  });

  it("preserves null parent input for localized root fallback rendering", () => {
    expect(
      mapCategoryDtoToDetailViewModel(categoryDto({ parentId: null }), "en-CA")
        .parentId,
    ).toBeNull();
  });

  it("maps generic detail DTOs that omit list-only hierarchy fields", () => {
    const viewModel = mapCategoryDtoToDetailViewModel(
      {
        active: true,
        createdAt: "2026-05-29T12:00:00.000Z",
        id: 1,
        name: "Laptops",
        parentId: null,
        slug: "laptops",
        updatedAt: "2026-05-30T12:00:00.000Z",
      } satisfies AdminCategoryDetailDto,
      "en-CA",
    );

    expect(viewModel).toMatchObject({
      id: "1",
      name: "Laptops",
      parentId: null,
    });
    expect(viewModel).not.toHaveProperty("depth");
    expect(viewModel).not.toHaveProperty("hasChildren");
  });
});

function categoryDto(
  overrides: Partial<AdminCategoryDto> = {},
): AdminCategoryDto {
  return {
    active: true,
    createdAt: "2026-05-29T12:00:00.000Z",
    depth: 1,
    hasChildren: false,
    id: 1,
    name: "Laptops",
    parentId: 2,
    slug: "laptops",
    updatedAt: "2026-05-30T12:00:00.000Z",
    ...overrides,
  };
}
