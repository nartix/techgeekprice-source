import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UserForm } from "../../../../../../../../features/identity/admin/users/components/UserForm";
import { routing } from "../../../../../../../../i18n/routing";

type Locale = (typeof routing.locales)[number];

type UserEditPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("userEditTitle"),
  };
}

export default async function UserEditPage({ params }: UserEditPageProps) {
  const { id, locale } = await params;

  return <UserForm id={id} locale={locale as Locale} mode="edit" />;
}
