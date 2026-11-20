export function getAdminDetailErrorStatus(error: unknown): number | undefined {
  const candidates = [
    getObjectValue(error, "status"),
    getObjectValue(error, "statusCode"),
    getObjectValue(getObjectValue(error, "response"), "status"),
    getObjectValue(getObjectValue(error, "details"), "status"),
    getObjectValue(getObjectValue(error, "data"), "status"),
    getObjectValue(
      getObjectValue(getObjectValue(error, "response"), "data"),
      "status",
    ),
  ];

  for (const candidate of candidates) {
    const status = normalizeStatus(candidate);

    if (status) {
      return status;
    }
  }

  return undefined;
}

export function isAdminDetailNotFoundError(error: unknown): boolean {
  return getAdminDetailErrorStatus(error) === 404;
}

export function getSafeAdminDetailErrorCopy(
  error: unknown,
  labels: {
    errorMessage: string;
    notFoundMessage: string;
  },
): string {
  return isAdminDetailNotFoundError(error)
    ? labels.notFoundMessage
    : labels.errorMessage;
}

function normalizeStatus(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    return Number.isInteger(parsed) ? parsed : undefined;
  }

  return undefined;
}

function getObjectValue(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  return (source as Record<string, unknown>)[key];
}
