export function resolveCategoryOperationalLimit(
  preference: number | undefined,
  backendMaximum: number | null,
): number | undefined {
  if (preference === undefined) return undefined;

  return backendMaximum === null
    ? preference
    : Math.min(preference, backendMaximum);
}
