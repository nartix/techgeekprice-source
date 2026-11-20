import { Box, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type {
  AdminFormAction,
  AdminFormOptionLoaderApi,
  AdminFormSection as AdminFormSectionConfig,
} from "../types/admin-form.types";
import {
  canRenderAdminSection,
  createAdminFormRuntimeContext,
} from "../utils/adminFormVisibility";
import { AdminGeneratedField } from "./AdminGeneratedField";

interface AdminFormSectionProps<TValues extends FieldValues> {
  api?: AdminFormOptionLoaderApi;
  form: UseFormReturn<TValues>;
  mode: AdminFormAction;
  passwordAllowed: boolean;
  permissions: string[];
  record?: unknown;
  roles: string[];
  section: AdminFormSectionConfig<TValues>;
  values: TValues;
}

export function AdminFormSection<TValues extends FieldValues>({
  api,
  form,
  mode,
  passwordAllowed,
  permissions,
  record,
  roles,
  section,
  values,
}: AdminFormSectionProps<TValues>) {
  const visible = canRenderAdminSection(
    section,
    createAdminFormRuntimeContext({
      mode,
      permissions,
      record,
      roles,
      values,
    }),
  );

  if (!visible) {
    return null;
  }

  return (
    <Box component="section">
      <Stack gap="sm">
        {section.title ? (
          <Title order={3} size="h4">
            {section.title}
          </Title>
        ) : null}
        {section.description ? (
          <Text c="dimmed" size="sm">
            {section.description}
          </Text>
        ) : null}
        <SimpleGrid cols={{ base: 1, md: section.columns ?? 2 }} spacing="md">
          {section.fields.map((field) => (
            <AdminGeneratedField
              key={field.name}
              api={api}
              field={field}
              form={form}
              mode={mode}
              passwordAllowed={passwordAllowed}
              permissions={permissions}
              record={record}
              roles={roles}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
