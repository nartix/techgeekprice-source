import type { FieldValues } from "react-hook-form";

import type {
  AdminFormAction,
  AdminFormConfig,
  AdminFormField,
  AdminFormSection,
} from "../types/admin-form.types";
import {
  canRenderAdminField,
  canRenderAdminSection,
  createAdminFormRuntimeContext,
} from "./adminFormVisibility";

export function getAdminFormFieldNames<TValues extends FieldValues>(
  config: { sections: Array<AdminFormSection<TValues>> },
): Array<AdminFormField<TValues>["name"]> {
  return config.sections.flatMap((section) =>
    section.fields.map((field) => field.name),
  );
}

export function createAdminFormSubmitValues<TValues extends FieldValues>(
  values: TValues,
  config: {
    hiddenSubmitBehavior?: "omit" | "preserve-existing-edit-value" | "submit";
    sections: Array<AdminFormSection<TValues>>;
  },
  args: {
    mode: AdminFormAction;
    hiddenFieldNames?: string[];
  },
): TValues {
  const payload = { ...values };
  const hiddenFields = new Set(args.hiddenFieldNames ?? []);

  for (const key of Object.keys(payload)) {
    if (key.endsWith("ManuallyEdited")) {
      delete payload[key as keyof TValues];
    }
  }

  for (const field of config.sections.flatMap((section) => section.fields)) {
    if (field.uiOnly || String(field.name).endsWith("ManuallyEdited")) {
      delete payload[field.name as keyof TValues];
      continue;
    }

    const behavior =
      field.hiddenSubmitBehavior ?? config.hiddenSubmitBehavior ?? "omit";

    if (hiddenFields.has(field.name) && behavior === "omit") {
      delete payload[field.name as keyof TValues];
    }
  }

  return payload;
}

export function getHiddenAdminFormFieldNames<
  TValues extends FieldValues,
  TCreateRequest,
  TUpdateRequest,
  TRecord,
>(
  config: AdminFormConfig<TValues, TCreateRequest, TUpdateRequest, TRecord>,
  args: {
    mode: AdminFormAction;
    permissions: string[];
    record?: TRecord;
    roles: string[];
    values: TValues;
  },
): string[] {
  const hiddenFieldNames: string[] = [];

  for (const section of config.sections) {
    const sectionVisible = canRenderAdminSection(
      section,
      createAdminFormRuntimeContext({
        mode: args.mode,
        permissions: args.permissions,
        record: args.record,
        roles: args.roles,
        values: args.values,
      }),
    );

    for (const field of section.fields) {
      const fieldVisible =
        sectionVisible &&
        canRenderAdminField(
          field,
          createAdminFormRuntimeContext({
            fieldPath: field.name,
            mode: args.mode,
            permissions: args.permissions,
            record: args.record,
            roles: args.roles,
            values: args.values,
          }),
        );

      if (!fieldVisible) {
        hiddenFieldNames.push(String(field.name));
      }
    }
  }

  return hiddenFieldNames;
}
