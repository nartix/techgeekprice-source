import type { ReactNode } from "react";
import type {
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";

export type AdminFormAction = "create" | "edit" | "show";

export type AdminFieldOptionValue = string | number | boolean;

export interface AdminFieldOption {
  label: string;
  value: AdminFieldOptionValue;
  description?: string;
  disabled?: boolean;
  meta?: Record<string, unknown>;
}

export interface AdminFormRuntimeContext<TValues extends FieldValues> {
  mode: AdminFormAction;
  values: TValues;
  permissions: string[];
  roles: string[];
  record?: unknown;
  fieldPath?: FieldPath<TValues>;
}

export interface AdminFormOptionLoaderApi {
  loadOptions(args: {
    resource: string;
    labelField: string;
    valueField: string;
    search?: string;
    filters?: Record<string, unknown>;
    signal?: AbortSignal;
  }): Promise<AdminFieldOption[]>;
  custom<TResponse>(args: {
    url: string;
    method?: "get" | "post";
    query?: Record<string, unknown>;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<TResponse>;
}

export type AdminFieldCondition<TValues extends FieldValues> = (
  ctx: AdminFormRuntimeContext<TValues>,
) => boolean;

export type AdminFieldAsyncValidator<TValues extends FieldValues> = (ctx: {
  value: unknown;
  values: TValues;
  mode: AdminFormAction;
  api: AdminFormOptionLoaderApi;
  signal?: AbortSignal;
}) => Promise<true | string>;

export type AdminFieldValueChangeHandler<TValues extends FieldValues> = (ctx: {
  value: unknown;
  previousValue: unknown;
  values: TValues;
  mode: AdminFormAction;
  setValue: UseFormReturn<TValues>["setValue"];
  getValues: UseFormReturn<TValues>["getValues"];
}) => void | Promise<void>;

export interface AdminFieldOptionState {
  options: AdminFieldOption[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch(search: string): void;
  reload(): void;
}

export type AdminFieldCustomRenderer<TValues extends FieldValues> = (ctx: {
  field: AdminFormField<TValues>;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  values: TValues;
  api?: AdminFormOptionLoaderApi;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  error?: string;
  optionState?: AdminFieldOptionState;
}) => ReactNode;

export type AdminFormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "multi-select"
  | "switch"
  | "relation-select"
  | "slug"
  | "custom";

export type AdminHiddenSubmitBehavior =
  | "omit"
  | "preserve-existing-edit-value"
  | "submit";

export interface AdminFormField<TValues extends FieldValues> {
  name: FieldPath<TValues>;
  label: string;
  type: AdminFormFieldType;
  description?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  createOnly?: boolean;
  editOnly?: boolean;
  showOnly?: boolean;
  permissions?: string[];
  roles?: string[];
  dependsOn?: FieldPath<TValues>[];
  visibleWhen?: AdminFieldCondition<TValues>;
  disabledWhen?: AdminFieldCondition<TValues>;
  requiredWhen?: AdminFieldCondition<TValues>;
  clearWhenHidden?: boolean;
  preserveWhenHidden?: boolean;
  hiddenSubmitBehavior?: AdminHiddenSubmitBehavior;
  uiOnly?: boolean;
  options?: AdminFieldOption[];
  loadOptions?: (ctx: {
    values: TValues;
    mode: AdminFormAction;
    search?: string;
    api: AdminFormOptionLoaderApi;
    signal?: AbortSignal;
  }) => Promise<AdminFieldOption[]>;
  validateAsync?: AdminFieldAsyncValidator<TValues>;
  asyncValidationDebounceMs?: number;
  onValueChange?: AdminFieldValueChangeHandler<TValues>;
  render?: AdminFieldCustomRenderer<TValues>;
  inputProps?: Record<string, unknown>;
}

export interface AdminFormSection<TValues extends FieldValues> {
  id: string;
  title?: string;
  description?: string;
  fields: AdminFormField<TValues>[];
  columns?: 1 | 2 | 3;
  visibleWhen?: AdminFieldCondition<TValues>;
}

export type AdminFormSchemaResolver<TValues extends FieldValues> =
  | z.ZodType<TValues>
  | ((ctx: { mode: AdminFormAction }) => z.ZodType<TValues>);

export interface AdminFormConfig<
  TValues extends FieldValues,
  TCreateRequest = unknown,
  TUpdateRequest = unknown,
  TRecord = unknown,
> {
  resource: string;
  title?: {
    create?: string;
    edit?: string;
    show?: string;
  };
  schema: AdminFormSchemaResolver<TValues>;
  defaultValues: Partial<TValues> | (() => Partial<TValues>);
  sections: AdminFormSection<TValues>[];
  mapRecordToFormValues?: (record: TRecord) => Partial<TValues>;
  mapFormValuesToCreateRequest?: (values: TValues) => TCreateRequest;
  mapFormValuesToUpdateRequest?: (values: TValues) => TUpdateRequest;
  updateMethod?: "put" | "patch";
  serverErrorFieldMap?: Partial<Record<string, FieldPath<TValues> | "root">>;
  successMessage?: {
    create?: string;
    edit?: string;
  };
  errorMessage?: string;
  loadingMessage?: string;
  loadErrorTitle?: string;
  loadErrorMessage?: string;
  retryLabel?: string;
  submitLabel?: {
    create?: string;
    edit?: string;
    show?: string;
  };
  cancelLabel?: string;
  cancelHref?: string;
  passwordFields?: {
    allow: boolean;
    reason?: string;
  };
  hiddenSubmitBehavior?: AdminHiddenSubmitBehavior;
}

export function defineAdminFormConfig<
  TValues extends FieldValues,
  TCreateRequest = unknown,
  TUpdateRequest = unknown,
  TRecord = unknown,
>(
  config: AdminFormConfig<TValues, TCreateRequest, TUpdateRequest, TRecord>,
): AdminFormConfig<TValues, TCreateRequest, TUpdateRequest, TRecord> {
  return config;
}
