import { Alert, Button, Group, Text } from "@mantine/core";
import { IconRefreshAlert } from "@tabler/icons-react";

interface AdminConflictAlertProps {
  title: string;
  message: string;
  reloadLabel: string;
  onReloadLatest: () => void;
}

export function AdminConflictAlert({
  title,
  message,
  reloadLabel,
  onReloadLatest,
}: AdminConflictAlertProps) {
  return (
    <Alert
      color="orange"
      icon={<IconRefreshAlert aria-hidden="true" />}
      title={title}
    >
      <Group align="center" justify="space-between" gap="md">
        <Text>{message}</Text>
        <Button color="orange" variant="light" onClick={onReloadLatest}>
          {reloadLabel}
        </Button>
      </Group>
    </Alert>
  );
}
