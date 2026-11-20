"use client";

import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useDataProvider } from "@refinedev/core";
import type { DataProvider } from "@refinedev/core";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  createAdminFormOptionLoaderApi,
  type AdminFormOptionLoaderApi,
} from "../../../../platform/admin/forms";
import type { CategoryParentPickerStatus } from "../types/category-parent-options.types";
import { CategoryParentPicker } from "./CategoryParentPicker";

export interface CategoryMoveTarget {
  id: string;
  name: string;
  parentId?: string | null;
}

interface CategoryMoveDialogProps {
  apiBasePath?: string;
  category: CategoryMoveTarget | null;
  /** Current category-operation authority, re-evaluated by the owner on refresh. */
  enabled?: boolean;
  loading?: boolean;
  opened: boolean;
  onClose: () => void;
  onMove: (newParentId: string | null) => Promise<void> | void;
}

interface CategoryMoveDialogViewProps {
  api: AdminFormOptionLoaderApi;
  apiBasePath?: string;
  category: CategoryMoveTarget | null;
  currentParentId: string;
  enabled?: boolean;
  labels: CategoryMoveDialogLabels;
  loading?: boolean;
  opened: boolean;
  parentId: string;
  pickerStatus?: CategoryParentPickerStatus | null;
  onClose: () => void;
  onMove: (newParentId: string | null) => Promise<void> | void;
  onParentIdChange: (value: string) => void;
  onPickerStatusChange?: (status: CategoryParentPickerStatus) => void;
}

interface CategoryMoveDialogLabels {
  cancel: string;
  description: string;
  move: string;
  parentDescription: string;
  parentLabel: string;
  title: string;
}

export function CategoryMoveDialog({
  apiBasePath,
  category,
  enabled = true,
  loading = false,
  opened,
  onClose,
  onMove,
}: CategoryMoveDialogProps) {
  const t = useTranslations("Admin.ProductCategories.actions");
  const tActions = useTranslations("Admin.Actions");
  const getDataProvider = useDataProvider();
  const dataProvider = useMemo(
    () => getDataProvider() as DataProvider | undefined,
    [getDataProvider],
  );
  const api = useMemo(
    () => createAdminFormOptionLoaderApi(dataProvider),
    [dataProvider],
  );
  const [parentId, setParentId] = useState("");
  const [pickerStatus, setPickerStatus] =
    useState<CategoryParentPickerStatus | null>(null);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setParentId(category?.parentId ?? "");
    setPickerStatus(null);
  }, [category?.id, category?.parentId, opened]);

  return (
    <CategoryMoveDialogView
      api={api}
      apiBasePath={apiBasePath}
      category={category}
      currentParentId={category?.parentId ?? ""}
      enabled={enabled}
      labels={{
        cancel: tActions("cancel"),
        description: category
          ? t("moveDescription", { name: category.name })
          : t("moveDescription", { name: "" }),
        move: t("moveSubmit"),
        parentDescription: t("moveParentDescription"),
        parentLabel: t("moveParentLabel"),
        title: t("moveTitle"),
      }}
      loading={loading}
      opened={opened}
      parentId={parentId}
      pickerStatus={pickerStatus}
      onClose={onClose}
      onMove={onMove}
      onParentIdChange={setParentId}
      onPickerStatusChange={setPickerStatus}
    />
  );
}

export function CategoryMoveDialogView({
  api,
  apiBasePath,
  category,
  currentParentId,
  enabled = true,
  labels,
  loading = false,
  opened,
  parentId,
  pickerStatus,
  onClose,
  onMove,
  onParentIdChange,
  onPickerStatusChange,
}: CategoryMoveDialogViewProps) {
  const normalizedParentId = normalizeParentId(parentId);
  const normalizedCurrentParentId = normalizeParentId(currentParentId);
  const selectedTargetValid =
    pickerStatus == null ||
    pickerStatus.selectedValueStatus === "root" ||
    pickerStatus.selectedValueStatus === "selectable";
  const pickerBlocked =
    Boolean(pickerStatus?.blockingError) ||
    pickerStatus?.searchError === true ||
    pickerStatus?.selectedValueStatus === "disabled" ||
    pickerStatus?.selectedValueStatus === "missing";
  const canSubmit =
    enabled &&
    Boolean(category) &&
    !loading &&
    selectedTargetValid &&
    !pickerBlocked &&
    normalizedParentId !== normalizedCurrentParentId;

  return (
    <Modal
      opened={opened}
      title={labels.title}
      closeButtonProps={{ "aria-label": labels.cancel }}
      onClose={onClose}
      centered
    >
      <Stack gap="md">
        <Text c="var(--tgp-admin-color-text-secondary)" size="sm">
          {labels.description}
        </Text>
        <CategoryParentPicker
          api={api}
          apiBasePath={apiBasePath}
          description={labels.parentDescription}
          disabled={loading || !category || !enabled}
          excludeSubtreeId={category?.id ?? null}
          label={labels.parentLabel}
          selectedParentId={category?.parentId ?? null}
          value={parentId}
          onChange={onParentIdChange}
          onStatusChange={onPickerStatusChange}
        />
        <Group justify="flex-end" gap="xs">
          <Button disabled={loading} variant="default" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            color="adminBlue.7"
            disabled={!canSubmit}
            loading={loading}
            onClick={() => {
              void onMove(normalizedParentId || null);
            }}
          >
            {labels.move}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function normalizeParentId(parentId: string): string {
  return parentId.trim();
}
