"use client";

import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import type { AdminFormOptionLoaderApi } from "../../../../../platform/admin/forms";
import { CategoryParentPicker } from "../../components/CategoryParentPicker";
import type { CategoryParentPickerStatus } from "../../types/category-parent-options.types";
import {
  isSmallCategoryTreeMoveTargetBlocked,
  type SmallCategoryTreeModel,
  type SmallCategoryTreeRow,
} from "../category-tree-model";
import type { SmallCategoryTreeMoveErrorCode } from "../category-tree-mutations";

export type SmallCategoryTreeMoveDialogErrorCode =
  | SmallCategoryTreeMoveErrorCode
  | "self"
  | "descendant"
  | "inactive"
  | "missing"
  | "unchanged";

export interface SmallCategoryTreeMoveDialogLabels {
  cancel: string;
  description: string;
  errorMessages: Record<SmallCategoryTreeMoveDialogErrorCode, string>;
  parentDescription: string;
  parentLabel: string;
  submit: string;
  title: string;
}

interface SmallCategoryTreeMoveDialogProps {
  api: AdminFormOptionLoaderApi;
  apiBasePath?: string;
  category: SmallCategoryTreeRow | null;
  enabled?: boolean;
  loading?: boolean;
  model: SmallCategoryTreeModel;
  moveErrorCode?: SmallCategoryTreeMoveErrorCode | null;
  opened: boolean;
  onClose: () => void;
  onMove: (newParentId: string | null) => Promise<void> | void;
}

interface SmallCategoryTreeMoveDialogViewProps
  extends SmallCategoryTreeMoveDialogProps {
  labels: SmallCategoryTreeMoveDialogLabels;
}

export function SmallCategoryTreeMoveDialog({
  api,
  apiBasePath,
  category,
  enabled = true,
  loading = false,
  model,
  moveErrorCode,
  opened,
  onClose,
  onMove,
}: SmallCategoryTreeMoveDialogProps) {
  const t = useTranslations("Admin.ProductCategories.tree");
  const tActions = useTranslations("Admin.Actions");
  const labels = useMemo<SmallCategoryTreeMoveDialogLabels>(
    () => ({
      cancel: tActions("cancel"),
      description: t("move.description", { name: category?.name ?? "" }),
      errorMessages: {
        categoryNotFound: t("move.categoryNotFound"),
        descendant: t("move.descendant"),
        forbidden: t("move.forbidden"),
        genericError: t("move.genericError"),
        inactive: t("move.inactive"),
        invalidPlacementTarget: t("move.invalidPlacementTarget"),
        missing: t("move.missing"),
        rankRebalanceRejected: t("move.rankRebalanceRejected"),
        self: t("move.self"),
        stale: t("move.stale"),
        unchanged: t("move.unchanged"),
        unauthorized: t("move.unauthorized"),
        unsupportedPlacement: t("move.unsupportedPlacement"),
        validationFailed: t("move.validationFailed"),
      },
      parentDescription: t("move.parentDescription"),
      parentLabel: t("move.parentLabel"),
      submit: t("move.submit"),
      title: t("move.title"),
    }),
    [category?.name, t, tActions],
  );

  return (
    <SmallCategoryTreeMoveDialogView
      api={api}
      apiBasePath={apiBasePath}
      category={category}
      enabled={enabled}
      labels={labels}
      loading={loading}
      model={model}
      moveErrorCode={moveErrorCode}
      opened={opened}
      onClose={onClose}
      onMove={onMove}
    />
  );
}

export function SmallCategoryTreeMoveDialogView({
  api,
  apiBasePath,
  category,
  enabled = true,
  labels,
  loading = false,
  model,
  moveErrorCode,
  opened,
  onClose,
  onMove,
}: SmallCategoryTreeMoveDialogViewProps) {
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [pickerStatus, setPickerStatus] =
    useState<CategoryParentPickerStatus | null>(null);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setParentId(category?.parentId ?? "");
    setPickerStatus(null);
  }, [category?.id, category?.parentId, opened]);

  const normalizedParentId = normalizeParentId(parentId);
  const currentParentId = normalizeParentId(category?.parentId ?? "");
  const parentUnchanged = Boolean(category) && normalizedParentId === currentParentId;
  const localBlock = category
    ? isSmallCategoryTreeMoveTargetBlocked(
        model,
        category.id,
        normalizedParentId || null,
      )
    : null;
  const blockingErrorCode = getBlockingErrorCode({
    localBlock,
    parentUnchanged,
    pickerStatus,
  });
  const displayErrorCode =
    moveErrorCode ?? (blockingErrorCode === "unchanged" ? null : blockingErrorCode);
  const canSubmit =
    enabled &&
    Boolean(category) &&
    !loading &&
    blockingErrorCode == null &&
    !isPickerBusy(pickerStatus);

  return (
    <Modal opened={opened} title={labels.title} onClose={onClose} centered>
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          {category
            ? labels.description.replace("{name}", category.name)
            : labels.description}
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
          onChange={setParentId}
          onStatusChange={setPickerStatus}
        />
        {displayErrorCode ? (
          <Alert color="yellow" icon={<IconAlertTriangle aria-hidden="true" />}>
            {labels.errorMessages[displayErrorCode]}
          </Alert>
        ) : null}
        <Group justify="flex-end" gap="xs">
          <Button disabled={loading} variant="default" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button
            disabled={!canSubmit}
            loading={loading}
            onClick={() => {
              void onMove(normalizedParentId || null);
            }}
          >
            {labels.submit}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function getBlockingErrorCode({
  localBlock,
  parentUnchanged,
  pickerStatus,
}: {
  localBlock: "self" | "descendant" | null;
  parentUnchanged: boolean;
  pickerStatus: CategoryParentPickerStatus | null;
}): SmallCategoryTreeMoveDialogErrorCode | null {
  if (localBlock) {
    return localBlock;
  }

  if (pickerStatus?.blockingError) {
    return "stale";
  }

  if (pickerStatus?.selectedValueStatus === "disabled") {
    return pickerStatus.selectedOption?.dto?.disabledReason === "INACTIVE"
      ? "inactive"
      : "validationFailed";
  }

  if (pickerStatus?.selectedValueStatus === "missing" && !pickerStatus.loading) {
    return "missing";
  }

  if (parentUnchanged) {
    return "unchanged";
  }

  if (pickerStatus?.selectedValueStatus === "missing") {
    return "missing";
  }

  return null;
}

function isPickerBusy(status: CategoryParentPickerStatus | null): boolean {
  return Boolean(status?.loading || status?.loadingMore || status?.searchError);
}

function normalizeParentId(
  parentId: string | number | null | undefined,
): string {
  return String(parentId ?? "").trim();
}
