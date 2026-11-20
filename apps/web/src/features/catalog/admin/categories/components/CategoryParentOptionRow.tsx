import { Badge, Group, Stack, Text } from "@mantine/core";

import type {
  CategoryParentPickerMessages,
  CategoryParentUiOption,
} from "../types/category-parent-options.types";

interface CategoryParentOptionRowProps {
  messages: Pick<
    CategoryParentPickerMessages,
    "inactive" | "selectedInactiveHelp"
  >;
  option: CategoryParentUiOption;
}

export function CategoryParentOptionRow({
  messages,
  option,
}: CategoryParentOptionRowProps) {
  const inactive = option.disabledReason === "INACTIVE";

  return (
    <Group justify="space-between" gap="sm" wrap="nowrap">
      <Stack gap={2} className="min-w-0">
        <Text fw={option.source === "root" ? 600 : 500} size="sm" truncate>
          {option.label}
        </Text>
        {option.slug ? (
          <Text c="dimmed" size="xs" truncate>
            {option.slug}
          </Text>
        ) : null}
        {inactive && option.source === "selected" ? (
          <Text c="dimmed" size="xs">
            {messages.selectedInactiveHelp}
          </Text>
        ) : null}
      </Stack>
      {inactive ? (
        <Badge color="gray" size="xs" variant="light">
          {messages.inactive}
        </Badge>
      ) : null}
    </Group>
  );
}
