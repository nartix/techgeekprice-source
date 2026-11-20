import { Alert, Button, Stack, Text } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";

interface AdminForbiddenProps {
  title: string;
  message: string;
  homeLabel?: string;
  onHome?: () => void;
}

export function AdminForbidden({
  title,
  message,
  homeLabel,
  onHome,
}: AdminForbiddenProps) {
  return (
    <Alert color="yellow" icon={<IconLock aria-hidden="true" />} title={title}>
      <Stack gap="sm">
        <Text>{message}</Text>
        {homeLabel && onHome ? (
          <Button color="yellow" variant="light" onClick={onHome}>
            {homeLabel}
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}
