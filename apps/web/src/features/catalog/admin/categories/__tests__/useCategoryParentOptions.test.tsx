import {
  act,
  renderHook,
  waitFor,
} from "../../../../../../tests/test-utils/render";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminCategoryParentOptionDto } from "@tgp/contracts";

import type { AdminFormOptionLoaderApi } from "../../../../platform/admin/forms";
import { useCategoryParentOptions } from "../hooks/useCategoryParentOptions";

describe("useCategoryParentOptions", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads a default slice when opened and keeps root first", async () => {
    const api = createApi(() => slice([parentOption()]));

    const { result } = renderHook(() =>
      useCategoryParentOptions({
        api,
        opened: true,
        rootLabel: "No parent",
        value: "",
      }),
    );

    expect(result.current.options.map((option) => option.label)).toEqual([
      "No parent",
    ]);
    await waitFor(() =>
      expect(result.current.options.map((option) => option.label)).toEqual([
        "No parent",
        "Accessories",
      ]),
    );
    expect(api.custom).toHaveBeenCalledWith(
      expect.objectContaining({
        query: {
          limit: 25,
        },
      }),
    );
  });

  it("debounces valid text and numeric search before requesting", async () => {
    const api = createApi(() => slice([parentOption()]));

    const { result } = renderHook(() =>
      useCategoryParentOptions({
        api,
        opened: true,
        rootLabel: "No parent",
        value: "",
      }),
    );

    await waitFor(() => expect(api.custom).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setSearch("123");
    });
    await delay(250);
    expect(api.custom).toHaveBeenCalledTimes(1);

    await delay(75);
    await waitFor(() => expect(api.custom).toHaveBeenCalledTimes(2));
    expect(api.custom).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ q: "123" }),
      }),
    );
  });

  it("hydrates selected parents and keeps includeIds on load more", async () => {
    const api = createApi(({ query }) =>
      query?.cursor
        ? slice([parentOption({ id: 4, label: "Tripods", slug: "tripods" })])
        : slice(
            [
              parentOption({ id: 2, label: "Accessories", slug: "accessories" }),
              parentOption({ id: 3, label: "Cameras", slug: "cameras" }),
            ],
            { hasMore: true, nextCursor: "cursor-two" },
          ),
    );

    const { result } = renderHook(() =>
      useCategoryParentOptions({
        api,
        excludeSubtreeId: 1,
        opened: true,
        rootLabel: "No parent",
        selectedParentId: 2,
        value: "2",
      }),
    );

    await waitFor(() =>
      expect(result.current.status.selectedValueStatus).toBe("selectable"),
    );
    expect(result.current.options.map((option) => option.value)).toEqual([
      "",
      "2",
      "3",
    ]);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(api.custom).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: {
          cursor: "cursor-two",
          excludeSubtreeId: 1,
          includeIds: [2],
          includeInactive: true,
          limit: 25,
        },
      }),
    );
    await waitFor(() =>
      expect(result.current.options.map((option) => option.value)).toEqual([
        "",
        "2",
        "3",
        "4",
      ]),
    );
  });

  it("prevents over-length search requests while retaining previous results", async () => {
    const api = createApi(() => slice([parentOption()]));

    const { result } = renderHook(() =>
      useCategoryParentOptions({
        api,
        opened: true,
        rootLabel: "No parent",
        value: "",
      }),
    );

    await waitFor(() =>
      expect(result.current.options.map((option) => option.label)).toContain(
        "Accessories",
      ),
    );
    act(() => {
      result.current.setSearch("x".repeat(121));
    });
    await delay(350);

    expect(result.current.searchError).toBe(true);
    expect(api.custom).toHaveBeenCalledTimes(1);
    expect(result.current.options.map((option) => option.label)).toContain(
      "Accessories",
    );
  });

  it("ignores stale responses after a newer request wins", async () => {
    let resolveFirst:
      | ((value: ReturnType<typeof slice>) => void)
      | undefined;
    const api = createApi(({ query }) => {
      if (!query?.q) {
        return new Promise<ReturnType<typeof slice>>((resolve) => {
          resolveFirst = resolve;
        });
      }

      return slice([parentOption({ id: 3, label: "Cameras", slug: "cameras" })]);
    });

    const { result } = renderHook(() =>
      useCategoryParentOptions({
        api,
        opened: true,
        rootLabel: "No parent",
        value: "",
      }),
    );

    act(() => {
      result.current.setSearch("cam");
    });
    await waitFor(() =>
      expect(result.current.options.map((option) => option.label)).toContain(
        "Cameras",
      ),
    );

    await act(async () => {
      resolveFirst?.(slice([parentOption({ label: "Stale Accessories" })]));
    });
    expect(result.current.options.map((option) => option.label)).not.toContain(
      "Stale Accessories",
    );
  });

  it("retries the first slice once after a cursor context error", async () => {
    const api = createApi(({ query }) => {
      if (query?.cursor) {
        return Promise.reject({ status: 409 });
      }

      return slice([parentOption()], {
        hasMore: true,
        nextCursor: "bad-cursor",
      });
    });

    const { result } = renderHook(() =>
      useCategoryParentOptions({
        api,
        opened: true,
        rootLabel: "No parent",
        selectedParentId: 2,
        value: "2",
      }),
    );

    await waitFor(() => expect(result.current.hasMore).toBe(true));
    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => expect(api.custom).toHaveBeenCalledTimes(3));
    expect(api.custom).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: {
          includeIds: [2],
          includeInactive: true,
          limit: 25,
        },
      }),
    );
  });

  it("blocks stale excluded categories without retrying without exclusion", async () => {
    const api = createApi(() => Promise.reject({ status: 404 }));

    const { result } = renderHook(() =>
      useCategoryParentOptions({
        api,
        excludeSubtreeId: 99,
        opened: true,
        rootLabel: "No parent",
        value: "",
      }),
    );

    await waitFor(() =>
      expect(result.current.blockingError).toEqual(
        expect.objectContaining({ code: "stale-category" }),
      ),
    );
    expect(api.custom).toHaveBeenCalledTimes(1);
  });
});

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
