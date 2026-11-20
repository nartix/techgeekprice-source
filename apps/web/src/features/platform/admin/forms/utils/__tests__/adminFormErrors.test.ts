import type { FieldValues, UseFormSetError } from "react-hook-form";
import { describe, expect, it } from "vitest";

import {
  applyAdminApiValidationErrors,
  extractAdminApiErrorResponse,
  getRootFormErrorMessage,
} from "../adminFormErrors";

interface TestValues {
  email: string;
  slug: string;
}

const validationError = {
  code: "VALIDATION_FAILED",
  fieldErrors: [{ field: "email", message: "Email must be valid" }],
  message: "Request validation failed",
  path: "/api/v1/admin/users",
  timestamp: "2026-06-04T00:00:00Z",
};

describe("admin form errors", () => {
  it("extracts direct and wrapped Spring error payloads", () => {
    expect(extractAdminApiErrorResponse(validationError)).toBe(validationError);
    expect(extractAdminApiErrorResponse({ details: validationError })).toBe(
      validationError,
    );
    expect(
      extractAdminApiErrorResponse({ response: { data: validationError } }),
    ).toBe(validationError);
  });

  it("maps visible field errors and configured conflict codes", () => {
    const calls = createSetErrorCalls<TestValues>();

    applyAdminApiValidationErrors(validationError, calls.setError, {
      fieldNames: ["email", "slug"],
      serverErrorFieldMap: {
        DUPLICATE_PRODUCT_SLUG: "slug",
      },
    });
    applyAdminApiValidationErrors(
      { ...validationError, code: "DUPLICATE_PRODUCT_SLUG", fieldErrors: [] },
      calls.setError,
      {
        fieldNames: ["email", "slug"],
        serverErrorFieldMap: {
          DUPLICATE_PRODUCT_SLUG: "slug",
        },
      },
    );

    expect(calls.errors).toEqual([
      ["email", "Email must be valid"],
      ["slug", "Request validation failed"],
    ]);
  });

  it("relocates hidden or unknown errors to the root error", () => {
    const calls = createSetErrorCalls<TestValues>();

    applyAdminApiValidationErrors(validationError, calls.setError, {
      fieldNames: ["email"],
      hiddenFieldNames: ["email"],
    });
    applyAdminApiValidationErrors({ message: "Unknown" }, calls.setError, {
      fallbackMessage: "The form could not be saved.",
    });

    expect(calls.errors).toEqual([
      ["root.server", "Request validation failed"],
      ["root.server", "The form could not be saved."],
    ]);
    expect(
      getRootFormErrorMessage({
        root: {
          server: {
            message: "Request validation failed",
          },
        },
      }),
    ).toBe("Request validation failed");
  });
});

function createSetErrorCalls<TValues extends FieldValues>() {
  const errors: Array<[string, string | undefined]> = [];
  const setError: UseFormSetError<TValues> = (name, error) => {
    errors.push([String(name), error.message]);
  };

  return { errors, setError };
}

it.each([401, 403, 500, 503])(
  "never displays diagnostic JSON from HTTP %s as validation feedback",
  (status) => {
    const calls = createSetErrorCalls<TestValues>();
    const error = {
      status,
      details: {
        ...validationError,
        message: "private diagnostics",
        fieldErrors: [{ field: "email", message: "private field diagnostics" }],
      },
    };
    applyAdminApiValidationErrors(error, calls.setError, {
      fieldNames: ["email"],
      fallbackMessage: "Please try again later.",
    });
    expect(calls.errors).toEqual([["root.server", "Please try again later."]]);
  },
);
