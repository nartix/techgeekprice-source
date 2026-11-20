import { Button, Group } from "@mantine/core";
import type { ReactNode } from "react";

import { Link } from "../../../../../i18n/navigation";
import type { AdminFormAction } from "../types/admin-form.types";

interface AdminFormActionsProps {
  action: AdminFormAction;
  cancelHref?: string;
  cancelLabel?: string;
  disabled?: boolean;
  locale?: "en-CA" | "en-US" | "fr-CA";
  loading?: boolean;
  submitLabel?: string;
  extraActions?: ReactNode;
}

export function AdminFormActions({
  action,
  cancelHref,
  cancelLabel,
  disabled = false,
  extraActions,
  locale = "en-CA",
  loading = false,
  submitLabel,
}: AdminFormActionsProps) {
  return (
    <Group justify="space-between">
      {cancelHref && cancelLabel ? (
        <Button component={Link} href={cancelHref} locale={locale} variant="subtle">
          {cancelLabel}
        </Button>
      ) : (
        <span />
      )}
      <Group justify="flex-end">
        {extraActions}
        {action !== "show" ? (
          <Button disabled={disabled} loading={loading} type="submit">
            {submitLabel}
          </Button>
        ) : null}
      </Group>
    </Group>
  );
}
