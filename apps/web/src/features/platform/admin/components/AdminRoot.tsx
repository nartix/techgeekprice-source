"use client";

import { Alert, Button, Container, Stack, Text } from "@mantine/core";
import { createAdminAuthClient } from "@tgp/api-client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  createAdminAuthProvider,
  type AdminCheckResult,
} from "../providers/adminAuthProvider";
import { getAdminIdentity } from "../session/adminIdentityStore";
import type { AdminIdentity } from "../types/admin.types";
import { AdminLoading } from "./AdminLoading";
import { AdminRefineProvider } from "../providers/AdminRefineProvider";
import { AdminShell } from "./AdminShell";

type Locale = "en-CA" | "en-US" | "fr-CA";
interface AdminRootProps {
  apiBaseUrl: string;
  children: ReactNode;
  locale: Locale;
}

export function AdminRoot(props: AdminRootProps) {
  // A new backend or locale must never render with the previous verification.
  return (
    <AdminSessionBoundary
      key={`${props.apiBaseUrl}\u0000${props.locale}`}
      {...props}
    />
  );
}

function AdminSessionBoundary({
  apiBaseUrl,
  children,
  locale,
}: AdminRootProps) {
  const router = useRouter();
  const t = useTranslations("Admin.States");
  const active = useRef(false);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [state, setState] = useState<
    "checking" | "verified" | "unavailable" | "forbidden" | "redirecting"
  >("checking");
  const [attempt, setAttempt] = useState(0);
  const onCheck = useCallback(
    (result: AdminCheckResult) => {
      if (!active.current) return;
      if (result.authenticated) {
        setIdentity(getAdminIdentity());
        setState("verified");
      } else if (result.redirectTo) {
        setState("redirecting");
        router.replace(result.redirectTo);
      } else
        setState(
          result.error?.name === "AdminForbiddenError"
            ? "forbidden"
            : "unavailable",
        );
    },
    [router],
  );
  const authProvider = useMemo(
    () =>
      createAdminAuthProvider({
        authClient: createAdminAuthClient({ baseUrl: apiBaseUrl }),
        locale,
        onCheck,
        isActive: () => active.current,
      }),
    [apiBaseUrl, locale, onCheck],
  );

  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    void authProvider.check({ signal: controller.signal }).catch(() => {
      if (!controller.signal.aborted && active.current) setState("unavailable");
    });
    return () => {
      active.current = false;
      controller.abort();
    };
  }, [authProvider, attempt]);

  if (state === "checking" || state === "redirecting")
    return <AdminLoading label={t("loading")} />;
  if (state === "unavailable" || state === "forbidden") {
    return (
      <Container size="sm" py="xl">
        <Alert
          role="alert"
          color={state === "forbidden" ? "yellow" : "red"}
          title={t(
            state === "forbidden"
              ? "forbiddenTitle"
              : "sessionUnavailableTitle",
          )}
        >
          <Stack gap="sm">
            <Text>
              {t(
                state === "forbidden"
                  ? "forbiddenMessage"
                  : "sessionUnavailableMessage",
              )}
            </Text>
            <Button
              variant="default"
              onClick={() => {
                setState("checking");
                setAttempt((value) => value + 1);
              }}
            >
              {t("retry")}
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }
  return (
    <AdminRefineProvider
      apiBaseUrl={apiBaseUrl}
      locale={locale}
      authProvider={authProvider}
    >
      <AdminShell apiBaseUrl={apiBaseUrl} identity={identity} locale={locale}>
        {children}
      </AdminShell>
    </AdminRefineProvider>
  );
}
