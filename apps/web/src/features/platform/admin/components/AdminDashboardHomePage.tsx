"use client";

import { useSyncExternalStore } from "react";

import {
  getAdminIdentity,
  subscribeAdminIdentity,
} from "../session/adminIdentityStore";
import { AdminDashboardHome } from "./AdminDashboardHome";

type Locale = "en-CA" | "en-US" | "fr-CA";

interface AdminDashboardHomePageProps {
  locale: Locale;
}

export function AdminDashboardHomePage({
  locale,
}: AdminDashboardHomePageProps) {
  const identity = useSyncExternalStore(
    subscribeAdminIdentity,
    getAdminIdentity,
    () => null,
  );
  return <AdminDashboardHome identity={identity} locale={locale} />;
}
