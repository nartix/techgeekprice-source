import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCursorHierarchyOptions } from "../useCursorHierarchyOptions.js";

describe("useCursorHierarchyOptions", () => {
  it("starts one request exactly 300 ms after the final raw search change", async () => {
    vi.useFakeTimers();
    const loader = vi.fn().mockResolvedValue({
      options: [{ id: "1", label: "Laptops", source: "remote" }],
      hasMore: false,
      nextCursor: null,
    });
    const { result } = renderHook(() =>
      useCursorHierarchyOptions({
        adaptSlice: (value) => value as never,
        enabled: true,
        loader,
        root: { id: "__root__", label: "No parent", source: "root" },
      }),
    );

    act(() => result.current.setSearch("lap"));
    await act(async () => vi.advanceTimersByTimeAsync(299));
    expect(loader).not.toHaveBeenCalled();

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(loader).toHaveBeenCalledTimes(1);
    expect(result.current.options).toContainEqual({
      id: "1",
      label: "Laptops",
      source: "remote",
    });
    vi.useRealTimers();
  });
});
