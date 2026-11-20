import { afterEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { act, renderHook } from "../../../../../../../tests/test-utils/render";

import type {
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../../types/admin-form.types";
import { ADMIN_FORM_DEFAULT_DEBOUNCE_MS } from "../useDebouncedValue";
import { useAdminAsyncFieldValidation } from "../useAdminAsyncFieldValidation";

interface TestValues {
  slug: string;
}

describe("useAdminAsyncFieldValidation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces advisory validation and writes field errors", async () => {
    vi.useFakeTimers();
    const validateAsync = vi.fn(async () => "Slug is already used.");
    const api = createOptionApi();
    const { result } = renderHook(() =>
      useAsyncValidationHarness({
        api,
        field: field({ validateAsync }),
      }),
    );

    await act(async () => {
      result.current.form.setValue("slug", "taken");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ADMIN_FORM_DEFAULT_DEBOUNCE_MS);
    });

    expect(validateAsync).toHaveBeenCalledOnce();
    expect(result.current.form.getFieldState("slug").error?.message).toBe(
      "Slug is already used.",
    );
  });

  it("skips hidden, disabled, empty, and capability-missing validation", () => {
    vi.useFakeTimers();
    const validateAsync = vi.fn(async (): Promise<true> => true);
    const { result, rerender } = renderHook(
      ({ disabled, visible, api }) =>
        useAsyncValidationHarness({
          api,
          disabled,
          field: field({ validateAsync }),
          visible,
        }),
      {
        initialProps: {
          api: createOptionApi() as AdminFormOptionLoaderApi | undefined,
          disabled: true,
          visible: true,
        },
      },
    );

    act(() => {
      result.current.form.setValue("slug", "taken");
      vi.advanceTimersByTime(ADMIN_FORM_DEFAULT_DEBOUNCE_MS);
    });
    expect(validateAsync).not.toHaveBeenCalled();

    rerender({ api: createOptionApi(), disabled: false, visible: false });
    act(() => {
      vi.advanceTimersByTime(ADMIN_FORM_DEFAULT_DEBOUNCE_MS);
    });
    expect(validateAsync).not.toHaveBeenCalled();

    rerender({ api: undefined, disabled: false, visible: true });
    act(() => {
      vi.advanceTimersByTime(ADMIN_FORM_DEFAULT_DEBOUNCE_MS);
    });
    expect(validateAsync).not.toHaveBeenCalled();
  });
});

function useAsyncValidationHarness(args: {
  api?: AdminFormOptionLoaderApi;
  disabled?: boolean;
  field: AdminFormField<TestValues>;
  visible?: boolean;
}) {
  const form = useForm<TestValues>({
    defaultValues: { slug: "" },
  });
  const values = form.getValues();

  useAdminAsyncFieldValidation({
    api: "api" in args ? args.api : createOptionApi(),
    disabled: args.disabled ?? false,
    field: args.field,
    form,
    mode: "create",
    values,
    visible: args.visible ?? true,
  });

  return { form };
}

function field(
  overrides: Partial<AdminFormField<TestValues>>,
): AdminFormField<TestValues> {
  return {
    label: "Slug",
    name: "slug",
    type: "slug",
    ...overrides,
  };
}

function createOptionApi(): AdminFormOptionLoaderApi {
  return {
    custom: vi.fn(async () => ({})) as unknown as AdminFormOptionLoaderApi["custom"],
    loadOptions: vi.fn(async () => []),
  };
}
