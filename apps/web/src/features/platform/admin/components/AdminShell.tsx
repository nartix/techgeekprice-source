"use client";

import { AppShell, MantineProvider } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { AdminHeader } from "./AdminHeader";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { AdminSidebar } from "./AdminSidebar";
import classes from "./AdminShell.module.css";
import { adminTheme } from "../theme/adminTheme";
import type { AdminIdentity } from "../types/admin.types";

type Locale = "en-CA" | "en-US" | "fr-CA";

const ADMIN_NAVBAR_WIDTH = 304;
const ADMIN_NAVBAR_COLLAPSED_WIDTH = 80;

interface AdminShellProps {
  apiBaseUrl: string;
  children: ReactNode;
  identity: AdminIdentity | null;
  locale: Locale;
}

export function AdminShell({
  apiBaseUrl,
  children,
  identity,
  locale,
}: AdminShellProps) {
  const [mobileOpened, { close, toggle }] = useDisclosure();
  const [sidebarCollapsed, { toggle: toggleSidebarCollapsed }] =
    useDisclosure(false);
  const isDesktopSidebar = useMediaQuery("(min-width: 48em)", false);
  const sidebarIsCollapsed = isDesktopSidebar && sidebarCollapsed;
  const t = useTranslations("Admin.Navigation");
  const menuLabel = isDesktopSidebar
    ? sidebarIsCollapsed
      ? t("expandSidebar")
      : t("collapseSidebar")
    : mobileOpened
      ? t("closeNavigation")
      : t("openNavigation");
  const handleMenuToggle = () => {
    if (isDesktopSidebar) {
      toggleSidebarCollapsed();
      return;
    }

    toggle();
  };

  return (
    <MantineProvider
      cssVariablesSelector={`.${classes.themeScope}`}
      defaultColorScheme="auto"
      theme={adminTheme}
      withGlobalClasses={false}
    >
      <AppShell
        className={`${classes.root} ${classes.themeScope}`}
        classNames={{
          header: classes.header,
          main: classes.main,
          navbar: classes.navbar,
        }}
        header={{ height: { base: 72, sm: 0 } }}
        navbar={{
          width: {
            base: ADMIN_NAVBAR_WIDTH,
            sm: sidebarIsCollapsed
              ? ADMIN_NAVBAR_COLLAPSED_WIDTH
              : ADMIN_NAVBAR_WIDTH,
          },
          breakpoint: "sm",
          collapsed: { mobile: !mobileOpened },
        }}
        padding={{ base: "md", sm: "xl" }}
      >
        <AppShell.Header>
          <AdminHeader
            menuControl="navigation"
            menuLabel={menuLabel}
            menuOpened={mobileOpened}
            onMenuToggle={handleMenuToggle}
            title={t("dashboard")}
          />
        </AppShell.Header>
        <AppShell.Navbar>
          <AdminSidebar
            collapsed={sidebarIsCollapsed}
            identity={identity}
            locale={locale}
            logoutAction={
              <AdminLogoutButton
                apiBaseUrl={apiBaseUrl}
                label={t("logout")}
                locale={locale}
              />
            }
            onCollapseToggle={
              isDesktopSidebar ? toggleSidebarCollapsed : undefined
            }
            onNavigate={close}
          />
        </AppShell.Navbar>
        <AppShell.Main>{children}</AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
