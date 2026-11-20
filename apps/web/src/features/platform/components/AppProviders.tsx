"use client";

import { tgpTheme } from "@tgp/ui/theme";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MantineProvider defaultColorScheme="auto" theme={tgpTheme}>
      <AppNotifications />
      {children}
    </MantineProvider>
  );
}

function AppNotifications() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <Notifications /> : null;
}
