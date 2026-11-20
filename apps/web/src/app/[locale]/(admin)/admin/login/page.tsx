import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  getPortfolioDemoEnabled,
  getPublicSpringApiBaseUrl,
} from "../../../../../env";
import { AdminLoginForm } from "../../../../../features/platform/admin-login/components/AdminLoginForm";
import { routing } from "../../../../../i18n/routing";
import classes from "./AdminLoginPage.module.css";

type Locale = (typeof routing.locales)[number];

type AdminLoginPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("loginTitle"),
  };
}

export default async function AdminLoginPage({ params }: AdminLoginPageProps) {
  const { locale } = await params;
  const adminLocale = locale as Locale;
  const t = await getTranslations({
    locale: adminLocale,
    namespace: "Admin.Login",
  });
  const year = new Date().getFullYear();

  return (
    <main className={classes.main}>
      <span aria-hidden="true" className={classes.orbits} />
      <div className={classes.formWrap}>
        <AdminLoginForm
          apiBaseUrl={getPublicSpringApiBaseUrl()}
          demoEnabled={getPortfolioDemoEnabled()}
          locale={adminLocale}
        />
      </div>
      <footer className={classes.footer}>{t("copyright", { year })}</footer>
    </main>
  );
}
