"use client";

import {
  Anchor,
  Alert,
  Breadcrumbs,
  Button,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../../../i18n/navigation";
import { createCategoryScopeHref } from "../category-listing-scope";
import type {
  AdminLocale,
  CategoryBreadcrumbState,
  CategoryListingScope,
} from "../types/category-admin.types";

interface CategoryBreadcrumbsProps {
  listHref?: string;
  locale: AdminLocale;
  onRetry?: () => void;
  scope: CategoryListingScope;
  state: CategoryBreadcrumbState;
}

export function CategoryBreadcrumbs({
  listHref = "/admin/products/categories",
  locale,
  onRetry,
  scope,
  state,
}: CategoryBreadcrumbsProps) {
  const t = useTranslations("Admin.ProductCategories.breadcrumbs");

  if (scope.mode !== "children") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <Group component="section" gap="xs" aria-live="polite">
        <Loader size="xs" />
        <Text size="sm">{t("loading")}</Text>
      </Group>
    );
  }

  if (state.status === "error" || state.status === "not-found") {
    return (
      <Alert
        color="yellow"
        icon={<IconAlertTriangle aria-hidden="true" />}
        title={state.status === "not-found" ? t("notFoundTitle") : t("errorTitle")}
      >
        <Stack gap="xs">
          <Text size="sm">
            {state.status === "not-found"
              ? t("notFoundMessage")
              : t("errorMessage")}
          </Text>
          <Group gap="xs" wrap="wrap">
            {onRetry && state.status === "error" ? (
              <Button size="xs" variant="light" onClick={onRetry}>
                {t("retry")}
              </Button>
            ) : null}
            <Button
              component={Link}
              href={listHref}
              locale={locale}
              size="xs"
              variant="default"
            >
              {t("allRecovery")}
            </Button>
            <Button
              component={Link}
              href={createCategoryScopeHref(0, listHref)}
              locale={locale}
              size="xs"
              variant="default"
            >
              {t("rootRecovery")}
            </Button>
          </Group>
        </Stack>
      </Alert>
    );
  }

  if (state.status !== "ready") {
    return null;
  }

  return (
    <nav aria-label={t("ariaLabel")} className="min-w-0">
      <Breadcrumbs>
        <Anchor
          component={Link}
          href={createCategoryScopeHref(0, listHref)}
          locale={locale}
        >
          {t("root")}
        </Anchor>
        {state.items.map((item, index) => {
          const isCurrent = index === state.items.length - 1;

          return isCurrent ? (
            <Text component="span" fw={600} key={item.id}>
              {item.name}
            </Text>
          ) : (
            <Anchor
              component={Link}
              href={createCategoryScopeHref(item.id, listHref)}
              key={item.id}
              locale={locale}
            >
              {item.name}
            </Anchor>
          );
        })}
      </Breadcrumbs>
    </nav>
  );
}
