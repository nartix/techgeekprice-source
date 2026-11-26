import {
  Button,
  Group,
  MantineProvider,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor, within } from "storybook/test";

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

function BottomEdgePicker() {
  const [opened, setOpened] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!opened) return;
    const timer = setTimeout(() => setLoaded(true), 350);
    return () => clearTimeout(timer);
  }, [opened]);

  return (
    <div style={{ position: "fixed", bottom: 90, insetInline: 16 }}>
      <CursorHierarchyPicker
        label="Category"
        loading={opened && !loaded}
        options={loaded ? options : []}
        value={value}
        onChange={setValue}
        onOpenChange={setOpened}
      />
    </div>
  );
}

export const DelayedResultsNearBottom: Story = {
  render: () => <BottomEdgePicker />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const input = canvas.getByRole("combobox", { name: "Category" });
    await userEvent.click(input);
    const popup = within(canvasElement.ownerDocument.body);
    const lastOption = await popup.findByRole("option", {
      name: /Archived long-running product category/,
    });
    await waitFor(() => {
      const list = popup.getByRole("listbox").getBoundingClientRect();
      expect(list.bottom).toBeLessThanOrEqual(
        input.getBoundingClientRect().top,
      );
      expect(lastOption.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        list.bottom + 1,
      );
    });
  },
};
