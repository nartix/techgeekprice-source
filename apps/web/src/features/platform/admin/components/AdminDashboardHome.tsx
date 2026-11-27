"use client";

import { Card, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
  IconArrowRight,
  IconFolder,
  IconUsers,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Link } from "../../../../i18n/navigation";
import { adminResources } from "../resources/adminResources";
import type {
  AdminIdentity,
  AdminResourceGroupKey,
  AdminResourceMetadata,
} from "../types/admin.types";
import { canReadAdminResource } from "../utils/adminPermissions";
import classes from "./AdminShell.module.css";

type Locale = "en-CA" | "en-US" | "fr-CA";

const groupOrder = [
  "products",
  "pages",
] as const satisfies readonly AdminResourceGroupKey[];
const icons = {
  productCategories: IconFolder,
  users: IconUsers,
} satisfies Record<AdminResourceMetadata["icon"], typeof IconFolder>;

interface AdminDashboardHomeProps {
  identity: AdminIdentity | null;
  locale: Locale;
}

export function AdminDashboardHome({
  identity,
  locale,
}: AdminDashboardHomeProps) {
  const t = useTranslations("Admin");
  const visibleResources = adminResources.filter((resource) =>
    canReadAdminResource(identity, resource.name),
  );

  return (
    <Stack className={classes.dashboardHome} gap="xl">
      <header>
        <Title order={1} className={classes.dashboardTitle}>
          {t("Overview.title")}
        </Title>
        <Text className={classes.dashboardIntro}>
          {t("Overview.description")}
        </Text>
      </header>
      {groupOrder.map((group) => {
        const resources = visibleResources.filter(
          (resource) => (resource.groupKey ?? "pages") === group,
        );
        if (resources.length === 0) return null;

        const groupHeading = `dashboard-group-${group}`;
        return (
          <section key={group} aria-labelledby={groupHeading}>
            <Title
              id={groupHeading}
              order={2}
              className={classes.dashboardGroupTitle}
            >
              {t(`Overview.groups.${group}.title`)}
            </Title>
            <Text className={classes.dashboardGroupDescription} size="sm">
              {t(`Overview.groups.${group}.description`)}
            </Text>
            <div className={classes.dashboardGrid}>
              {resources.map((resource) => {
                const Icon = icons[resource.icon];
                const cardId = `dashboard-${resource.name}`;
                return (
                  <Card
                    key={resource.name}
                    component={Link}
                    href={resource.list}
                    locale={locale}
                    prefetch={false}
                    aria-labelledby={cardId}
                    aria-describedby={`${cardId}-description`}
                    className={classes.dashboardCard}
                    withBorder
                    radius="md"
                  >
                    <Group
                      justify="space-between"
                      align="flex-start"
                      wrap="nowrap"
                    >
                      <ThemeIcon
                        className={classes.dashboardCardIcon}
                        size={36}
                        radius="md"
                        variant="light"
                      >
                        <Icon aria-hidden="true" size={21} stroke={1.65} />
                      </ThemeIcon>
                      <IconArrowRight
                        className={classes.dashboardArrow}
                        aria-hidden="true"
                        size={17}
                        stroke={1.65}
                      />
                    </Group>
                    <Title
                      order={3}
                      id={cardId}
                      className={classes.dashboardCardTitle}
                    >
                      {t(`Navigation.${resource.name}`)}
                    </Title>
                    <Text
                      id={`${cardId}-description`}
                      className={classes.dashboardCardDescription}
                      size="sm"
                    >
                      {t(`Overview.resources.${resource.name}`)}
                    </Text>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
      {visibleResources.length === 0 && (
        <Text className={classes.dashboardEmpty}>{t("Overview.empty")}</Text>
      )}
    </Stack>
  );
}
