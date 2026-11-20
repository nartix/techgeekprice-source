"use client";

import { Alert, Button, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconArrowLeft,
  IconInfoCircle,
  IconRefresh,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../../../../i18n/navigation";
import type {
  AdminLocale,
  CategoryCapabilitiesState,
} from "../../types/category-admin.types";

interface SmallCategoryTreeToolbarProps {
  capabilitiesState: CategoryCapabilitiesState;
  isRefreshing?: boolean;
  listHref: string;
  locale: AdminLocale;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onRefresh: () => void;
}

export function SmallCategoryTreeToolbar({
  capabilitiesState,
  isRefreshing = false,
  listHref,
  locale,
  onCollapseAll,
  onExpandAll,
  onRefresh,
}: SmallCategoryTreeToolbarProps) {
  const t = useTranslations("Admin.ProductCategories.tree");
  const orderingMessage = getOrderingMessage(capabilitiesState, t);

  return (
    <Stack
      aria-label={t("title")}
      component="section"
      gap="xs"
      data-density="compact"
    >
      <Group align="flex-start" justify="space-between" gap="xs" wrap="wrap">
        <Stack gap={2} className="min-w-0">
          <Title order={1} size="h4">
            {t("title")}
          </Title>
          <Text c="dimmed" size="xs">
            {t("description")}
          </Text>
        </Stack>
        <Group gap="xs" wrap="wrap">
          <Button
            component={Link}
            href={listHref}
            leftSection={<IconArrowLeft aria-hidden="true" size={16} />}
            locale={locale}
            size="xs"
            variant="default"
          >
            {t("actions.backToList")}
          </Button>
          <Button
            leftSection={<IconRefresh aria-hidden="true" size={16} />}
            loading={isRefreshing}
            size="xs"
            variant="light"
            onClick={onRefresh}
          >
            {t("actions.refresh")}
          </Button>
          <Button
            leftSection={<IconArrowsMaximize aria-hidden="true" size={16} />}
            size="xs"
            variant="light"
            onClick={onExpandAll}
          >
            {t("actions.expandAll")}
          </Button>
          <Button
            leftSection={<IconArrowsMinimize aria-hidden="true" size={16} />}
            size="xs"
            variant="light"
            onClick={onCollapseAll}
          >
            {t("actions.collapseAll")}
          </Button>
        </Group>
      </Group>
      <Alert color="blue" icon={<IconInfoCircle aria-hidden="true" />} p="xs">
        <Stack gap={2}>
          <Text size="xs">{t("smallTreeWarning")}</Text>
          <Text size="xs">{orderingMessage}</Text>
        </Stack>
      </Alert>
    </Stack>
  );
}

function getOrderingMessage(
  state: CategoryCapabilitiesState,
  t: ReturnType<typeof useTranslations>,
): string {
  if (state.status === "loading") {
    return t("ordering.loading");
  }

  if (state.status === "error") {
    return t("ordering.error");
  }

  if (!state.capabilities.ordering.rankingEnabled) {
    return t("ordering.unranked");
  }

  return state.capabilities.ordering.rankExposed
    ? t("ordering.rankedExposed")
    : t("ordering.rankedHidden");
}
