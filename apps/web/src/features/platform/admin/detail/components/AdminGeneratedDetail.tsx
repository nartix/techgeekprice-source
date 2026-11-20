"use client";

import { Alert, Group, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import type { BaseRecord } from "@refinedev/core";

import { AdminErrorState } from "../../components/AdminErrorState";
import { AdminForbidden } from "../../components/AdminForbidden";
import { AdminLoading } from "../../components/AdminLoading";
import type {
  AdminDetailActionNotification,
  AdminResourceDetailResult,
} from "../types/admin-detail.types";
import { useAdminResourceDetailViewResult } from "../hooks/useAdminResourceDetailViewResult";
import { AdminDetailActions } from "./AdminDetailActions";
import { AdminDetailPanel } from "./AdminDetailPanel";
import { AdminDetailSection } from "./AdminDetailSection";

interface AdminGeneratedDetailProps<TRaw extends BaseRecord, TView> {
  notify?: (notification: AdminDetailActionNotification) => void;
  redirect?: (href: string) => void;
  result: AdminResourceDetailResult<TRaw, TView>;
}

export function AdminGeneratedDetail<TRaw extends BaseRecord, TView>({
  notify,
  redirect,
  result,
}: AdminGeneratedDetailProps<TRaw, TView>) {
  const view = useAdminResourceDetailViewResult(result);

  if (view.state === "forbidden") {
    return (
      <AdminForbidden
        title={view.labels.forbiddenTitle}
        message={view.labels.forbiddenMessage}
      />
    );
  }

  if (view.state === "loading") {
    return <AdminLoading label={view.labels.loading} />;
  }

  if (view.state === "invalid") {
    return (
      <SafeDetailAlert
        color="yellow"
        message={view.labels.invalidMessage}
        title={view.labels.invalidTitle}
      />
    );
  }

  if (view.state === "not-found") {
    return (
      <SafeDetailAlert
        color="yellow"
        message={view.labels.notFoundMessage}
        title={view.labels.notFoundTitle}
      />
    );
  }

  if (view.state === "error") {
    return (
      <AdminErrorState
        title={view.labels.errorTitle}
        message={view.labels.errorMessage}
        retryLabel={view.onRetry ? view.labels.retry : undefined}
        onRetry={view.onRetry}
      />
    );
  }

  if (view.state === "empty") {
    return (
      <SafeDetailAlert
        color="blue"
        icon="info"
        message={view.labels.emptyMessage}
        title={view.labels.emptyTitle}
      />
    );
  }

  if (!view.baseContext) {
    return (
      <AdminErrorState
        title={view.labels.errorTitle}
        message={view.labels.errorMessage}
        retryLabel={view.onRetry ? view.labels.retry : undefined}
        onRetry={view.onRetry}
      />
    );
  }

  const baseContext = view.baseContext;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" gap="md">
        <div>
          <Title order={2}>{view.title}</Title>
          {view.description ? <Text c="dimmed">{view.description}</Text> : null}
        </div>
        <AdminDetailActions
          actions={view.actions}
          context={baseContext}
          notify={notify}
          redirect={redirect}
          refetch={view.onRetry}
        />
      </Group>
      {view.sections.map((section) => (
        <AdminDetailSection key={section.id} section={section} />
      ))}
      {view.panels.map((panel) => (
        <AdminDetailPanel
          key={panel.id}
          context={baseContext}
          panel={panel}
        />
      ))}
    </Stack>
  );
}

function SafeDetailAlert({
  color,
  icon = "warning",
  message,
  title,
}: {
  color: "blue" | "yellow";
  icon?: "info" | "warning";
  message: string;
  title: string;
}) {
  const Icon = icon === "info" ? IconInfoCircle : IconAlertTriangle;

  return (
    <Alert color={color} icon={<Icon aria-hidden="true" />} title={title}>
      <Text>{message}</Text>
    </Alert>
  );
}
