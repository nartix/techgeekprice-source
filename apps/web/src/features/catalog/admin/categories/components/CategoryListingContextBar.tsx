"use client";

import { Alert, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../../../i18n/navigation";
import { createCategoryScopeHref } from "../category-listing-scope";
import type {
  AdminLocale,
  CategoryCapabilitiesState,
  CategoryListingScope,
} from "../types/category-admin.types";

interface CategoryListingContextBarProps {
  capabilitiesState: CategoryCapabilitiesState;
  listHref?: string;
  locale: AdminLocale;
  rootScopeAvailable?: boolean;
  scope: CategoryListingScope;
  treeHref?: string;
  treeAvailable?: boolean;
}

export function CategoryListingContextBar({
  capabilitiesState,
  listHref = "/admin/products/categories",
  locale,
  rootScopeAvailable = true,
  scope,
  treeHref = "/admin/products/categories/tree",
  treeAvailable = true,
}: CategoryListingContextBarProps) {
  const t = useTranslations("Admin.ProductCategories.scope");
  const capabilityMessage = getCapabilityMessage(capabilitiesState, t);

  return (
    <Stack
      aria-label={t("contextAriaLabel")}
      component="section"
      gap="sm"
      className="min-w-0"
    >
      <Group align="flex-start" justify="space-between" gap="sm" wrap="wrap">
        <Stack gap={2} className="min-w-0">
          <Title order={2} size="h4">
            {scope.mode === "all"
              ? t("allTitle")
              : scope.mode === "root"
                ? t("rootTitle")
                : t("childrenTitle", { parentId: scope.parentId })}
          </Title>
          <Text c="dimmed" size="sm">
            {scope.mode === "all"
              ? t("allDescription")
              : scope.mode === "root"
                ? t("rootDescription")
                : t("childrenDescription")}
          </Text>
        </Stack>
        <Group gap="xs" wrap="wrap">
          <Button
            component={Link}
            href={listHref}
            locale={locale}
            size="xs"
            variant={scope.mode === "all" ? "filled" : "light"}
          >
            {t("allAction")}
          </Button>
          {rootScopeAvailable ? (
            <Button
              component={Link}
              href={createCategoryScopeHref(0, listHref)}
              locale={locale}
              size="xs"
              variant={scope.mode === "root" ? "filled" : "light"}
            >
              {t("rootAction")}
            </Button>
          ) : (
            <Button
              disabled
              size="xs"
              variant={scope.mode === "root" ? "filled" : "light"}
            >
              {t("rootAction")}
            </Button>
          )}
          {treeAvailable ? (
            <Button component={Link} href={treeHref} locale={locale} size="xs" variant="light">
              {t("treeAction")}
            </Button>
          ) : (
            <Button disabled size="xs" variant="light">
              {t("treeAction")}
            </Button>
          )}
        </Group>
      </Group>
      {capabilityMessage ? (
        <Alert
          color={capabilityMessage.color}
          icon={
            capabilityMessage.color === "yellow" ? (
              <IconAlertTriangle aria-hidden="true" />
            ) : (
              <IconInfoCircle aria-hidden="true" />
            )
          }
          variant="light"
        >
          {capabilityMessage.message}
        </Alert>
      ) : null}
    </Stack>
  );
}

function getCapabilityMessage(
  state: CategoryCapabilitiesState,
  t: ReturnType<typeof useTranslations>,
): { color: "blue" | "yellow"; message: string } | null {
  if (state.status === "loading") {
    return { color: "blue", message: t("capabilitiesLoading") };
  }

  if (state.status === "error") {
    return { color: "yellow", message: t("capabilitiesError") };
  }

  if (!state.capabilities.rankingEnabled || !state.capabilities.sortRankExposed) {
    return { color: "blue", message: t("rankingUnavailable") };
  }

  return null;
}
