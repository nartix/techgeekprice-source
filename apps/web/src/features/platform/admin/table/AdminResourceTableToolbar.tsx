"use client";

import { Button, Group, Select, Stack, Text, Title } from "@mantine/core";

import { Link } from "../../../../i18n/navigation";
import { ALLOWED_ADMIN_PAGE_SIZES } from "../utils/adminPageSizePolicy";
import type { AdminResourceTableRenderContext } from "./admin-resource-table.types";

export function AdminResourceTableToolbar<TRow>(
  context: AdminResourceTableRenderContext<TRow>,
) {
  const {
    createAction,
    displayMetadata,
    isFetching,
    labels,
    locale,
    pagination,
    setPageSize,
  } = context;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{labels.title}</Title>
          {labels.description ? <Text c="dimmed">{labels.description}</Text> : null}
        </div>
        {createAction?.visible ? (
          <Button component={Link} href={createAction.href} locale={locale}>
            {createAction.label}
          </Button>
        ) : null}
      </Group>

      <Group justify="space-between">
        <div>
          <Text size="sm" c="dimmed">
            {labels.pageMetadata(displayMetadata)}
          </Text>
          {isFetching && labels.refetching ? (
            <Text size="xs" c="dimmed">
              {labels.refetching}
            </Text>
          ) : null}
        </div>
        <Select
          aria-label={labels.pageSizeLabel}
          comboboxProps={{ withinPortal: false }}
          data={ALLOWED_ADMIN_PAGE_SIZES.map((size) => ({
            value: String(size),
            label: String(size),
          }))}
          value={String(pagination.pageSize)}
          w={96}
          onChange={(value) => {
            if (value) {
              setPageSize(Number(value));
            }
          }}
        />
      </Group>
    </Stack>
  );
}
