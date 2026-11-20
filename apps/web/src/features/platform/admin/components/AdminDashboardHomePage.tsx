"use client";

import { getAdminIdentity } from "../session/adminIdentityStore";
import { AdminDashboardHome } from "./AdminDashboardHome";

type Locale = "en-CA" | "en-US" | "fr-CA";

interface AdminDashboardHomePageProps {
  locale: Locale;
}

export function AdminDashboardHomePage({
  locale,
}: AdminDashboardHomePageProps) {
  return <AdminDashboardHome identity={getAdminIdentity()} locale={locale} />;
}
