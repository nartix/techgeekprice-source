"use client";

import {
  ActionIcon,
  Avatar,
  Group,
  NavLink,
  Popover,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronDown,
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
        active: isActiveAdminPath(currentPathname, resource.list),
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
      <Stack className={classes.navList} gap="xs">
        <Stack className={classes.navProfileGroup} gap="xs">
          <AdminSidebarProfile
            collapsed={collapsed}
            collapseLabel={toggleLabel}
            managementLabel={t("management")}
            onCollapseToggle={onCollapseToggle}
            title={t("admin")}
          />
        </Stack>
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
    <Stack className={classes.navGroup} gap="xs">
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
  if (collapsed) {
    return onCollapseToggle ? (
      <Tooltip label={collapseLabel} position="right" withArrow>
        <ActionIcon
          aria-expanded={!collapsed}
          aria-label={collapseLabel}
          className={classes.profileIconButton}
          onClick={onCollapseToggle}
          size={52}
          type="button"
          variant="subtle"
        >
          <span
            aria-hidden="true"
            className={`${classes.profileButtonIcon} ${classes.profileButtonDefaultIcon}`}
          >
            <IconGauge size={22} />
          </span>
          <span
            aria-hidden="true"
            className={`${classes.profileButtonIcon} ${classes.profileButtonHoverIcon}`}
          >
            <IconLayoutSidebarLeftExpand size={22} />
          </span>
        </ActionIcon>
      </Tooltip>
    ) : (
      <ThemeIcon
        className={classes.profileIconButton}
        size={52}
        variant="light"
      >
        <IconGauge aria-hidden="true" size={22} />
      </ThemeIcon>
    );
  }

  return (
    <Group
      className={classes.profilePanel}
      justify="space-between"
      wrap="nowrap"
    >
      <Group gap="sm" miw={0} wrap="nowrap">
        <ThemeIcon className={classes.profileIcon} size={44} variant="light">
          <IconGauge aria-hidden="true" size={22} />
        </ThemeIcon>
        <Stack gap={2} miw={0}>
          <Text className={classes.profileTitle} fw={700} truncate="end">
            {title}
          </Text>
          <Text className={classes.profileSubtitle} size="sm" truncate="end">
            {managementLabel}
          </Text>
        </Stack>
      </Group>
      <Group gap={6} wrap="nowrap">
        {onCollapseToggle ? (
          <Tooltip label={collapseLabel} position="right" withArrow>
            <ActionIcon
              aria-expanded={!collapsed}
              aria-label={collapseLabel}
              className={classes.collapseButton}
              onClick={onCollapseToggle}
              size="lg"
              variant="subtle"
            >
              <IconLayoutSidebarLeftCollapse aria-hidden="true" size={20} />
            </ActionIcon>
          </Tooltip>
        ) : null}
      </Group>
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
      aria-current={current ? "page" : undefined}
      className={linkClassName}
      component={Link}
      href={href}
      label={collapsed ? undefined : label}
      leftSection={<span className={classes.sidebarLinkIcon}>{icon}</span>}
      locale={locale}
      noWrap
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
    <Tooltip label={label} position="right" withArrow>
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
      <Avatar className={classes.userInfoAvatar} size={44}>
        {initials}
      </Avatar>
      <Stack gap={2} miw={0}>
        <Text className={classes.userInfoName} fw={700} truncate="end">
          {identity.username}
        </Text>
        <Text className={classes.userInfoRole} size="sm" truncate="end">
          {roleLabel}
        </Text>
      </Stack>
    </>
  );

  if (!logoutAction) {
    return (
      <div className={classes.userInfoWrapper}>
        {collapsed ? (
          <Avatar
            aria-label={accountLabel}
            className={classes.userInfoAvatarCompact}
            size={52}
          >
            {initials}
          </Avatar>
        ) : (
          <Group className={classes.userInfoPanel} gap="sm" wrap="nowrap">
            {userDetails}
          </Group>
        )}
      </div>
    );
  }

  const target = collapsed ? (
    <UnstyledButton
      aria-label={menuLabel}
      className={classes.userInfoIconButton}
      type="button"
    >
      <Avatar
        aria-hidden="true"
        className={classes.userInfoAvatarCompact}
        size={52}
      >
        {initials}
      </Avatar>
    </UnstyledButton>
  ) : (
    <UnstyledButton
      aria-label={menuLabel}
      className={`${classes.userInfoPanel} ${classes.userInfoTarget}`}
      type="button"
    >
      <Group gap="sm" wrap="nowrap">
        {userDetails}
        <IconChevronDown
          aria-hidden="true"
          className={classes.userInfoChevron}
          size={16}
        />
      </Group>
    </UnstyledButton>
  );

  return (
    <div className={classes.userInfoWrapper}>
      <Popover
        offset={collapsed ? 12 : 8}
        position={collapsed ? "right-end" : "top-end"}
        shadow="md"
        width={collapsed ? 220 : "target"}
        withinPortal={false}
        withArrow
      >
        <Popover.Target>{target}</Popover.Target>
        <Popover.Dropdown
          className={classes.userInfoDropdown}
          styles={{
            dropdown: {
              backgroundColor: "var(--admin-surface-bg)",
              opacity: 1,
            },
            arrow: {
              backgroundColor: "var(--admin-surface-bg)",
              opacity: 1,
            },
          }}
        >
          <div className={classes.userInfoDropdownContent}>{logoutAction}</div>
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}

function getResourceIcon(icon: "productCategories" | "users") {
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
