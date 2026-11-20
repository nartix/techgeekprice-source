"use client";

import { useTranslations } from "next-intl";

import { AdminErrorState } from "../../../../../features/platform/admin/components/AdminErrorState";

interface ProtectedAdminErrorProps {
  reset: () => void;
}

export default function ProtectedAdminError({
  reset,
}: ProtectedAdminErrorProps) {
  const t = useTranslations("Admin.States");

  return (
    <AdminErrorState
      title={t("errorTitle")}
      message={t("errorMessage")}
      retryLabel={t("retry")}
      onRetry={reset}
    />
  );
}
