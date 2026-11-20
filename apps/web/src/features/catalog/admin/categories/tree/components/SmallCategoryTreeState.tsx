"use client";

import { Alert, Button, Group, Loader, Stack, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconLock,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../../../../i18n/navigation";
import type { AdminLocale } from "../../types/category-admin.types";
import type { SmallCategoryTreeState as SmallCategoryTreeStateValue } from "../hooks/useSmallCategoryTree";

interface SmallCategoryTreeStateProps {
  listHref: string;
  locale: AdminLocale;
  state: SmallCategoryTreeStateValue;
  onRetry?: () => void;
}

export function SmallCategoryTreeState({
  listHref,
  locale,
  state,
  onRetry,
}: SmallCategoryTreeStateProps) {
  const t = useTranslations("Admin.ProductCategories.tree");

  if (state.status === "loading") {
    return (
      <Group align="center" gap="sm" role="status">
        <Loader size="sm" />
        <Text>{t("states.loading")}</Text>
      </Group>
    );
  }

  if (state.status === "empty") {
    return (
      <Alert color="blue" icon={<IconCircleCheck aria-hidden="true" />}>
        <Stack gap={4}>
          <Text fw={600}>{t("states.emptyTitle")}</Text>
          <Text>{t("states.emptyMessage")}</Text>
        </Stack>
      </Alert>
    );
  }

  if (state.status === "too-large") {
    return (
      <Alert color="yellow" icon={<IconAlertTriangle aria-hidden="true" />}>
        <Stack gap="xs">
          <Text fw={600}>{t("states.tooLargeTitle")}</Text>
          <Text>{t("states.tooLargeMessage")}</Text>
          <Group>
            <Button
              component={Link}
              href={listHref}
              locale={locale}
              size="xs"
              variant="light"
            >
              {t("actions.openList")}
            </Button>
          </Group>
        </Stack>
      </Alert>
    );
  }

  if (state.status === "unauthorized" || state.status === "forbidden") {
    const namespace =
      state.status === "unauthorized" ? "unauthorized" : "forbidden";

    return (
      <Alert color="red" icon={<IconLock aria-hidden="true" />}>
        <Stack gap="xs">
          <Text fw={600}>{t(`states.${namespace}Title`)}</Text>
          <Text>{t(`states.${namespace}Message`)}</Text>
          <Button
            component={Link}
            href={listHref}
            locale={locale}
            size="xs"
            variant="light"
          >
            {t("actions.openList")}
          </Button>
        </Stack>
      </Alert>
    );
  }

  if (state.status === "incomplete-response" || state.status === "error") {
    const namespace =
      state.status === "incomplete-response" ? "incomplete" : "error";

    return (
      <Alert color="red" icon={<IconAlertTriangle aria-hidden="true" />}>
        <Stack gap="xs">
          <Text fw={600}>{t(`states.${namespace}Title`)}</Text>
          <Text>{t(`states.${namespace}Message`)}</Text>
          <Group>
            {state.error.retryable && onRetry ? (
              <Button size="xs" variant="light" onClick={onRetry}>
                {t("actions.retry")}
              </Button>
            ) : null}
            <Button
              component={Link}
              href={listHref}
              locale={locale}
              size="xs"
              variant="default"
            >
              {t("actions.openList")}
            </Button>
          </Group>
        </Stack>
      </Alert>
    );
  }

  return null;
}
