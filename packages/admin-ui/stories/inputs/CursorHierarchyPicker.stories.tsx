import { MantineProvider } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { CursorHierarchyPicker } from "../../src/inputs/hierarchy-picker/CursorHierarchyPicker";

const options = [
  { id: "root", label: "No parent", source: "root" as const },
  { id: "1", label: "Laptops", source: "remote" as const },
  {
    id: "2",
    label: "Archived long-running product category that cannot be selected",
    source: "remote" as const,
    disabled: true,
  },
];

const meta = {
  title: "Inputs/CursorHierarchyPicker",
  component: CursorHierarchyPicker,
  parameters: { a11y: { test: "error" } },
  args: {
    label: "Parent category",
    options,
    value: "root",
    onChange: () => undefined,
  },
} satisfies Meta<typeof CursorHierarchyPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

export const LongContent: Story = {
  args: {
    label: "Parent category with a deliberately long localized label",
  },
};

export const NarrowAndDark: Story = {
  decorators: [
    (Story) => (
      <MantineProvider forceColorScheme="dark">
        <div style={{ maxWidth: 320 }}>
          <Story />
        </div>
      </MantineProvider>
    ),
  ],
};
