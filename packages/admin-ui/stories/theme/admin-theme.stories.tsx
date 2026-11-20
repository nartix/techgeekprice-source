import { Badge, Box, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";

function AdminThemePreview() {
  return (
    <Box
      style={{
        background: "var(--tgp-admin-color-page-bg)",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <Stack gap="md" maw={760}>
        <Title order={1}>Admin UI theme</Title>
        <Text c="var(--tgp-admin-color-text-secondary)">
          Separate admin tokens keep operational screens visually distinct while
          sharing Mantine interaction primitives.
        </Text>

        <Card
          withBorder
          padding="lg"
          radius="sm"
          style={{
            background: "var(--tgp-admin-color-surface)",
            borderColor: "var(--tgp-admin-color-border-subtle)",
          }}
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={700}>Category operations</Text>
              <Badge color="adminBlue" variant="light">
                Ranked
              </Badge>
            </Group>

            <Text>
              Admin surfaces use tighter radii, calmer neutral surfaces, and
              operational status colors tuned for tables and dense workflows.
            </Text>

            <Group>
              <Button color="adminBlue">Apply filters</Button>
              <Button color="gray" variant="default">
                Clear
              </Button>
              <Button color="red" variant="light">
                Disable category
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}

const meta = {
  title: "Theme/Admin Theme",
  component: AdminThemePreview,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AdminThemePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
