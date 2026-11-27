"use client";

import {
  ActionIcon,
  Avatar,
  Group,
  NavLink,
  Menu,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconSelector,
  IconCpu,
  IconFolder,
  IconGauge,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconUsers,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "../../../../i18n/navigation";
import classes from "./AdminShell.module.css";
import { adminResources } from "../resources/adminResources";
import type {
  AdminIdentity,
  AdminResourceGroupKey,
  AdminResourceMetadata,
} from "../types/admin.types";
import { canPerformAdminAction } from "../utils/adminPermissions";

type Locale = "en-CA" | "en-US" | "fr-CA";

const ADMIN_RESOURCE_GROUP_ORDER = [
  "products",
  "pages",
] as const satisfies AdminResourceGroupKey[];

interface AdminSidebarProps {
  collapsed?: boolean;
  identity: AdminIdentity | null;
  locale: Locale;
  logoutAction?: ReactNode;
  onCollapseToggle?: () => void;
  onNavigate?: () => void;
}

interface AdminSidebarNavItem {
  active: boolean;
  current: boolean;
  href: string;
  icon: ReactNode;
  key: string;
  label: string;
}

interface AdminSidebarNavGroup {
  items: AdminSidebarNavItem[];
  key: string;
  label: string;
}

export function AdminSidebar({
  collapsed = false,
  identity,
  locale,
  logoutAction,
  onCollapseToggle,
  onNavigate,
}: AdminSidebarProps) {
  const t = useTranslations("Admin.Navigation");
  const visibleResources = adminResources.filter((resource) =>
    canPerformAdminAction(identity, resource.name, "list"),
  );
  const toggleLabel = collapsed ? t("expandSidebar") : t("collapseSidebar");
  const currentPathname = useAdminPathname();
  const activeResource = adminResources
    .filter((resource) => isActiveAdminPath(currentPathname, resource.list))
    .sort((a, b) => b.list.length - a.list.length)[0];
  const dashboardItems = canPerformAdminAction(identity, "dashboard", "list")
    ? [
        {
          active: isActiveAdminPath(currentPathname, "/admin"),
          current: currentPathname === "/admin",
          href: "/admin",
          icon: <IconGauge aria-hidden="true" size={20} />,
          key: "dashboard",
          label: t("dashboard"),
        },
      ]
    : [];
  const resourceItemsByGroup = visibleResources.reduce<
    Record<AdminResourceGroupKey, AdminSidebarNavItem[]>
  >(
    (groups, resource) => {
      const groupKey = resource.groupKey ?? "pages";

      groups[groupKey].push({
        active: resource.name === activeResource?.name,
        current: currentPathname === resource.list,
        href: resource.list,
        icon: getResourceIcon(resource.icon),
        key: resource.name,
        label: t(resource.name),
      });

      return groups;
    },
    {
      pages: [],
      products: [],
    },
  );
  const resourceGroups = ADMIN_RESOURCE_GROUP_ORDER.map((groupKey) => ({
    items: resourceItemsByGroup[groupKey],
    key: groupKey,
    label: t(groupKey),
  }));
  const navigationGroups = [
    {
      items: dashboardItems,
      key: "general",
      label: t("general"),
    },
    ...resourceGroups,
  ].filter((group) => group.items.length > 0);

  return (
    <Stack
      align={collapsed ? "center" : "stretch"}
      className={`${classes.sidebar} ${
        collapsed ? classes.sidebarCollapsed : ""
      }`}
      gap="xs"
      h="100%"
    >
      <AdminSidebarProfile
        collapsed={collapsed}
        collapseLabel={toggleLabel}
        managementLabel={t("management")}
        onCollapseToggle={onCollapseToggle}
        title={t("admin")}
      />
      <Stack className={classes.navList} gap="md">
        {navigationGroups.map((group) => (
          <AdminSidebarGroup
            collapsed={collapsed}
            group={group}
            key={group.key}
            locale={locale}
            onNavigate={onNavigate}
          />
        ))}
      </Stack>
      <AdminSidebarUserInfo
        collapsed={collapsed}
        identity={identity}
        logoutAction={logoutAction}
        menuLabel={
          identity ? t("accountMenu", { username: identity.username }) : ""
        }
      />
    </Stack>
  );
}

interface AdminSidebarGroupProps {
  collapsed: boolean;
  group: AdminSidebarNavGroup;
  locale: Locale;
  onNavigate?: () => void;
}

function AdminSidebarGroup({
  collapsed,
  group,
  locale,
  onNavigate,
}: AdminSidebarGroupProps) {
  return (
    <Stack className={classes.navGroup} gap={2}>
      {collapsed ? null : (
        <Text className={classes.navGroupLabel} component="div" size="xs">
          {group.label}
        </Text>
      )}
      {group.items.map((item) => (
        <AdminSidebarLink
          active={item.active}
          collapsed={collapsed}
          current={item.current}
          href={item.href}
          icon={item.icon}
          key={item.key}
          label={item.label}
          locale={locale}
          onNavigate={onNavigate}
        />
      ))}
    </Stack>
  );
}

interface AdminSidebarProfileProps {
  collapsed: boolean;
  collapseLabel: string;
  managementLabel: string;
  onCollapseToggle?: () => void;
  title: string;
}

function AdminSidebarProfile({
  collapsed,
  collapseLabel,
  managementLabel,
  onCollapseToggle,
  title,
}: AdminSidebarProfileProps) {
  const ToggleIcon = collapsed
    ? IconLayoutSidebarLeftExpand
    : IconLayoutSidebarLeftCollapse;
  return (
    <Group className={classes.profilePanel} gap="xs" wrap="nowrap">
      {!collapsed && (
        <>
          <ThemeIcon className={classes.profileIcon} size={32} variant="filled">
            <IconCpu aria-hidden="true" size={20} stroke={1.65} />
          </ThemeIcon>
          <Stack gap={0} miw={0}>
            <Text className={classes.profileTitle} fw={650} size="sm">
              {title}
            </Text>
            <Text className={classes.profileSubtitle} size="xs">
              {managementLabel}
            </Text>
          </Stack>
        </>
      )}
      {onCollapseToggle && (
        <Tooltip
          label={collapseLabel}
          position="right"
          events={{ focus: true, hover: true, touch: false }}
        >
          <ActionIcon
            aria-expanded={!collapsed}
            aria-label={collapseLabel}
            className={classes.collapseButton}
            onClick={onCollapseToggle}
            size={36}
            type="button"
            variant="transparent"
          >
            <ToggleIcon aria-hidden="true" size={18} stroke={1.65} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}

interface AdminSidebarLinkProps {
  active: boolean;
  collapsed: boolean;
  current: boolean;
  href: string;
  icon: ReactNode;
  label: string;
  locale: Locale;
  onNavigate?: () => void;
}

function AdminSidebarLink({
  active,
  collapsed,
  current,
  href,
  icon,
  label,
  locale,
  onNavigate,
}: AdminSidebarLinkProps) {
  const linkClassName = [
    classes.sidebarLink,
    collapsed ? classes.sidebarLinkCollapsed : "",
  ]
    .filter(Boolean)
    .join(" ");
  const link = (
    <NavLink
      active={active}
      aria-label={label}
      aria-current={current ? "page" : active ? "location" : undefined}
      className={linkClassName}
      component={Link}
      href={href}
      label={collapsed ? undefined : label}
      leftSection={icon}
      locale={locale}
      onClick={onNavigate}
      styles={
        collapsed
          ? {
              body: { display: "none" },
              root: { justifyContent: "center", paddingInline: 0 },
              section: { marginInlineEnd: 0 },
            }
          : undefined
      }
    />
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip
      label={label}
      position="right"
      events={{ focus: true, hover: true, touch: false }}
    >
      {link}
    </Tooltip>
  );
}

interface AdminSidebarUserInfoProps {
  collapsed: boolean;
  identity: AdminIdentity | null;
  logoutAction?: ReactNode;
  menuLabel: string;
}

function AdminSidebarUserInfo({
  collapsed,
  identity,
  logoutAction,
  menuLabel,
}: AdminSidebarUserInfoProps) {
  if (!identity) {
    return null;
  }

  const roleLabel =
    identity.roles.length > 0
      ? identity.roles.join(", ")
      : identity.sessionScope;
  const accountLabel = `${identity.username}, ${roleLabel}`;
  const initials = getAdminIdentityInitials(identity.username);

  const userDetails = (
    <>
      <Avatar
        aria-hidden="true"
        radius="xl"
        size={34}
        classNames={{ placeholder: classes.userInfoAvatar }}
      >
        {initials}
      </Avatar>
      {!collapsed && (
        <Stack gap={1} miw={0}>
          <Text
            className={classes.userInfoName}
            fw={600}
            size="sm"
            truncate="end"
          >
            {identity.username}
          </Text>
          <Text className={classes.userInfoRole} size="xs" truncate="end">
            {roleLabel}
          </Text>
        </Stack>
      )}
    </>
  );

  return (
    <div className={classes.userInfoWrapper}>
      {logoutAction ? (
        <Menu
          offset={6}
          position={collapsed ? "right-end" : "top-start"}
          shadow="sm"
          width={216}
          withinPortal={false}
          withInitialFocusPlaceholder={false}
        >
          <Menu.Target>
            <UnstyledButton
              aria-description={roleLabel}
              aria-label={menuLabel}
              title={accountLabel}
              className={classes.userInfoPanel}
              type="button"
            >
              {userDetails}
              {!collapsed && (
                <IconSelector
                  aria-hidden="true"
                  className={classes.userInfoChevron}
                  size={15}
                />
              )}
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown className={classes.userInfoDropdown}>
            <Menu.Label className={classes.menuIdentity}>
              <Text
                component="span"
                className={classes.userInfoName}
                size="sm"
                fw={600}
              >
                {identity.username}
              </Text>
              <Text component="span" className={classes.userInfoRole} size="xs">
                {roleLabel}
              </Text>
            </Menu.Label>
            <Menu.Divider />
            {logoutAction}
          </Menu.Dropdown>
        </Menu>
      ) : (
        <div
          aria-label={accountLabel}
          className={classes.userInfoPanel}
          title={accountLabel}
        >
          {userDetails}
        </div>
      )}
    </div>
  );
}

function getResourceIcon(icon: AdminResourceMetadata["icon"]) {
  if (icon === "productCategories") {
    return <IconFolder aria-hidden="true" size={20} />;
  }

  return <IconUsers aria-hidden="true" size={20} />;
}

function getAdminIdentityInitials(username: string) {
  const normalized = username.trim();

  if (!normalized) {
    return "?";
  }

  const parts = normalized.split(/[\s._@-]+/).filter((part) => part.length > 0);
  const initials = (parts.length > 1 ? parts.slice(0, 2) : [normalized])
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase();
}

function useAdminPathname(): string {
  return usePathname();
}

function isActiveAdminPath(pathname: string, href: string): boolean {
  if (!pathname) {
    return false;
  }

  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
