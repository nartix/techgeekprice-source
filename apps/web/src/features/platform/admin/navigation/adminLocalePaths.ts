import { routing } from "../../../../i18n/routing";

type Locale = (typeof routing.locales)[number];

export function isSupportedLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}

export function toLocalizedAdminPath(locale: Locale, path = "/admin"): string {
  const adminPath = path.startsWith("/admin")
    ? path
    : `/admin${path.startsWith("/") ? path : `/${path}`}`;
  return `/${locale}${adminPath}`;
}

export function toLocalizedAdminLoginPath(locale: Locale): string {
  return toLocalizedAdminPath(locale, "/admin/login");
}

export function toLocalizedAdminLogoutRedirect(locale: Locale): string {
  return toLocalizedAdminLoginPath(locale);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];

  return segment && isSupportedLocale(segment)
    ? segment
    : routing.defaultLocale;
}
