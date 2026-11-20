"use client";

import { Stack, Table, Text, Title } from "@mantine/core";
import type { BaseRecord } from "@refinedev/core";

import type { AdminDetailResolvedSection } from "../types/admin-detail.types";
import { AdminDetailField } from "./AdminDetailField";

interface AdminDetailSectionProps<TRaw extends BaseRecord, TView> {
  section: AdminDetailResolvedSection<TRaw, TView>;
}

export function AdminDetailSection<TRaw extends BaseRecord, TView>({
  section,
}: AdminDetailSectionProps<TRaw, TView>) {
  return (
    <Stack component="section" gap="sm">
      <div>
        <Title order={3} size="h4">
          {section.title}
        </Title>
        {section.description ? (
          <Text c="dimmed" size="sm">
            {section.description}
          </Text>
        ) : null}
      </div>
      <Table.ScrollContainer minWidth={520}>
        <Table withTableBorder>
          <Table.Tbody>
            {section.fields.map((field) => (
              <AdminDetailField
                key={field.id}
                label={field.label}
                node={field.node}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
