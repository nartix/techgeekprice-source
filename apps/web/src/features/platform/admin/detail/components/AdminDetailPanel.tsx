"use client";

import { Alert, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";

import type {
  AdminDetailBaseContext,
  AdminDetailPanel as AdminDetailPanelDefinition,
} from "../types/admin-detail.types";
import { useAdminDetailPanel } from "../hooks/useAdminDetailPanel";

interface AdminDetailPanelProps<TRaw extends BaseRecord, TView> {
  context: AdminDetailBaseContext<TRaw, TView>;
  panel: AdminDetailPanelDefinition<TRaw, TView>;
}

export function AdminDetailPanel<TRaw extends BaseRecord, TView>({
  context,
  panel,
}: AdminDetailPanelProps<TRaw, TView>) {
  const result = useAdminDetailPanel({ context, panel });

  if (result.state === "unsupported") {
    return null;
  }

  if (result.state === "loading") {
    return (
      <PanelFrame description={panel.description} title={panel.title}>
        <Text c="dimmed">{panel.labels.loading}</Text>
      </PanelFrame>
    );
  }

  if (result.state === "error") {
    return (
      <PanelFrame description={panel.description} title={panel.title}>
        <Alert
          color="red"
          icon={<IconAlertTriangle aria-hidden="true" />}
          title={panel.labels.errorTitle}
        >
          {panel.labels.errorMessage}
        </Alert>
      </PanelFrame>
    );
  }

  if (result.state === "empty") {
    return (
      <PanelFrame description={panel.description} title={panel.title}>
        <Text c="dimmed">{panel.labels.empty}</Text>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame description={panel.description} title={panel.title}>
      {panel.render({ ...context, data: result.data } as never)}
    </PanelFrame>
  );
}

function PanelFrame({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <Stack component="section" gap="sm">
      <div>
        <Title order={3} size="h4">
          {title}
        </Title>
        {description ? (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        ) : null}
      </div>
      {children}
    </Stack>
  );
}
