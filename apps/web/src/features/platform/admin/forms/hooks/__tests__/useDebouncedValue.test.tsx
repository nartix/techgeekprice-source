import { act, renderHook } from "../../../../../../../tests/test-utils/render";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_FORM_DEFAULT_DEBOUNCE_MS,
  useDebouncedValue,
} from "../useDebouncedValue";

describe("useDebouncedValue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the named default debounce delay", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      {
        initialProps: { value: "draft" },
      },
    );

    rerender({ value: "published" });

    expect(result.current).toBe("draft");

    act(() => {
      vi.advanceTimersByTime(ADMIN_FORM_DEFAULT_DEBOUNCE_MS - 1);
    });
    expect(result.current).toBe("draft");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("published");
  });

  it("supports explicit debounce overrides", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 50),
      {
        initialProps: { value: "draft" },
      },
    );

    rerender({ value: "published" });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current).toBe("published");
  });
});
