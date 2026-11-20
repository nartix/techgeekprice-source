/** Cancellation is control flow, including signals aborted with custom reasons. */
export function throwIfRequestAborted(signal?: AbortSignal | null): void {
  if (signal?.aborted) {
    throw new DOMException("Request cancelled.", "AbortError");
  }
}

export function isRequestAbort(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}
