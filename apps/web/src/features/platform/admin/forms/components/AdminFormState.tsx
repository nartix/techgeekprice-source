import { Alert, Button, Loader, Stack, Text } from "@mantine/core";

interface AdminFormStateProps {
  errorMessage?: string | null;
  errorTitle?: string;
  loading?: boolean;
  loadingMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  rootError?: string | null;
  successMessage?: string | null;
  successTitle?: string;
}

export function AdminFormState({
  errorMessage,
  errorTitle,
  loading = false,
  loadingMessage,
  onRetry,
  retryLabel,
  rootError,
  successMessage,
  successTitle,
}: AdminFormStateProps) {
  if (loading) {
    return (
      <Stack align="center" gap="sm" py="xl">
        <Loader />
        {loadingMessage ? <Text c="dimmed">{loadingMessage}</Text> : null}
      </Stack>
    );
  }

  return (
    <>
      {errorMessage || rootError ? (
        <Alert color="red" title={errorTitle}>
          <Stack gap="sm">
            <Text>{rootError ?? errorMessage}</Text>
            {onRetry && retryLabel ? (
              <Button onClick={onRetry} variant="light">
                {retryLabel}
              </Button>
            ) : null}
          </Stack>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert color="green" title={successTitle}>
          {successMessage}
        </Alert>
      ) : null}
    </>
  );
}
