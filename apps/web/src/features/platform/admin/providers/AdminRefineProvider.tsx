"use client";

import { Refine } from "@refinedev/core";
import type { AuthProvider, DataProvider } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";
import {
  adminSpringDataProvider,
  createAdminAuthClient,
} from "@tgp/api-client";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { adminResources } from "../resources/adminResources";
import { createAdminAccessControlProvider } from "./adminAccessControlProvider";
import { createAdminAuthProvider } from "./adminAuthProvider";
import { createAdminNotificationProvider } from "./adminNotificationProvider";

type Locale = "en-CA" | "en-US" | "fr-CA";

interface AdminRefineProviderProps {
  authProvider?: AuthProvider;
  apiBaseUrl: string;
  children: ReactNode;
  locale: Locale;
}

export function AdminRefineProvider({
  apiBaseUrl,
  authProvider,
  children,
  locale,
}: AdminRefineProviderProps) {
  const providers = useMemo(() => {
    const authClient = createAdminAuthClient({ baseUrl: apiBaseUrl });

    return {
      accessControlProvider: createAdminAccessControlProvider(),
      authProvider: createAdminAuthProvider({ authClient, locale }),
      dataProvider: adminSpringDataProvider({
        baseUrl: apiBaseUrl,
        resources: adminResources.map((resource) => ({
          name: resource.name,
          apiPath: resource.apiPath,
        })),
      }) as unknown as DataProvider,
      notificationProvider: createAdminNotificationProvider(),
    };
  }, [apiBaseUrl, locale]);

  return (
    <Refine
      accessControlProvider={providers.accessControlProvider}
      authProvider={authProvider ?? providers.authProvider}
      dataProvider={providers.dataProvider}
      notificationProvider={providers.notificationProvider}
      resources={adminResources.map((resource) => ({
        name: resource.name,
        list: resource.list,
        create: resource.create,
        show: resource.show,
        edit: resource.edit,
        meta: {
          apiPath: resource.apiPath,
          groupKey: resource.groupKey,
          labelKey: resource.labelKey,
          permissions: resource.permissions,
          strictPermissions: resource.strictPermissions,
        },
      }))}
      routerProvider={routerProvider}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
      }}
    >
      {children}
    </Refine>
  );
}
