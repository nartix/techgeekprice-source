import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useSmallCategoryTree } from "../tree/hooks/useSmallCategoryTree";

const { custom, getProvider } = vi.hoisted(() => {
  const custom = vi.fn();
  return { custom, getProvider: () => ({ custom }) };
});
vi.mock("@refinedev/core", () => ({ useDataProvider: () => getProvider }));
const emptyPage = {
  data: [],
  page: {
    number: 0,
    first: true,
    last: true,
    totalElements: 0,
    numberOfElements: 0,
  },
};

it.each(["disable", "unmount", "replace"])(
  "ignores late tree completion after %s",
  async (action) => {
    const completions: ((value: { data: typeof emptyPage }) => void)[] = [];
    custom.mockImplementation(
      () => new Promise((resolve) => completions.push(resolve)),
    );
    const { result, rerender, unmount } = renderHook(
      ({ enabled, path }) =>
        useSmallCategoryTree("en-CA", { enabled, apiBasePath: path }),
      {
        initialProps: {
          enabled: true,
          path: "/api/v1/admin/category-systems/catalogue/categories",
        },
      },
    );
    await waitFor(() => expect(completions).toHaveLength(1));
    if (action === "unmount") unmount();
    else
      rerender({
        enabled: action !== "disable",
        path:
          action === "replace"
            ? "/api/v1/admin/category-systems/other/categories"
            : "/api/v1/admin/category-systems/catalogue/categories",
      });
    await act(async () => {
      completions[0]!({ data: emptyPage });
    });
    expect(result.current.state.status).toBe("loading");
    expect(result.current.moveErrorCode).toBeNull();
  },
);
