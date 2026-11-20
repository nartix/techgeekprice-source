export type CategoryIdentifierResult<TValue> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly reason: "invalid-identifier" };

export interface CategoryIdentifierAdapter<TApiIdentifier> {
  readonly profile: "NUMERIC_LONG_V1";
  serialize(value: TApiIdentifier): CategoryIdentifierResult<string>;
  parse(value: string): CategoryIdentifierResult<TApiIdentifier>;
}

const invalidIdentifierResult = {
  ok: false,
  reason: "invalid-identifier",
} as const;

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export const numericLongV1CategoryIdentifierAdapter = Object.freeze<
  CategoryIdentifierAdapter<number>
>({
  profile: "NUMERIC_LONG_V1",
  serialize(value: number) {
    return isPositiveSafeInteger(value)
      ? { ok: true as const, value: String(value) }
      : invalidIdentifierResult;
  },
  parse(value: string) {
    if (!/^[1-9]\d*$/.test(value)) {
      return invalidIdentifierResult;
    }

    const parsed = Number(value);

    return isPositiveSafeInteger(parsed)
      ? { ok: true as const, value: parsed }
      : invalidIdentifierResult;
  },
});
