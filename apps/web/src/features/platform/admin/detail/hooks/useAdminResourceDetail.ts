"use client";

import { useOne } from "@refinedev/core";
import type { BaseRecord, HttpError } from "@refinedev/core";
import { useMemo } from "react";

import { getAdminResourceMetadata } from "../../resources/adminResources";
import { canPerformAdminAction } from "../../utils/adminPermissions";
import type {
  AdminResourceDetailResult,
  UseAdminResourceDetailOptions,
} from "../types/admin-detail.types";
import { isAdminDetailNotFoundError } from "../utils/adminDetailErrors";
import { selectAdminDetailState } from "../utils/adminDetailState";

export function useAdminResourceDetail<
  TRaw extends BaseRecord,
  TView = TRaw,
>({
  config,
  id,
  identity,
  locale,
  queryEnabled: callerQueryEnabled = true,
}: UseAdminResourceDetailOptions<TRaw, TView>): AdminResourceDetailResult<
  TRaw,
  TView
> {
  const metadata = getAdminResourceMetadata(config.resource);
  const normalizedId = (id ?? "").trim();
  const canShow = canPerformAdminAction(identity, config.resource, "show");
  const hasNonEmptyId = normalizedId.length > 0;
  const passesResourceValidation = config.validateRouteId
    ? config.validateRouteId(normalizedId)
    : hasNonEmptyId;
  const isInvalidRouteId = !hasNonEmptyId || !passesResourceValidation;
  const queryEnabled = canShow && !isInvalidRouteId && callerQueryEnabled;
  const detail = useOne<TRaw, HttpError>({
    resource: config.resource,
    id: normalizedId,
    queryOptions: {
      enabled: queryEnabled,
    },
  });
  const rawRecord = queryEnabled
    ? ((detail.result ?? detail.query.data) as TRaw | undefined)
    : undefined;
  const record = useMemo(() => {
    if (!rawRecord) {
      return undefined;
    }

    return config.transformRecord
      ? config.transformRecord(rawRecord, locale)
      : (rawRecord as unknown as TView);
  }, [config, locale, rawRecord]);
  const error = queryEnabled && detail.query.isError ? detail.query.error : null;
  const isLoading =
    queryEnabled &&
    (detail.query.isLoading || detail.query.isFetching) &&
    !rawRecord;
  const isNotFound = isAdminDetailNotFoundError(error);
  const state = selectAdminDetailState({
    canRead: canShow,
    error,
    hasRecord: Boolean(rawRecord && record),
    isInvalidRouteId,
    isLoading,
    isNotFound,
  });
  const canRetry = queryEnabled && typeof detail.query.refetch === "function";

  return {
    config,
    error,
    id: normalizedId,
    identity,
    isFetching: queryEnabled ? detail.query.isFetching : false,
    isForbidden: !canShow,
    isInvalidRouteId,
    isLoading,
    labels: config.labels,
    locale,
    metadata,
    onRetry: canRetry ? () => void detail.query.refetch() : undefined,
    queryEnabled,
    record,
    resource: config.resource,
    rawRecord,
    state,
  };
}
