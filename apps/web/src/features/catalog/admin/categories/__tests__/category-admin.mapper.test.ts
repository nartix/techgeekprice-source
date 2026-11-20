import type { AdminCategoryDto } from "@tgp/contracts";
import { describe, expect, it } from "vitest";

import {
  categoryParentIdToMutationValue,
  mapCategoryDtoToListItem,
  mapCategoryDtoToFormValues,
  mapCategoryFormValuesToMutationDto,
} from "../mappers/category-admin.mapper";

describe("category admin mapper", () => {
  it("maps records into generated form values", () => {
    expect(mapCategoryDtoToFormValues(categoryDto())).toEqual({
      active: true,
      id: "1",
      name: "Laptops",
      parentId: "2",
      slug: "laptops",
      slugManuallyEdited: false,
    });
  });

  it("maps list metadata for rank, depth, and child availability", () => {
    expect(
      mapCategoryDtoToListItem(
        categoryDto({ sortRank: 12, depth: 2, hasChildren: true }),
        "en-CA",
      ),
    ).toMatchObject({
      id: "1",
      parentId: "2",
      sortRank: 12,
      depth: 2,
      hasChildren: true,
      name: "Laptops",
    });
  });

  it("maps form values to accepted backend mutation keys", () => {
    const payload = mapCategoryFormValuesToMutationDto({
      active: true,
      id: "1",
      name: " Laptops ",
      parentId: " ",
      slug: " laptops ",
      slugManuallyEdited: true,
    });

    expect(payload).toEqual({
      active: true,
      name: "Laptops",
      parentId: null,
      slug: "laptops",
    });
    expect(payload).not.toHaveProperty("slugManuallyEdited");
  });

  it("converts selected parent ids into backend numeric ids", () => {
    expect(categoryParentIdToMutationValue(" 2 ")).toBe(2);
    expect(categoryParentIdToMutationValue(null)).toBeNull();
    expect(() => categoryParentIdToMutationValue("cat_2")).toThrow(
      /numeric identifier/i,
    );
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
