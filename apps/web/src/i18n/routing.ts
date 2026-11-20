import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en-CA", "en-US", "fr-CA"],
  defaultLocale: "en-CA",
  localeDetection: false,
});
