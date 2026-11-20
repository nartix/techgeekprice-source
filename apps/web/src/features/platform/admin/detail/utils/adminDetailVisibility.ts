import type {
  AdminDetailAction,
  AdminDetailField,
  AdminDetailFieldRenderContext,
  AdminDetailPanel,
  AdminDetailSection,
} from "../types/admin-detail.types";
import { canPerformAdminAction } from "../../utils/adminPermissions";

export function isAdminDetailFieldVisible<TRaw, TView>(
  field: AdminDetailField<TRaw, TView>,
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): boolean {
  return isVisibleByCommonRules(field, context);
}

export function isAdminDetailSectionVisible<TRaw, TView>(
  section: AdminDetailSection<TRaw, TView>,
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): boolean {
  return isVisibleByCommonRules(section, context);
}

export function isAdminDetailPanelVisible<TRaw, TView>(
  panel: AdminDetailPanel<TRaw, TView>,
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): boolean {
  return isVisibleByCommonRules(panel, context);
}

export function isAdminDetailActionVisible<TRaw, TView>(
  action: AdminDetailAction<TRaw, TView>,
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): boolean {
  return (
    isVisibleByCommonRules(action, context) &&
    (action.resourceAction
      ? canPerformAdminAction(
          context.identity,
          context.resource,
          action.resourceAction,
        )
      : true) &&
    (action.isSupported ? action.isSupported(context) : true)
  );
}

function isVisibleByCommonRules<TRaw, TView>(
  item: {
    permissions?: string[];
    roles?: string[];
    visibleWhen?: (context: AdminDetailFieldRenderContext<TRaw, TView>) => boolean;
  },
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): boolean {
  if (!hasEvery(context.permissions, item.permissions)) {
    return false;
  }

  if (!hasEvery(context.roles, item.roles)) {
    return false;
  }

  return item.visibleWhen ? item.visibleWhen(context) : true;
}

function hasEvery(actual: string[], expected: string[] | undefined): boolean {
  return !expected || expected.every((value) => actual.includes(value));
}
