import { defineMain } from "@storybook/react-vite/node";

export default defineMain({
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  staticDirs: [
    {
      from: "../../../apps/web/src/app/fonts",
      to: "/admin-fonts",
    },
  ],
  docs: {
    autodocs: "tag",
  },
});
