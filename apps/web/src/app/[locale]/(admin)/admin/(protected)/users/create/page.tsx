import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UserForm } from "../../../../../../../features/identity/admin/users/components/UserForm";
import { routing } from "../../../../../../../i18n/routing";

type Locale = (typeof routing.locales)[number];

type UserCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("userCreateTitle"),
  };
}

export default async function UserCreatePage({ params }: UserCreatePageProps) {
  const { locale } = await params;

  return <UserForm locale={locale as Locale} mode="create" />;
}
