import { Alert, Button, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface AdminErrorStateProps {
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function AdminErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: AdminErrorStateProps) {
  return (
    <Alert
      color="red"
      icon={<IconAlertTriangle aria-hidden="true" />}
      title={title}
    >
      <Stack gap="sm">
        <Text>{message}</Text>
        {retryLabel && onRetry ? (
          <Button color="red" variant="light" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}
