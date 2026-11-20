import {
  Button,
  Group,
  MantineProvider,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { CursorHierarchyPicker } from "../../../src/inputs/hierarchy-picker/CursorHierarchyPicker";

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
  title: "Inputs/Hierarchy picker/CursorHierarchyPicker",
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
export const Loading: Story = { args: { loading: true } };
export const RecoverableError: Story = {
  args: { errorMessage: "The cursor is invalid", onRetry: () => undefined },
};
export const LoadMore: Story = {
  args: { hasMore: true, onLoadMore: () => undefined },
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

function PaginatedModalPicker() {
  const [opened, setOpened] = useState(false);
  const [count, setCount] = useState(20);
  const [value, setValue] = useState("1");
  const destinations = Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    label: `Category ${String(index + 1).padStart(3, "0")}`,
    source: "remote" as const,
  }));

  return (
    <>
      <Button color="adminBlue.7" onClick={() => setOpened(true)}>
        Move category
      </Button>
      <Modal
        centered
        closeButtonProps={{ "aria-label": "Close move category" }}
        opened={opened}
        title="Move category"
        onClose={() => setOpened(false)}
      >
        <Stack>
          <Text c="var(--tgp-admin-color-text-secondary)" size="sm">
            Choose a new parent for this category.
          </Text>
          <CursorHierarchyPicker
            description="Search all available parent categories."
            hasMore={count < 80}
            label="New parent"
            options={destinations}
            renderOption={(option) => (
              <Stack gap={0}>
                <Text size="sm">{option.label}</Text>
                <Text c="dimmed" size="xs">
                  catalogue-destination-{option.id}
                </Text>
              </Stack>
            )}
            value={value}
            onChange={setValue}
            onLoadMore={() => setCount((current) => current + 20)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button color="adminBlue.7" onClick={() => setOpened(false)}>
              Confirm move
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export const PaginatedInModal: Story = {
  render: () => <PaginatedModalPicker />,
};
