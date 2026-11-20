import type { BaseRecord, HttpError } from "@refinedev/core";
import type { ReactNode } from "react";

import type { routing } from "../../../../../i18n/routing";
import type {
  AdminIdentity,
  AdminResourceAction,
  AdminResourceMetadata,
} from "../../types/admin.types";

export type AdminDetailLocale = (typeof routing.locales)[number];
export type AdminDetailResource = AdminResourceMetadata["name"];

export type AdminDetailState =
  | "forbidden"
  | "invalid"
  | "loading"
  | "not-found"
  | "error"
  | "empty"
  | "ready";

export type AdminDetailResolvedValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type AdminDetailRenderable = Exclude<ReactNode, PromiseLike<unknown>>;

export type AdminDetailSensitiveKind =
  | "roles"
  | "permissions"
  | "account-state"
  | "capability-flags"
  | "internal-identifier";

export interface AdminDetailBaseContext<TRaw, TView> {
  id: string;
  identity: AdminIdentity | null;
  locale: AdminDetailLocale;
  metadata: AdminResourceMetadata;
  permissions: string[];
  record: TView;
  resource: AdminDetailResource;
  roles: string[];
  rawRecord: TRaw;
}

export interface AdminDetailFieldRenderContext<TRaw, TView>
  extends AdminDetailBaseContext<TRaw, TView> {
  field?: AdminDetailField<TRaw, TView>;
  value?: AdminDetailResolvedValue;
}

export interface AdminDetailActionContext<TRaw, TView>
  extends AdminDetailBaseContext<TRaw, TView> {
  notify?: (notification: AdminDetailActionNotification) => void;
  redirect?: (href: string) => void;
  refetch?: () => Promise<unknown> | unknown;
}

export interface AdminDetailActionNotification {
  message: string;
  description?: string;
  type?: "success" | "error" | "progress";
}

export interface AdminDetailPanelContext<TRaw, TView, TPanelData = unknown>
  extends AdminDetailBaseContext<TRaw, TView> {
  data?: TPanelData;
}

export interface AdminDetailRuntimeContext<TRaw, TView>
  extends AdminDetailBaseContext<TRaw, TView> {
  refetch: () => Promise<unknown> | unknown;
}

export type AdminDetailVisibilityContext<TRaw, TView> =
  AdminDetailFieldRenderContext<TRaw, TView>;

export type AdminDetailVisibilityRule<TRaw, TView> = (
  ctx: AdminDetailVisibilityContext<TRaw, TView>,
) => boolean;

export type AdminDetailValueResolver<TRaw, TView> = (
  ctx: AdminDetailFieldRenderContext<TRaw, TView>,
) => AdminDetailResolvedValue;

export type AdminDetailFieldRenderer<TRaw, TView> = (
  ctx: AdminDetailFieldRenderContext<TRaw, TView>,
) => AdminDetailRenderable;

export type AdminDetailSafeRendererRequirement<TRaw, TView> =
  | {
      sensitive?: false;
      sensitiveKind?: never;
      safeRenderer?: never;
    }
  | {
      sensitive: true;
      sensitiveKind: AdminDetailSensitiveKind;
      safeRenderer: true;
      render: AdminDetailFieldRenderer<TRaw, TView>;
    };

export type AdminDetailFieldBase<TRaw, TView> = {
  id: string;
  label: string;
  emptyFallback?: string;
  permissions?: string[];
  roles?: string[];
  value?: AdminDetailValueResolver<TRaw, TView>;
  valueKey?: keyof TView;
  visibleWhen?: AdminDetailVisibilityRule<TRaw, TView>;
  render?: AdminDetailFieldRenderer<TRaw, TView>;
};

export type AdminDetailField<TRaw, TView> = AdminDetailFieldBase<TRaw, TView> &
  AdminDetailSafeRendererRequirement<TRaw, TView>;

export type AdminDetailKeyField<
  TRaw,
  TView,
  TKey extends keyof TView,
> = Omit<AdminDetailFieldBase<TRaw, TView>, "value" | "valueKey"> &
  AdminDetailSafeRendererRequirement<TRaw, TView> & {
  valueKey: TKey;
};

export type AdminDetailComputedField<TRaw, TView> = Omit<
  AdminDetailFieldBase<TRaw, TView>,
  "valueKey"
> &
  AdminDetailSafeRendererRequirement<TRaw, TView> & {
  value: AdminDetailValueResolver<TRaw, TView>;
};

export interface AdminDetailSection<TRaw, TView> {
  id: string;
  title: string;
  description?: string;
  fields: Array<AdminDetailField<TRaw, TView>>;
  columns?: 1 | 2 | 3;
  visibleWhen?: AdminDetailVisibilityRule<TRaw, TView>;
}

export interface AdminDetailPanelLabels {
  loading?: string;
  empty?: string;
  errorTitle: string;
  errorMessage: string;
}

export type AdminDetailPanelState =
  | "unsupported"
  | "loading"
  | "empty"
  | "error"
  | "ready";

export interface AdminCustomDetailPanel<TRaw, TView, TPanelData = unknown> {
  id: string;
  title: string;
  description?: string;
  labels: AdminDetailPanelLabels;
  load?(
    ctx: AdminDetailPanelContext<TRaw, TView>
  ): Promise<TPanelData> | TPanelData;
  isEmpty?(
    data: TPanelData,
    ctx: AdminDetailPanelContext<TRaw, TView, TPanelData>
  ): boolean;
  render(
    ctx: AdminDetailPanelContext<TRaw, TView, TPanelData>
  ): AdminDetailRenderable;
  visibleWhen?: AdminDetailVisibilityRule<TRaw, TView>;
}

export interface AdminRelatedDetailPanel<TRaw, TView, TRelated extends BaseRecord> {
  id: string;
  title: string;
  description?: string;
  resource: AdminDetailResource;
  labels: AdminDetailPanelLabels;
  query: {
    filters?: Array<{ field: string; operator: string; value: unknown }>;
    sorters?: Array<{ field: string; order: "asc" | "desc" }>;
  };
  isSupported(ctx: AdminDetailPanelContext<TRaw, TView>): boolean;
  render(ctx: AdminDetailPanelContext<TRaw, TView, TRelated[]>): AdminDetailRenderable;
  visibleWhen?: AdminDetailVisibilityRule<TRaw, TView>;
}

export type AdminDetailPanel<TRaw, TView> =
  | AdminCustomDetailPanel<TRaw, TView, unknown>
  | AdminRelatedDetailPanel<TRaw, TView, BaseRecord>;

export interface AdminDetailActionConfirmation {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
}

export type AdminDetailActionConfirmationResolver<TRaw, TView> =
  | AdminDetailActionConfirmation
  | ((
      ctx: AdminDetailActionContext<TRaw, TView>,
    ) => AdminDetailActionConfirmation);

export type AdminDetailActionHrefResolver<TRaw, TView> =
  | string
  | ((ctx: AdminDetailActionContext<TRaw, TView>) => string);

export interface AdminDetailAction<TRaw, TView> {
  id: string;
  label: string;
  kind: "navigation" | "mutation" | "custom";
  href?: AdminDetailActionHrefResolver<TRaw, TView>;
  color?: string;
  variant?: "filled" | "light" | "outline" | "subtle" | "default";
  confirmation?: AdminDetailActionConfirmationResolver<TRaw, TView>;
  permissions?: string[];
  resourceAction?: AdminResourceAction;
  roles?: string[];
  visibleWhen?: AdminDetailVisibilityRule<TRaw, TView>;
  isSupported?: AdminDetailVisibilityRule<TRaw, TView>;
  loading?: boolean;
  onClick?: (ctx: AdminDetailActionContext<TRaw, TView>) => Promise<void> | void;
}

export interface AdminDetailLabels {
  loading: string;
  forbiddenTitle: string;
  forbiddenMessage: string;
  invalidTitle: string;
  invalidMessage: string;
  notFoundTitle: string;
  notFoundMessage: string;
  errorTitle: string;
  errorMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  retry: string;
}

export interface AdminDetailDefinition<
  TRaw extends BaseRecord,
  TView = TRaw,
> {
  resource: AdminDetailResource;
  labels: AdminDetailLabels;
  title: (ctx: AdminDetailFieldRenderContext<TRaw, TView>) => string;
  description?: (ctx: AdminDetailFieldRenderContext<TRaw, TView>) => string;
  transformRecord?: (record: TRaw, locale: AdminDetailLocale) => TView;
  validateRouteId?: (id: string) => boolean;
  sections: Array<AdminDetailSection<TRaw, TView>>;
  panels?: Array<AdminDetailPanel<TRaw, TView>>;
  actions?: Array<AdminDetailAction<TRaw, TView>>;
}

export interface UseAdminResourceDetailOptions<
  TRaw extends BaseRecord,
  TView = TRaw,
> {
  config: AdminDetailDefinition<TRaw, TView>;
  id?: string | null;
  identity: AdminIdentity | null;
  locale: AdminDetailLocale;
  /** Optional caller gate; defaults to true for every existing detail. */
  queryEnabled?: boolean;
}

export interface AdminResourceDetailResult<TRaw extends BaseRecord, TView> {
  config: AdminDetailDefinition<TRaw, TView>;
  error: HttpError | unknown | null;
  id: string;
  identity: AdminIdentity | null;
  isFetching: boolean;
  isForbidden: boolean;
  isInvalidRouteId: boolean;
  isLoading: boolean;
  labels: AdminDetailLabels;
  locale: AdminDetailLocale;
  metadata: AdminResourceMetadata;
  onRetry?: () => void;
  queryEnabled: boolean;
  record?: TView;
  resource: AdminDetailResource;
  rawRecord?: TRaw;
  state: AdminDetailState;
}

export interface AdminDetailResolvedField<TRaw, TView> {
  field: AdminDetailField<TRaw, TView>;
  id: string;
  label: string;
  node: AdminDetailRenderable;
  value: AdminDetailResolvedValue;
}

export interface AdminDetailResolvedSection<TRaw, TView> {
  id: string;
  title: string;
  description?: string;
  columns: 1 | 2 | 3;
  fields: Array<AdminDetailResolvedField<TRaw, TView>>;
}

export interface AdminResourceDetailViewResult<TRaw extends BaseRecord, TView>
  extends AdminResourceDetailResult<TRaw, TView> {
  actions: Array<AdminDetailAction<TRaw, TView>>;
  baseContext?: AdminDetailBaseContext<TRaw, TView>;
  description?: string;
  isEmptyContent: boolean;
  panels: Array<AdminDetailPanel<TRaw, TView>>;
  sections: Array<AdminDetailResolvedSection<TRaw, TView>>;
  title?: string;
}

export function defineAdminDetailConfig<
  TRaw extends BaseRecord,
  TView = TRaw,
>(
  config: AdminDetailDefinition<TRaw, TView>,
): AdminDetailDefinition<TRaw, TView> {
  return config;
}

export function detailField<
  TRaw,
  TView,
  TKey extends keyof TView,
>(
  config: AdminDetailKeyField<TRaw, TView, TKey>,
): AdminDetailField<TRaw, TView> {
  return config;
}

export function detailComputedField<TRaw, TView>(
  config: AdminDetailComputedField<TRaw, TView>,
): AdminDetailField<TRaw, TView> {
  return config;
}

export function detailSection<TRaw, TView>(
  config: AdminDetailSection<TRaw, TView>,
): AdminDetailSection<TRaw, TView> {
  return config;
}

export function customDetailPanel<TRaw, TView, TPanelData = unknown>(
  config: AdminCustomDetailPanel<TRaw, TView, TPanelData>,
): AdminCustomDetailPanel<TRaw, TView, TPanelData> {
  return config;
}

export function relatedAdminPanel<
  TRaw,
  TView,
  TRelated extends BaseRecord,
>(
  config: AdminRelatedDetailPanel<TRaw, TView, TRelated>,
): AdminRelatedDetailPanel<TRaw, TView, TRelated> {
  return config;
}

export function adminDetailAction<TRaw, TView>(
  config: AdminDetailAction<TRaw, TView>,
): AdminDetailAction<TRaw, TView> {
  return config;
}
