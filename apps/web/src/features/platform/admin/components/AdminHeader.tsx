"use client";

import { ActionIcon, Group, Title } from "@mantine/core";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";

import classes from "./AdminShell.module.css";

interface AdminHeaderProps {
  menuControl: "navigation" | "sidebar";
  menuOpened: boolean;
  menuLabel: string;
  onMenuToggle: () => void;
  title: string;
}

export function AdminHeader({
  menuControl,
  menuOpened,
  menuLabel,
  onMenuToggle,
  title,
}: AdminHeaderProps) {
  const MenuIcon = getMenuIcon(menuControl, menuOpened);
  const menuExpanded = menuControl === "sidebar" ? !menuOpened : menuOpened;

  return (
    <Group className={classes.headerContent} justify="space-between">
      <Group gap="sm">
        <ActionIcon
          aria-expanded={menuExpanded}
          aria-label={menuLabel}
          className={classes.headerMenuButton}
          onClick={onMenuToggle}
          size="lg"
          variant="subtle"
        >
          <MenuIcon aria-hidden="true" size={22} />
        </ActionIcon>
        <Title className={classes.headerTitle} order={1} size="h3">
          {title}
        </Title>
      </Group>
    </Group>
  );
}

function getMenuIcon(
  menuControl: AdminHeaderProps["menuControl"],
  menuOpened: boolean,
) {
  if (menuControl === "sidebar") {
    return menuOpened
      ? IconLayoutSidebarLeftExpand
      : IconLayoutSidebarLeftCollapse;
  }

  return menuOpened ? IconX : IconMenu2;
}
