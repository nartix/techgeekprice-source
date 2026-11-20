import "@mantine/core/styles.css";
import "@tgp/admin-ui/theme/admin-semantic-tokens.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { definePreview } from "@storybook/react-vite";
import type { Decorator } from "@storybook/react-vite";
import { adminTheme } from "@tgp/admin-ui/theme";

const withAdminMantineProvider: Decorator = (Story, context) => {
  const colorScheme = context.globals.colorScheme;
  const forceColorScheme =
    colorScheme === "light" || colorScheme === "dark" ? colorScheme : undefined;

  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider
        defaultColorScheme="auto"
        forceColorScheme={forceColorScheme}
        theme={adminTheme}
      >
        <div
          style={{
            background: "var(--tgp-admin-color-page-bg)",
            color: "var(--tgp-admin-color-text-primary)",
            minHeight: "100vh",
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
  decorators: [withAdminMantineProvider],
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
    layout: "fullscreen",
  },
});
