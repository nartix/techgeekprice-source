import type {
  FieldPath,
  FieldValues,
  UseFormClearErrors,
  UseFormSetError,
} from "react-hook-form";

import type { ApiErrorResponseDto } from "@tgp/contracts";

import type { AdminFormConfig } from "../types/admin-form.types";

export interface ApplyAdminApiValidationErrorsOptions<
  TValues extends FieldValues,
> {
  fieldNames?: Array<FieldPath<TValues>>;
  serverErrorFieldMap?: AdminFormConfig<TValues>["serverErrorFieldMap"];
  fallbackMessage?: string;
  forbiddenMessage?: string;
  hiddenFieldNames?: string[];
}

export function applyAdminApiValidationErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  options: ApplyAdminApiValidationErrorsOptions<TValues> = {},
): boolean {
  const response = extractAdminApiErrorResponse(error);
  const fieldNames = new Set((options.fieldNames ?? []).map(String));
  const hiddenFields = new Set(options.hiddenFieldNames ?? []);
  let mapped = false;

  if (response) {
    for (const fieldError of response.fieldErrors ?? []) {
      if (
        fieldNames.has(fieldError.field) &&
        !hiddenFields.has(fieldError.field)
      ) {
        setError(fieldError.field as FieldPath<TValues>, {
          type: "server",
          message: fieldError.message,
        });
        mapped = true;
      }
    }

    const mappedField = options.serverErrorFieldMap?.[response.code];

    if (
      mappedField &&
      mappedField !== "root" &&
      !hiddenFields.has(mappedField)
    ) {
      setError(mappedField, {
        type: "server",
        message: response.message,
      });
      mapped = true;
    }

    if (!mapped) {
      setRootFormError(setError, response.message || options.fallbackMessage);
      return true;
    }

    return true;
  }

  setRootFormError(
    setError,
    getAdminApiErrorStatus(error) === 403
      ? (options.forbiddenMessage ?? options.fallbackMessage)
      : options.fallbackMessage,
  );
  return false;
}

export function clearAdminFieldServerError<TValues extends FieldValues>(
  clearErrors: UseFormClearErrors<TValues>,
  name: FieldPath<TValues>,
): void {
  clearErrors(name);
}

export function extractAdminApiErrorResponse(
  error: unknown,
): ApiErrorResponseDto | null {
  const status = getAdminApiErrorStatus(error);
  if (
    typeof status === "number" &&
    (status === 401 || status === 403 || status >= 500)
  ) {
    // These are not field-validation failures. Use the localized caller fallback.
    return null;
  }

  const candidates = [
    error,
    getObjectValue(error, "details"),
    getObjectValue(error, "data"),
    getObjectValue(error, "body"),
    getObjectValue(getObjectValue(error, "response"), "data"),
  ];

  for (const candidate of candidates) {
    if (isApiErrorResponseDto(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getRootFormErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const root = getObjectValue(error, "root");

  if (root && typeof root === "object") {
    const server = getObjectValue(root, "server");
    const rootMessage = getObjectValue(root, "message");
    const serverMessage = getObjectValue(server, "message");

    if (typeof serverMessage === "string") {
      return serverMessage;
    }

    if (typeof rootMessage === "string") {
      return rootMessage;
    }
  }

  return undefined;
}

function setRootFormError<TValues extends FieldValues>(
  setError: UseFormSetError<TValues>,
  message: string | undefined,
): void {
  setError("root.server" as FieldPath<TValues>, {
    type: "server",
    message: message ?? "The form could not be saved.",
  });
}

function isApiErrorResponseDto(value: unknown): value is ApiErrorResponseDto {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof getObjectValue(value, "code") === "string" &&
    typeof getObjectValue(value, "message") === "string" &&
    Array.isArray(getObjectValue(value, "fieldErrors"))
  );
}

function getObjectValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  return (source as Record<string, unknown>)[key];
}

function getAdminApiErrorStatus(error: unknown): number | undefined {
  const status =
    getObjectValue(error, "status") ??
    getObjectValue(error, "statusCode") ??
    getObjectValue(getObjectValue(error, "response"), "status");
  return typeof status === "number" ? status : undefined;
}
