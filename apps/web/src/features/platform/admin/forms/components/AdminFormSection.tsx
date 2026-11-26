import { Box, Stack, Text, Title } from "@mantine/core";
import type { CSSProperties } from "react";
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
import styles from "./AdminFormSection.module.css";

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
    <Box component="section" className={styles.section}>
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
        <div
          className={styles.fields}
          data-paired={(section.columns ?? 2) > 1}
          style={{ "--section-columns": section.columns ?? 2 } as CSSProperties}
        >
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
        </div>
      </Stack>
    </Box>
  );
}
