"use client";

import { Button, Group, Modal, Stack, Text } from "@mantine/core";

interface AdminConfirmDialogProps {
  opened: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AdminConfirmDialog({
  opened,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onCancel,
  onConfirm,
}: AdminConfirmDialogProps) {
  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <Stack gap="md">
        <Text>{message}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            color={destructive ? "red" : "blue"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
