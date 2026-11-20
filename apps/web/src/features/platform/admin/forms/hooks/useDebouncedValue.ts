import { useEffect, useState } from "react";

export const ADMIN_FORM_DEFAULT_DEBOUNCE_MS = 400;

export function useDebouncedValue<TValue>(
  value: TValue,
  delay = ADMIN_FORM_DEFAULT_DEBOUNCE_MS,
): TValue {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
