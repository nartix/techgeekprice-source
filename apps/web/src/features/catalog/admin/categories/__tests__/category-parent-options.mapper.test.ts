import { describe, expect, it } from "vitest";

import type { AdminCategoryParentOptionDto } from "@tgp/contracts";

import {
  composeCategoryParentOptions,
  createRootCategoryParentOption,
  findSelectedCategoryParentOption,
  mapCategoryParentOptionDto,
  mapRemoteCategoryParentOptions,
  mergeRemoteCategoryParentOptions,
} from "../category-parent-options.mapper";
import { CATEGORY_PARENT_ROOT_VALUE } from "../types/category-parent-options.types";

describe("category parent option mapper", () => {
  it("maps the synthetic root option separately from backend options", () => {
    expect(createRootCategoryParentOption("No parent")).toEqual({
      disabled: false,
      disabledReason: null,
      label: "No parent",
      source: "root",
      value: CATEGORY_PARENT_ROOT_VALUE,
    });
  });

  it("uses backend label as primary text and slug as secondary context", () => {
    expect(mapCategoryParentOptionDto(parentOption())).toEqual(
      expect.objectContaining({
        disabled: false,
        disabledReason: null,
        label: "Audio > Headphones",
        slug: "headphones",
        source: "remote",
        value: "2",
      }),
    );
  });

  it("disables inactive and non-selectable options", () => {
    expect(
      mapCategoryParentOptionDto(
        parentOption({
          active: false,
          disabledReason: "INACTIVE",
          selectable: true,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        disabled: true,
        disabledReason: "INACTIVE",
      }),
    );
    expect(
      mapCategoryParentOptionDto(
        parentOption({
          disabledReason: "DESCENDANT",
          selectable: false,
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        disabled: true,
        disabledReason: "DESCENDANT",
      }),
    );
  });

  it("pins a hydrated selected option and removes duplicate remote entries", () => {
    const rootOption = createRootCategoryParentOption("No parent");
    const selectedOption = findSelectedCategoryParentOption({
      dtos: [parentOption()],
      selectedParentId: 2,
    });
    const remoteOptions = mapRemoteCategoryParentOptions({
      dtos: [
        parentOption(),
        parentOption({ id: 3, label: "Cameras", slug: "cameras" }),
      ],
      selectedParentId: 2,
    });

    expect(
      composeCategoryParentOptions({
        remoteOptions,
        rootOption,
        selectedOption,
      }).map((option) => [option.value, option.source]),
    ).toEqual([
      [CATEGORY_PARENT_ROOT_VALUE, "root"],
      ["2", "selected"],
      ["3", "remote"],
    ]);
  });

  it("appends cursor windows while preserving first-seen options", () => {
    expect(
      mergeRemoteCategoryParentOptions(
        [mapCategoryParentOptionDto(parentOption({ id: 2 }))],
        [
          mapCategoryParentOptionDto(parentOption({ id: 2, label: "Duplicate" })),
          mapCategoryParentOptionDto(parentOption({ id: 4, label: "Tripods" })),
        ],
      ).map((option) => option.label),
    ).toEqual(["Audio > Headphones", "Tripods"]);
  });
});

function parentOption(
  overrides: Partial<AdminCategoryParentOptionDto> = {},
): AdminCategoryParentOptionDto {
  return {
    active: true,
    depth: 1,
    disabledReason: null,
    id: 2,
    label: "Audio > Headphones",
    name: "Headphones",
    parentId: 1,
    path: [
      {
        active: true,
        createdAt: "2026-05-29T12:00:00.000Z",
        depth: 0,
        id: 1,
        name: "Audio",
        slug: "audio",
        updatedAt: "2026-05-30T12:00:00.000Z",
      },
    ],
    selectable: true,
    slug: "headphones",
    ...overrides,
  };
}
