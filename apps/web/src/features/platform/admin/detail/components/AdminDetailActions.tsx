"use client";

import { Button, Group } from "@mantine/core";
import type { BaseRecord } from "@refinedev/core";
import { useState } from "react";

import { Link } from "../../../../../i18n/navigation";
import { AdminConfirmDialog } from "../../components/AdminConfirmDialog";
import type {
  AdminDetailAction,
  AdminDetailActionContext,
  AdminDetailActionNotification,
  AdminDetailBaseContext,
} from "../types/admin-detail.types";

interface AdminDetailActionsProps<TRaw extends BaseRecord, TView> {
  actions: Array<AdminDetailAction<TRaw, TView>>;
  context: AdminDetailBaseContext<TRaw, TView>;
  notify?: (notification: AdminDetailActionNotification) => void;
  redirect?: (href: string) => void;
  refetch?: () => Promise<unknown> | unknown;
}

export function AdminDetailActions<TRaw extends BaseRecord, TView>({
  actions,
  context,
  notify,
  redirect,
  refetch,
}: AdminDetailActionsProps<TRaw, TView>) {
  const [pendingAction, setPendingAction] = useState<
    AdminDetailAction<TRaw, TView> | null
  >(null);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);

  if (actions.length === 0) {
    return null;
  }

  async function runAction(action: AdminDetailAction<TRaw, TView>) {
    if (!action.onClick) {
      return;
    }

    setRunningActionId(action.id);

    try {
      const actionContext: AdminDetailActionContext<TRaw, TView> = {
        ...context,
        notify,
        redirect,
        refetch,
      };

      await action.onClick(actionContext);
    } finally {
      setRunningActionId(null);
    }
  }

  return (
    <>
      <Group gap="xs" wrap="wrap">
        {actions.map((action) => {
          const actionContext = createActionContext(action, context, {
            notify,
            redirect,
            refetch,
          });
          const href = getHref(action, actionContext);
          const confirmation = getConfirmation(action, context, {
            notify,
            redirect,
            refetch,
          });
          const button = (
            <Button
              color={action.color}
              loading={action.loading || runningActionId === action.id}
              onClick={
                href
                  ? undefined
                  : () => {
                      if (confirmation) {
                        setPendingAction(action);
                        return;
                      }

                      void runAction(action);
                    }
              }
              size="sm"
              variant={action.variant ?? "subtle"}
            >
              {action.label}
            </Button>
          );

          return href ? (
            <Button
              key={action.id}
              color={action.color}
              component={Link}
              href={href}
              locale={context.locale}
              size="sm"
              variant={action.variant ?? "subtle"}
            >
              {action.label}
            </Button>
          ) : (
            <span key={action.id}>{button}</span>
          );
        })}
      </Group>
      {pendingAction ? (
        <AdminConfirmDialog
          opened
          title={
            getConfirmation(pendingAction, context, {
              notify,
              redirect,
              refetch,
            })?.title ?? ""
          }
          message={
            getConfirmation(pendingAction, context, {
              notify,
              redirect,
              refetch,
            })?.message ?? ""
          }
          confirmLabel={
            getConfirmation(pendingAction, context, {
              notify,
              redirect,
              refetch,
            })?.confirmLabel ?? ""
          }
          cancelLabel={
            getConfirmation(pendingAction, context, {
              notify,
              redirect,
              refetch,
            })?.cancelLabel ?? ""
          }
          destructive={
            getConfirmation(pendingAction, context, {
              notify,
              redirect,
              refetch,
            })?.destructive
          }
          loading={runningActionId === pendingAction.id}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            const action = pendingAction;

            setPendingAction(null);
            void runAction(action);
          }}
        />
      ) : null}
    </>
  );
}

function getConfirmation<TRaw extends BaseRecord, TView>(
  action: AdminDetailAction<TRaw, TView>,
  context: AdminDetailBaseContext<TRaw, TView>,
  helpers: Pick<
    AdminDetailActionContext<TRaw, TView>,
    "notify" | "redirect" | "refetch"
  >,
) {
  if (!action.confirmation) {
    return undefined;
  }

  if (typeof action.confirmation === "function") {
    return action.confirmation({ ...context, ...helpers });
  }

  return action.confirmation;
}

function getHref<TRaw extends BaseRecord, TView>(
  action: AdminDetailAction<TRaw, TView>,
  context: AdminDetailActionContext<TRaw, TView>,
): string | undefined {
  if (!action.href) {
    return undefined;
  }

  return typeof action.href === "function" ? action.href(context) : action.href;
}

function createActionContext<TRaw extends BaseRecord, TView>(
  _action: AdminDetailAction<TRaw, TView>,
  context: AdminDetailBaseContext<TRaw, TView>,
  helpers: Pick<
    AdminDetailActionContext<TRaw, TView>,
    "notify" | "redirect" | "refetch"
  >,
): AdminDetailActionContext<TRaw, TView> {
  return {
    ...context,
    ...helpers,
  };
}
