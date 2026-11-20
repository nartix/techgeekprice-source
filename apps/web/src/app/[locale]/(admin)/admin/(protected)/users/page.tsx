import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UserList } from "../../../../../../features/identity/admin/users/components/UserList";
import { routing } from "../../../../../../i18n/routing";

type Locale = (typeof routing.locales)[number];

type UsersPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("usersTitle"),
  };
}

export default async function UsersPage({ params }: UsersPageProps) {
  const { locale } = await params;

  return <UserList locale={locale as Locale} />;
}
