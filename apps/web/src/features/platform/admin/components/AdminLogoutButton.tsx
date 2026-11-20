"use client";

import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { createAdminAuthClient } from "@tgp/api-client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import classes from "./AdminShell.module.css";
import { createAdminAuthProvider } from "../providers/adminAuthProvider";

type Locale = "en-CA" | "en-US" | "fr-CA";

interface AdminLogoutButtonProps {
  apiBaseUrl: string;
  collapsed?: boolean;
  label: string;
  locale: Locale;
}

export function AdminLogoutButton({
  apiBaseUrl,
  collapsed = false,
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

  if (collapsed) {
    return (
      <Tooltip label={label} position="right" withArrow>
        <ActionIcon
          aria-label={label}
          className={classes.logoutIcon}
          loading={loading}
          onClick={handleLogout}
          size={52}
          variant="subtle"
        >
          <IconLogout aria-hidden="true" size={18} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <Button
      className={classes.logoutButton}
      fullWidth
      justify="flex-start"
      leftSection={<IconLogout aria-hidden="true" size={18} />}
      loading={loading}
      onClick={handleLogout}
      variant="subtle"
    >
      {label}
    </Button>
  );
}
