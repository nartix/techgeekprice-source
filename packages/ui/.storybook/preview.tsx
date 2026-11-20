import "@mantine/core/styles.css";
import "@tgp/ui/theme/semantic-tokens.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { definePreview } from "@storybook/react-vite";
import type { Decorator } from "@storybook/react-vite";
import { tgpTheme } from "@tgp/ui/theme";

const withMantineProvider: Decorator = (Story, context) => {
  const colorScheme = context.globals.colorScheme;
  const forceColorScheme =
    colorScheme === "light" || colorScheme === "dark" ? colorScheme : undefined;

  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider
        defaultColorScheme="auto"
        forceColorScheme={forceColorScheme}
        theme={tgpTheme}
      >
        <div
          style={{
            background: "var(--tgp-color-page-bg)",
            color: "var(--tgp-color-text-primary)",
            padding: 24,
          }}
        >
          <Story />
        </div>
      </MantineProvider>
    </>
  );
};

export default definePreview({
  decorators: [withMantineProvider],
  globalTypes: {
    colorScheme: {
      name: "Color scheme",
      description: "Mantine color scheme",
      defaultValue: "auto",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "auto", title: "Auto" },
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
  },
  parameters: {
    a11y: {
      test: "error",
    },
    backgrounds: {
      disable: true,
    },
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
});
