import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UserDetail } from "../../../../../../../features/identity/admin/users/components/UserDetail";
import { routing } from "../../../../../../../i18n/routing";

type Locale = (typeof routing.locales)[number];

type UserShowPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("userShowTitle"),
  };
}

export default async function UserShowPage({ params }: UserShowPageProps) {
  const { id, locale } = await params;

  return <UserDetail id={id} locale={locale as Locale} />;
}
