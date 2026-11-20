import { getPublicSpringApiBaseUrl } from "../../../../../env";
import { AdminRoot } from "../../../../../features/platform/admin/components/AdminRoot";
import { routing } from "../../../../../i18n/routing";

type Locale = (typeof routing.locales)[number];

export const dynamic = "force-dynamic";

type ProtectedAdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProtectedAdminLayout({
  children,
  params,
}: ProtectedAdminLayoutProps) {
  const { locale } = await params;

  return (
    <AdminRoot
      apiBaseUrl={getPublicSpringApiBaseUrl()}
      locale={locale as Locale}
    >
      {children}
    </AdminRoot>
  );
}
