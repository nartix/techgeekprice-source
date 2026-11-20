"use client";

import type { BaseRecord } from "@refinedev/core";
import { useMemo } from "react";

import type {
  AdminDetailBaseContext,
  AdminDetailFieldRenderContext,
  AdminDetailPanel,
  AdminResourceDetailResult,
  AdminResourceDetailViewResult,
} from "../types/admin-detail.types";
import {
  isAdminDetailActionVisible,
  isAdminDetailFieldVisible,
  isAdminDetailPanelVisible,
  isAdminDetailSectionVisible,
} from "../utils/adminDetailVisibility";
import {
  renderAdminDetailFieldValue,
  resolveAdminDetailFieldValue,
} from "../utils/adminDetailValues";

export function useAdminResourceDetailViewResult<
  TRaw extends BaseRecord,
  TView,
>(
  result: AdminResourceDetailResult<TRaw, TView>,
): AdminResourceDetailViewResult<TRaw, TView> {
  return useMemo(() => {
    if (!result.rawRecord || !result.record) {
      return {
        ...result,
        actions: [],
        isEmptyContent: false,
        panels: [],
        sections: [],
      };
    }

    const baseContext: AdminDetailBaseContext<TRaw, TView> = {
      id: result.id,
      identity: result.identity,
      locale: result.locale,
      metadata: result.metadata,
      permissions: result.identity?.permissions ?? [],
      record: result.record,
      resource: result.resource,
      roles: result.identity?.roles ?? [],
      rawRecord: result.rawRecord,
    };
    const fieldContext: AdminDetailFieldRenderContext<TRaw, TView> =
      baseContext;
    const sections = result.config.sections
      .filter((section) =>
        isAdminDetailSectionVisible(section, fieldContext),
      )
      .map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        columns: section.columns ?? 1,
        fields: section.fields
          .filter((field) => isAdminDetailFieldVisible(field, fieldContext))
          .map((field) => {
            const value = resolveAdminDetailFieldValue(field, fieldContext);
            const renderContext = {
              ...fieldContext,
              field,
              value,
            };

            return {
              field,
              id: field.id,
              label: field.label,
              node: renderAdminDetailFieldValue(field, renderContext),
              value,
            };
          }),
      }))
      .filter((section) => section.fields.length > 0);
    const panels = (result.config.panels ?? []).filter((panel) =>
      isRenderablePanel(panel, fieldContext),
    );
    const actions = (result.config.actions ?? []).filter((action) =>
      isAdminDetailActionVisible(action, fieldContext),
    );
    const title = result.config.title(fieldContext);
    const description = result.config.description?.(fieldContext);
    const isEmptyContent =
      sections.length === 0 && panels.length === 0 && actions.length === 0;

    return {
      ...result,
      actions,
      baseContext,
      description,
      isEmptyContent,
      panels,
      sections,
      state: result.state === "ready" && isEmptyContent ? "empty" : result.state,
      title,
    };
  }, [result]);
}

function isRenderablePanel<TRaw, TView>(
  panel: AdminDetailPanel<TRaw, TView>,
  context: AdminDetailFieldRenderContext<TRaw, TView>,
): boolean {
  if (!isAdminDetailPanelVisible(panel, context)) {
    return false;
  }

  if ("isSupported" in panel && panel.isSupported) {
    return panel.isSupported(context);
  }

  return true;
}
