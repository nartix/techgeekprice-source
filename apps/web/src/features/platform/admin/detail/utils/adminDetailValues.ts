import type {
  AdminDetailField,
  AdminDetailFieldRenderContext,
  AdminDetailRenderable,
  AdminDetailResolvedValue,
} from "../types/admin-detail.types";

export function resolveAdminDetailFieldValue<TRaw, TView>(
  field: AdminDetailField<TRaw, TView>,
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): AdminDetailResolvedValue {
  if (field.value) {
    return field.value(context);
  }

  if (field.valueKey) {
    return context.record[field.valueKey] as AdminDetailResolvedValue;
  }

  return undefined;
}

export function renderAdminDetailFieldValue<TRaw, TView>(
  field: AdminDetailField<TRaw, TView>,
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): AdminDetailRenderable {
  const value = resolveAdminDetailFieldValue(field, context);
  const nextContext = {
    ...context,
    field,
    value,
  };

  return field.render
    ? field.render(nextContext)
    : normalizeAdminDetailDisplayValue(value, field.emptyFallback);
}

export function normalizeAdminDetailDisplayValue(
  value: AdminDetailResolvedValue,
  emptyFallback = "",
): string {
  if (value === null || value === undefined) {
    return emptyFallback;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value || emptyFallback;
  }

  return String(value);
}
