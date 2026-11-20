import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "../../i18n/navigation";
import { routing } from "../../i18n/routing";

type HomeProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  redirect({ href: "/admin", locale });
}
