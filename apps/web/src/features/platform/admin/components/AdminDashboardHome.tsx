"use client";

import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconFolder, IconUsers } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Link } from "../../../../i18n/navigation";
import classes from "./AdminShell.module.css";
import { adminResources } from "../resources/adminResources";
import type { AdminIdentity } from "../types/admin.types";
import { canPerformAdminAction } from "../utils/adminPermissions";

type Locale = "en-CA" | "en-US" | "fr-CA";

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
    canPerformAdminAction(identity, resource.name, "list"),
  );

  return (
    <Stack className={classes.dashboardHome} gap="md">
      <Title order={2}>{t("Metadata.dashboardTitle")}</Title>
      <div className={classes.dashboardGrid}>
        {visibleResources.map((resource) => (
          <Card
            className={classes.dashboardCard}
            withBorder
            key={resource.name}
            radius="md"
          >
            <Stack className={classes.dashboardCardContent} gap="sm">
              <Group
                align="flex-start"
                className={classes.dashboardCardHeader}
                justify="space-between"
                wrap="nowrap"
              >
                <Title
                  className={classes.dashboardCardTitle}
                  order={3}
                  size="h4"
                >
                  {t(`${capitalize(resource.name)}.title` as never)}
                </Title>
                <ThemeIcon
                  className={classes.dashboardCardIcon}
                  radius="md"
                  size="lg"
                  variant="light"
                >
                  {getResourceIcon(resource.icon)}
                </ThemeIcon>
              </Group>
              <Text className={classes.dashboardCardDescription}>
                {t(`${capitalize(resource.name)}.description` as never)}
              </Text>
              <Button
                className={classes.dashboardCardAction}
                component={Link}
                href={resource.list}
                locale={locale}
                variant="light"
              >
                {t("Actions.show")}
              </Button>
            </Stack>
          </Card>
        ))}
      </div>
    </Stack>
  );
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function getResourceIcon(icon: "productCategories" | "users"): ReactNode {
  if (icon === "productCategories") {
    return <IconFolder aria-hidden="true" size={18} />;
  }

  return <IconUsers aria-hidden="true" size={18} />;
}
