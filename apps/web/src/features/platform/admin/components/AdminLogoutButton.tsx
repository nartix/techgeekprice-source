"use client";

import { Menu } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { createAdminAuthClient } from "@tgp/api-client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import classes from "./AdminShell.module.css";
import { createAdminAuthProvider } from "../providers/adminAuthProvider";

type Locale = "en-CA" | "en-US" | "fr-CA";

interface AdminLogoutButtonProps {
  apiBaseUrl: string;
  label: string;
  locale: Locale;
}

export function AdminLogoutButton({
  apiBaseUrl,
  label,
  locale,
}: AdminLogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const authProvider = useMemo(
    () =>
      createAdminAuthProvider({
        authClient: createAdminAuthClient({ baseUrl: apiBaseUrl }),
        locale,
      }),
    [apiBaseUrl, locale],
  );

  async function handleLogout() {
    setLoading(true);
    const result = await authProvider.logout?.({});
    router.push(result?.redirectTo ?? `/${locale}/admin/login`);
  }

  return (
    <Menu.Item
      className={classes.logoutItem}
      closeMenuOnClick={false}
      data-autofocus
      disabled={loading}
      leftSection={<IconLogout aria-hidden="true" size={17} />}
      onClick={handleLogout}
    >
      {label}
    </Menu.Item>
  );
}
