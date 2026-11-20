import { MantineProvider } from "@mantine/core";
import {
  render as testingLibraryRender,
  type RenderResult,
} from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import enCaMessages from "../../messages/en-CA.json";
import { tgpTheme } from "@tgp/ui/theme";
import { routing } from "../../src/i18n/routing";

type Locale = (typeof routing.locales)[number];

interface TestProviderProps {
  children: ReactNode;
  locale?: Locale;
  messages?: Record<string, unknown>;
}

interface RenderOptions {
  locale?: Locale;
  messages?: Record<string, unknown>;
}

function TestProvider({
  children,
  locale = "en-CA",
  messages = enCaMessages,
}: TestProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <MantineProvider defaultColorScheme="light" env="test" theme={tgpTheme}>
        {children}
      </MantineProvider>
    </NextIntlClientProvider>
  );
}

export function render(
  ui: ReactNode,
  options: RenderOptions = {},
): RenderResult {
  return testingLibraryRender(ui, {
    wrapper: ({ children }) => (
      <TestProvider locale={options.locale} messages={options.messages}>
        {children}
      </TestProvider>
    ),
  });
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
