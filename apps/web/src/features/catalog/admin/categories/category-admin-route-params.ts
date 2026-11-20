export function parseCategoryRouteId(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const numericValue = Number(trimmed);

  if (!Number.isSafeInteger(numericValue) || numericValue <= 0) {
    return null;
  }

  return String(numericValue);
}
