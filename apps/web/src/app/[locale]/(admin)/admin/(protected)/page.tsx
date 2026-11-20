import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminDashboardHomePage } from "../../../../../features/platform/admin/components/AdminDashboardHomePage";
import { routing } from "../../../../../i18n/routing";

type Locale = (typeof routing.locales)[number];

type AdminDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("dashboardTitle"),
  };
}

export default async function AdminDashboardPage({
  params,
}: AdminDashboardPageProps) {
  const { locale } = await params;

  return <AdminDashboardHomePage locale={locale as Locale} />;
}
