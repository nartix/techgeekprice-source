import type { FieldValues } from "react-hook-form";

export function getAdminFormDefaultValues<TValues extends FieldValues>(
  defaultValues: Partial<TValues> | (() => Partial<TValues>),
): Partial<TValues> {
  const resolved =
    typeof defaultValues === "function" ? defaultValues() : defaultValues;

  return cloneFormValues(resolved);
}

export function mergeAdminFormEditValues<TValues extends FieldValues>(
  defaultValues: Partial<TValues>,
  editValues: Partial<TValues>,
): TValues {
  return {
    ...cloneFormValues(defaultValues),
    ...cloneFormValues(editValues),
  } as TValues;
}

function cloneFormValues<TValues extends FieldValues>(
  values: Partial<TValues>,
): Partial<TValues> {
  if (Array.isArray(values)) {
    return [...values] as unknown as Partial<TValues>;
  }

  return { ...values };
}
