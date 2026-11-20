"use client";

import { Stack, Title } from "@mantine/core";
import {
  useCreate,
  useCustomMutation,
  useDataProvider,
  useOne,
  useUpdate,
} from "@refinedev/core";
import type { BaseRecord, DataProvider, HttpError } from "@refinedev/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  DefaultValues,
  FieldValues,
  SubmitHandler,
} from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";

import { createZodFormResolver } from "../createZodFormResolver";
import type {
  AdminFormAction,
  AdminFormConfig,
  AdminFormOptionLoaderApi,
} from "../types/admin-form.types";
import {
  applyAdminApiValidationErrors,
  getRootFormErrorMessage,
} from "../utils/adminFormErrors";
import {
  getAdminFormDefaultValues,
  mergeAdminFormEditValues,
} from "../utils/adminFormDefaults";
import { createAdminFormOptionLoaderApi } from "../utils/adminFormOptions";
import {
  createAdminFormSubmitValues,
  getAdminFormFieldNames,
  getHiddenAdminFormFieldNames,
} from "../utils/adminFormPayload";
import { getAdminResourceMetadata } from "../../resources/adminResources";
import { AdminFormActions } from "./AdminFormActions";
import { AdminFormSection } from "./AdminFormSection";
import { AdminFormState } from "./AdminFormState";

interface AdminGeneratedFormProps<
  TValues extends FieldValues,
  TCreateRequest,
  TUpdateRequest,
  TRecord extends BaseRecord,
> {
  action: Exclude<AdminFormAction, "show">;
  config: AdminFormConfig<TValues, TCreateRequest, TUpdateRequest, TRecord>;
  id?: string;
  locale?: "en-CA" | "en-US" | "fr-CA";
  /** Defaults to true so existing forms retain their current read behaviour. */
  loadEnabled?: boolean;
  permissions?: string[];
  resource: string;
  roles?: string[];
  /** Defaults to true so existing forms retain their current submit behaviour. */
  submitEnabled?: boolean;
}

interface AdminGeneratedFormViewProps<
  TValues extends FieldValues,
  TCreateRequest,
  TUpdateRequest,
  TRecord,
> {
  action: AdminFormAction;
  api?: AdminFormOptionLoaderApi;
  config: AdminFormConfig<TValues, TCreateRequest, TUpdateRequest, TRecord>;
  disabled?: boolean;
  errorMessage?: string | null;
  initialValues?: Partial<TValues>;
  loading?: boolean;
  locale?: "en-CA" | "en-US" | "fr-CA";
  loadEnabled?: boolean;
  onSubmit: SubmitHandler<TValues>;
  permissions?: string[];
  record?: TRecord;
  roles?: string[];
  successMessage?: string | null;
  submitEnabled?: boolean;
  showLoadingState?: boolean;
  topContent?: ReactNode;
}

export function AdminGeneratedForm<
  TValues extends FieldValues,
  TCreateRequest,
  TUpdateRequest,
  TRecord extends BaseRecord,
>({
  action,
  config,
  id,
  loadEnabled = true,
  locale = "en-CA",
  permissions = [],
  resource,
  roles = [],
  submitEnabled = true,
}: AdminGeneratedFormProps<TValues, TCreateRequest, TUpdateRequest, TRecord>) {
  const getDataProvider = useDataProvider();
  const dataProvider = getDataProvider() as DataProvider | undefined;
  const optionApi = useMemo(
    () => createAdminFormOptionLoaderApi(dataProvider),
    [dataProvider],
  );
  const detail = useOne<TRecord, HttpError>({
    id,
    resource,
    queryOptions: {
      enabled: action === "edit" && Boolean(id) && loadEnabled,
    },
  });
  const createMutation = useCreate<TRecord, HttpError, TCreateRequest>();
  const updateMutation = useUpdate<TRecord, HttpError, TUpdateRequest>();
  const patchMutation = useCustomMutation<TRecord, HttpError, TUpdateRequest>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const record = detail.result as TRecord | undefined;
  const defaultValues = useMemo(
    () => getAdminFormDefaultValues(config.defaultValues),
    [config.defaultValues],
  );
  const initialValues = useMemo(() => {
    if (action === "edit" && record && config.mapRecordToFormValues) {
      return mergeAdminFormEditValues(
        defaultValues,
        config.mapRecordToFormValues(record),
      );
    }

    return defaultValues;
  }, [action, config, defaultValues, record]);
  const loading =
    createMutation.mutation.isPending ||
    updateMutation.mutation.isPending ||
    patchMutation.mutation.isPending ||
    (action === "edit" &&
      loadEnabled &&
      (detail.query.isLoading || detail.query.isFetching) &&
      !record);

  return (
    <AdminGeneratedFormView
      action={action}
      api={optionApi}
      config={config}
      disabled={loading}
      errorMessage={
        action === "edit" && detail.query.isError
          ? config.loadErrorMessage
          : null
      }
      initialValues={initialValues}
      loading={loading}
      locale={locale}
      loadEnabled={loadEnabled}
      permissions={permissions}
      record={record}
      roles={roles}
      showLoadingState={action === "edit" && loading && !record}
      successMessage={successMessage}
      submitEnabled={submitEnabled}
      onSubmit={async (values) => {
        if (!submitEnabled) {
          return;
        }
        setSuccessMessage(null);

        if (action === "create") {
          const payload =
            config.mapFormValuesToCreateRequest?.(values) ??
            (values as unknown as TCreateRequest);

          await createMutation.mutateAsync({ resource, values: payload });
          setSuccessMessage(config.successMessage?.create ?? null);
          return;
        }

        const payload =
          config.mapFormValuesToUpdateRequest?.(values) ??
          (values as unknown as TUpdateRequest);

        if (config.updateMethod === "patch") {
          const metadata = getAdminResourceMetadata(
            resource as Parameters<typeof getAdminResourceMetadata>[0],
          );

          await patchMutation.mutateAsync({
            method: "patch",
            url: `${metadata.apiPath}/${id ?? ""}`,
            values: payload,
          });
          setSuccessMessage(config.successMessage?.edit ?? null);
          return;
        }

        await updateMutation.mutateAsync({
          id: id ?? "",
          resource,
          values: payload,
        });
        setSuccessMessage(config.successMessage?.edit ?? null);
      }}
    />
  );
}

export function AdminGeneratedFormView<
  TValues extends FieldValues,
  TCreateRequest,
  TUpdateRequest,
  TRecord,
>({
  action,
  api,
  config,
  disabled = false,
  errorMessage,
  initialValues,
  loadEnabled = true,
  loading = false,
  locale = "en-CA",
  onSubmit,
  permissions = [],
  record,
  roles = [],
  showLoadingState = false,
  successMessage,
  submitEnabled = true,
  topContent,
}: AdminGeneratedFormViewProps<
  TValues,
  TCreateRequest,
  TUpdateRequest,
  TRecord
>) {
  const defaultValues = useMemo(
    () => initialValues ?? getAdminFormDefaultValues(config.defaultValues),
    [config.defaultValues, initialValues],
  );
  const schema = useMemo(
    () =>
      typeof config.schema === "function"
        ? config.schema({ mode: action })
        : config.schema,
    [action, config],
  );
  const tStates = useTranslations("Admin.States");
  const form = useForm<TValues, unknown, TValues>({
    defaultValues: defaultValues as DefaultValues<TValues>,
    resolver: createZodFormResolver<TValues>(schema),
  });
  const values = useWatch({ control: form.control }) as TValues;
  const rootError = getRootFormErrorMessage(form.formState.errors);
  const fieldNames = useMemo(() => getAdminFormFieldNames(config), [config]);
  const passwordAllowed = config.passwordFields?.allow === true;
  const title =
    action === "create"
      ? config.title?.create
      : action === "edit"
        ? config.title?.edit
        : config.title?.show;
  const submitLabel =
    action === "create"
      ? config.submitLabel?.create
      : action === "edit"
        ? config.submitLabel?.edit
        : config.submitLabel?.show;

  useEffect(() => {
    form.reset(defaultValues as TValues);
  }, [defaultValues, form]);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (submitValues) => {
        form.clearErrors("root");

        try {
          const filteredSubmitValues = createAdminFormSubmitValues(
            submitValues,
            config,
            {
              hiddenFieldNames: getHiddenAdminFormFieldNames(config, {
                mode: action,
                permissions,
                record,
                roles,
                values: submitValues,
              }),
              mode: action,
            },
          );

          await onSubmit(filteredSubmitValues);
        } catch (error) {
          applyAdminApiValidationErrors(error, form.setError, {
            fallbackMessage: config.errorMessage,
            forbiddenMessage: tStates("forbiddenMessage"),
            fieldNames,
            serverErrorFieldMap: config.serverErrorFieldMap,
          });
        }
      })}
    >
      <Stack gap="lg">
        {title ? <Title order={2}>{title}</Title> : null}
        <AdminFormState
          errorMessage={loadEnabled ? errorMessage : null}
          errorTitle={config.loadErrorTitle}
          loading={showLoadingState}
          loadingMessage={config.loadingMessage}
          rootError={rootError}
          successMessage={successMessage}
          successTitle={config.successMessage ? title : undefined}
        />
        {topContent}
        {config.sections.map((section) => (
          <AdminFormSection
            key={section.id}
            api={api}
            form={form}
            mode={action}
            passwordAllowed={passwordAllowed}
            permissions={permissions}
            record={record}
            roles={roles}
            section={section}
            values={values ?? (form.getValues() as TValues)}
          />
        ))}
        <AdminFormActions
          action={action}
          cancelHref={config.cancelHref}
          cancelLabel={config.cancelLabel}
          disabled={disabled || !submitEnabled}
          loading={loading || form.formState.isSubmitting}
          locale={locale}
          submitLabel={submitLabel}
        />
      </Stack>
    </form>
  );
}
