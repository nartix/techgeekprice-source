import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { AdminCategoryParentOptionDto } from "@tgp/contracts";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import { CategoryParentPicker } from "../components/CategoryParentPicker";

describe("CategoryParentPicker", () => {
  it("renders an associated label, error, root option, and remote options", async () => {
    const user = userEvent.setup();

    render(
      <PickerHarness
        api={createApi(() => slice([parentOption()]))}
        error="Choose a valid parent."
      />,
    );

    const input = screen.getByRole("combobox", { name: /parent id/i });

    expect(input).toBeVisible();
    expect(screen.getByText("Choose a valid parent.")).toBeVisible();

    await user.click(input);

    expect(
      await screen.findByRole("option", { name: /root category/i }),
    ).toBeVisible();
    expect(
      await screen.findByRole("option", { name: /accessories/i }),
    ).toBeVisible();
  });

  it("uses the catalogue parent-options API path by default", async () => {
    const user = userEvent.setup();
    const api = createApi(() => slice([parentOption()]));

    render(<PickerHarness api={api} />);

    await user.click(screen.getByRole("combobox", { name: /parent id/i }));
    expect(
      await screen.findByRole("option", { name: /accessories/i }),
    ).toBeVisible();
    expect(api.custom).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        query: { limit: 25 },
        url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
      }),
    );
  });

  it("selects root and selectable remote options", async () => {
    const user = userEvent.setup();

    render(
      <PickerHarness
        api={createApi(() =>
          slice([
            parentOption({ id: 2, label: "Accessories", slug: "accessories" }),
            parentOption({ id: 3, label: "Cameras", slug: "cameras" }),
          ]),
        )}
        initialValue="2"
        selectedParentId={2}
      />,
    );

    const input = screen.getByRole("combobox", { name: /parent id/i });

    await user.click(input);
    await user.click(
      await screen.findByRole("option", { name: /root category/i }),
    );
    expect(input).toHaveValue("Root category");

    await user.click(input);
    await user.click(await screen.findByRole("option", { name: /cameras/i }));
    expect(input).toHaveValue("Cameras");
  });

  it("closes with Escape without changing the selected value", async () => {
    const user = userEvent.setup();

    render(
      <PickerHarness
        api={createApi(() =>
          slice([
            parentOption({ id: 2, label: "Accessories", slug: "accessories" }),
            parentOption({ id: 3, label: "Cameras", slug: "cameras" }),
          ]),
        )}
        initialValue="2"
        selectedParentId={2}
      />,
    );

    const input = screen.getByRole("combobox", { name: /parent id/i });

    await user.click(input);
    await screen.findByRole("option", { name: /cameras/i });
    await user.keyboard("{ArrowDown}{Escape}");

    expect(screen.queryByRole("option", { name: /cameras/i })).toBeNull();
    expect(input).toHaveValue("Accessories");
  });

  it("keeps inactive ordinary options disabled", async () => {
    const user = userEvent.setup();

    render(
      <PickerHarness
        api={createApi(() =>
          slice([
            parentOption({
              active: false,
              disabledReason: "INACTIVE",
              label: "Archived Accessories",
              selectable: false,
              slug: "archived-accessories",
            }),
          ]),
        )}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /parent id/i }));

    const inactiveOption = await screen.findByRole("option", {
      name: /archived accessories/i,
    });

    expect(screen.getByText("Inactive")).toBeVisible();
    await user.click(inactiveOption);
    expect(screen.getByRole("combobox", { name: /parent id/i })).toHaveValue("");
  });

  it("loads configured Product Category parent options and hydrates inactive selected values only when selected", async () => {
    const user = userEvent.setup();
    const api = createApi(() =>
      slice([
        parentOption({
          active: false,
          disabledReason: "INACTIVE",
          id: 2,
          label: "Archived Accessories",
          selectable: false,
          slug: "archived-accessories",
        }),
      ]),
    );

    render(
      <PickerHarness
        api={api}
        apiBasePath="/api/v1/admin/category-systems/catalogue/categories"
        initialValue="2"
        selectedParentId={2}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /parent id/i }));
    expect(
      await screen.findByRole("option", { name: /archived accessories/i }),
    ).toBeVisible();
    expect(api.custom).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        query: {
          includeIds: [2],
          includeInactive: true,
          limit: 25,
        },
        url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
      }),
    );
  });

  it("omits includeInactive during ordinary configured parent browsing", async () => {
    const user = userEvent.setup();
    const api = createApi(() => slice([parentOption()]));

    render(
      <PickerHarness
        api={api}
        apiBasePath="/api/v1/admin/category-systems/catalogue/categories"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /parent id/i }));
    await screen.findByRole("option", { name: /accessories/i });

    expect(api.custom).toHaveBeenCalledWith(
      expect.objectContaining({
        query: {
          limit: 25,
        },
        url: "/api/v1/admin/category-systems/catalogue/categories/parent-options",
      }),
    );
  });

  it("shows loading, retry, root-only, and load-more states", async () => {
    const user = userEvent.setup();
    let failNext = true;
    const api = createApi(({ query }) => {
      if (failNext) {
        failNext = false;
        return Promise.reject(new Error("temporary"));
      }

      return query?.cursor
        ? slice([parentOption({ id: 3, label: "Cameras", slug: "cameras" })])
        : slice([], { hasMore: true, nextCursor: "next" });
    });

    render(<PickerHarness api={api} />);

    await user.click(screen.getByRole("combobox", { name: /parent id/i }));
    expect(
      (await screen.findAllByText("Parent categories could not be loaded."))[0],
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(
      await screen.findByRole("option", { name: /root category/i }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /load more/i }));
    expect(await screen.findByRole("option", { name: /cameras/i })).toBeVisible();
  });
});

function PickerHarness({
  apiBasePath,
  api,
  error,
  initialValue = "",
  selectedParentId,
}: {
  apiBasePath?: string;
  api: AdminFormOptionLoaderApi;
  error?: string;
  initialValue?: string;
  selectedParentId?: string | number | null;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <CategoryParentPicker
      api={api}
      apiBasePath={apiBasePath}
      error={error}
      label="Parent ID"
      selectedParentId={selectedParentId}
      value={value}
      onChange={setValue}
    />
  );
}

function createApi(
  resolver: (
    args: Parameters<AdminFormOptionLoaderApi["custom"]>[0],
  ) =>
    | ReturnType<typeof slice>
    | Promise<ReturnType<typeof slice>>,
): AdminFormOptionLoaderApi {
  return {
    custom: vi.fn(async (args) =>
      resolver(args),
    ) as AdminFormOptionLoaderApi["custom"],
    loadOptions: vi.fn(),
  };
}

function slice(
  data: AdminCategoryParentOptionDto[],
  overrides: { hasMore?: boolean; nextCursor?: string | null } = {},
) {
  return {
    data,
    hasMore: overrides.hasMore ?? false,
    nextCursor: overrides.nextCursor ?? null,
  };
}

function parentOption(
  overrides: Partial<AdminCategoryParentOptionDto> = {},
): AdminCategoryParentOptionDto {
  return {
    active: true,
    depth: 0,
    disabledReason: null,
    id: 2,
    label: "Accessories",
    name: "Accessories",
    parentId: null,
    path: [],
    selectable: true,
    slug: "accessories",
    ...overrides,
  };
}
