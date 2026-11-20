import type { FieldValues } from "react-hook-form";
import {
  act,
  renderHook,
  waitFor,
} from "../../../../../../../tests/test-utils/render";
import { describe, expect, it, vi } from "vitest";

import type {
  AdminFieldOption,
  AdminFormField,
  AdminFormOptionLoaderApi,
} from "../../types/admin-form.types";
import { useAdminFieldOptions } from "../useAdminFieldOptions";

interface TestValues extends FieldValues {
  categoryId?: string;
  status: string;
}

describe("useAdminFieldOptions", () => {
  it("keeps empty static options stable when field props are recreated", () => {
    const { result, rerender } = renderHook(
      ({ field, values }) =>
        useAdminFieldOptions({
          enabled: true,
          field,
          mode: "create",
          values,
        }),
      {
        initialProps: {
          field: createTextField(),
          values: { status: "" },
        },
      },
    );
    const firstOptions = result.current.options;

    rerender({
      field: createTextField(),
      values: { status: "changed" },
    });

    expect(result.current.options).toBe(firstOptions);
  });

  it("does not replace equal static options when field config is recreated", () => {
    const { result, rerender } = renderHook(
      ({ field, values }) =>
        useAdminFieldOptions({
          enabled: true,
          field,
          mode: "create",
          values,
        }),
      {
        initialProps: {
          field: createSelectField(createStatusOptions()),
          values: { status: "" },
        },
      },
    );
    const firstOptions = result.current.options;

    rerender({
      field: createSelectField(createStatusOptions()),
      values: { status: "active" },
    });

    expect(result.current.options).toBe(firstOptions);
  });

  it("loads async options only when declared dependencies change", async () => {
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockResolvedValue(createStatusOptions());
    const field = createAsyncField({ dependsOn: ["categoryId"], loadOptions });
    const api = createOptionApi();
    const { rerender } = renderHook(
      ({ values }) =>
        useAdminFieldOptions({
          api,
          enabled: true,
          field,
          mode: "create",
          values,
        }),
      {
        initialProps: {
          values: { categoryId: "cat_1", status: "" },
        },
      },
    );

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1));

    rerender({ values: { categoryId: "cat_1", status: "active" } });

    expect(loadOptions).toHaveBeenCalledTimes(1);

    rerender({ values: { categoryId: "cat_2", status: "active" } });

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(2));
    expect(loadOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ categoryId: "cat_2" }),
      }),
    );
  });

  it("preserves a selected static value that is not in the configured options", () => {
    const { result } = renderHook(() =>
      useAdminFieldOptions({
        enabled: true,
        field: createSelectField(createStatusOptions()),
        mode: "edit",
        values: { status: "archived" },
      }),
    );

    expect(result.current.options).toEqual([
      { label: "Active", value: "active" },
      { disabled: true, label: "archived", value: "archived" },
    ]);
  });

  it("preserves a selected async value when loaded options do not include it", async () => {
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockResolvedValue([{ label: "Active", value: "active" }]);
    const field = createAsyncField({ loadOptions });
    const api = createOptionApi();
    const { result } = renderHook(() =>
      useAdminFieldOptions({
        api,
        enabled: true,
        field,
        mode: "edit",
        values: { status: "archived" },
      }),
    );

    await waitFor(() =>
      expect(result.current.options).toEqual([
        { label: "Active", value: "active" },
        { disabled: true, label: "archived", value: "archived" },
      ]),
    );
  });

  it("preserves a selected async value while options are loading", async () => {
    const optionsLoad = createDeferredOptions();
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockReturnValue(optionsLoad.promise);
    const field = createAsyncField({ loadOptions });
    const api = createOptionApi();
    const { result } = renderHook(() =>
      useAdminFieldOptions({
        api,
        enabled: true,
        field,
        mode: "edit",
        values: { status: "archived" },
      }),
    );

    await waitFor(() =>
      expect(result.current.options).toEqual([
        { disabled: true, label: "archived", value: "archived" },
      ]),
    );

    await act(async () => {
      optionsLoad.resolve([{ label: "Active", value: "active" }]);
    });

    await waitFor(() =>
      expect(result.current.options).toEqual([
        { label: "Active", value: "active" },
        { disabled: true, label: "archived", value: "archived" },
      ]),
    );
  });

  it("reloads async options for user-entered search text", async () => {
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockResolvedValue(createStatusOptions());
    const field = createAsyncField({ loadOptions });
    const api = createOptionApi();
    const { result } = renderHook(() =>
      useAdminFieldOptions({
        api,
        enabled: true,
        field,
        mode: "create",
        values: { status: "" },
      }),
    );

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.setSearch("draft");
    });

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(2));
    expect(loadOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "draft" }),
    );
  });

  it("does not reload async options when Mantine syncs search to the selected option label", async () => {
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockResolvedValue(createStatusOptions());
    const field = createAsyncField({ loadOptions });
    const api = createOptionApi();
    const { result } = renderHook(() =>
      useAdminFieldOptions({
        api,
        enabled: true,
        field,
        mode: "edit",
        values: { status: "active" },
      }),
    );

    await waitFor(() =>
      expect(result.current.options).toEqual(createStatusOptions()),
    );
    expect(loadOptions).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setSearch("Active");
    });

    await waitFor(() => expect(result.current.search).toBe("Active"));
    expect(loadOptions).toHaveBeenCalledTimes(1);
  });

  it("exposes async option load failures without clearing current options", async () => {
    const initialOptions = [
      { disabled: true, label: "active", value: "active" },
    ];
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockRejectedValue(new Error("Option source unavailable"));
    const field = createAsyncField({
      loadOptions,
    });
    const api = createOptionApi();
    const { result } = renderHook(() =>
      useAdminFieldOptions({
        api,
        enabled: true,
        field,
        mode: "create",
        values: { status: "active" },
      }),
    );

    await waitFor(() =>
      expect(result.current.error).toBe("Option source unavailable"),
    );

    expect(result.current.options).toEqual(initialOptions);
    expect(result.current.loading).toBe(false);
  });

  it("ignores stale async option results after dependency reloads", async () => {
    const firstLoad = createDeferredOptions();
    const secondLoad = createDeferredOptions();
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockReturnValueOnce(firstLoad.promise)
      .mockReturnValueOnce(secondLoad.promise);
    const field = createAsyncField({ dependsOn: ["categoryId"], loadOptions });
    const api = createOptionApi();
    const { result, rerender } = renderHook(
      ({ values }) =>
        useAdminFieldOptions({
          api,
          enabled: true,
          field,
          mode: "create",
          values,
        }),
      {
        initialProps: {
          values: { categoryId: "cat_1", status: "" },
        },
      },
    );

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1));

    rerender({ values: { categoryId: "cat_2", status: "" } });

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(2));

    await act(async () => {
      firstLoad.resolve([{ label: "Old", value: "old" }]);
    });
    expect(result.current.options).toEqual([]);

    await act(async () => {
      secondLoad.resolve([{ label: "New", value: "new" }]);
    });

    await waitFor(() =>
      expect(result.current.options).toEqual([{ label: "New", value: "new" }]),
    );
  });

  it("reloads async options on demand", async () => {
    const firstOptions = [{ label: "Draft", value: "draft" }];
    const secondOptions = [{ label: "Published", value: "published" }];
    const loadOptions = vi
      .fn<NonNullable<AdminFormField<TestValues>["loadOptions"]>>()
      .mockResolvedValueOnce(firstOptions)
      .mockResolvedValueOnce(secondOptions);
    const field = createAsyncField({ loadOptions });
    const api = createOptionApi();
    const { result } = renderHook(() =>
      useAdminFieldOptions({
        api,
        enabled: true,
        field,
        mode: "create",
        values: { status: "" },
      }),
    );

    await waitFor(() => expect(result.current.options).toEqual(firstOptions));

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.options).toEqual(secondOptions));
  });
});

function createTextField(): AdminFormField<TestValues> {
  return {
    label: "Status",
    name: "status",
    type: "text",
  };
}

function createSelectField(
  options: AdminFieldOption[],
): AdminFormField<TestValues> {
  return {
    label: "Status",
    name: "status",
    options,
    type: "select",
  };
}

function createAsyncField(args: {
  dependsOn?: AdminFormField<TestValues>["dependsOn"];
  loadOptions: NonNullable<AdminFormField<TestValues>["loadOptions"]>;
}): AdminFormField<TestValues> {
  return {
    dependsOn: args.dependsOn,
    label: "Status",
    loadOptions: args.loadOptions,
    name: "status",
    type: "relation-select",
  };
}

function createStatusOptions(): AdminFieldOption[] {
  return [{ label: "Active", value: "active" }];
}

function createOptionApi(): AdminFormOptionLoaderApi {
  return {
    custom: vi.fn(
      async () => ({}),
    ) as unknown as AdminFormOptionLoaderApi["custom"],
    loadOptions: vi.fn(async () => []),
  };
}

function createDeferredOptions(): {
  promise: Promise<AdminFieldOption[]>;
  resolve(options: AdminFieldOption[]): void;
} {
  let resolve: (options: AdminFieldOption[]) => void = () => undefined;
  const promise = new Promise<AdminFieldOption[]>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

const stableCancellationApi = createOptionApi();

it("ignores an aborted completion when the async loader is removed", async () => {
  let finish!: (options: AdminFieldOption[]) => void;
  let signal!: AbortSignal;
  const field: AdminFormField<TestValues> = {
    ...createSelectField([]),
    loadOptions: (args) => {
      signal = args.signal!;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  };
  const { result, rerender } = renderHook(
    ({ activeField }) =>
      useAdminFieldOptions({
        enabled: true,
        field: activeField,
        values: { status: "" },
        mode: "create",
        api: stableCancellationApi,
      }),
    { initialProps: { activeField: field } },
  );
  rerender({ activeField: createSelectField([]) });
  expect(signal.aborted).toBe(true);
  await act(async () => {
    finish([{ label: "Obsolete", value: "old" }]);
  });
  expect(result.current.options).toEqual([]);
  expect(result.current.error).toBeNull();
});
