"use client";

import { useTranslations } from "next-intl";

import { AdminForbidden } from "../../../../platform/admin/components/AdminForbidden";
import type { AdminLocale } from "../types/category-admin.types";
import { AdminCategoryList } from "../components/CategoryList";
import { CategoryDetail } from "../components/CategoryDetail";
import { CategoryForm } from "../components/CategoryForm";
import { SmallCategoryTreePage } from "../tree/components/SmallCategoryTreePage";
import { getAdminIdentity } from "../../../../platform/admin/session/adminIdentityStore";
import { CategorySystemRuntimeProvider } from "./CategorySystemRuntimeProvider";
import { categorySystemRegistry } from "./category-system.registry";
import type {
  CategoryRouteFamilyKey,
  CategoryScreen,
  CategorySystemDefinition,
} from "./category-system.types";

import { createCategoryListingConfig } from "../admin-category-listing.config";

export function CategoryScreenComposition({
  systemKey,
  routeFamilyKey,
  screen,
  locale,
  id,
  definition,
}: {
  readonly systemKey: string;
  readonly routeFamilyKey: CategoryRouteFamilyKey;
  readonly screen: CategoryScreen;
  readonly locale: AdminLocale;
  readonly id?: string;
  /** A test-only or server-resolved definition; never registered by this component. */
  readonly definition?: CategorySystemDefinition<string>;
}) {
  const resolvedDefinition =
    definition ?? categorySystemRegistry.getBySystemKey(systemKey);
  const identity = getAdminIdentity();
  const tStates = useTranslations("Admin.States");

  if (
    !resolvedDefinition ||
    resolvedDefinition.systemKey !== systemKey ||
    !resolvedDefinition.screens[screen]
  ) {
    return null;
  }

  const config = createCategoryListingConfig(
    resolvedDefinition,
    routeFamilyKey,
  );

  const permission =
    resolvedDefinition.operationPermissions[
      screen === "detail" ? "get" : screen === "edit" ? "patch" : screen
    ];

  if (!identity?.permissions.includes(permission)) {
    return (
      <AdminForbidden
        message={tStates("forbiddenMessage")}
        title={tStates("forbiddenTitle")}
      />
    );
  }

  const content = (() => {
    switch (screen) {
      case "list":
        return (
          <AdminCategoryList config={config} locale={locale} runtimeProvided />
        );
      case "tree":
        return (
          <SmallCategoryTreePage
            config={config}
            locale={locale}
            runtimeProvided
          />
        );
      case "create":
        return (
          <CategoryForm
            config={config}
            locale={locale}
            mode="create"
            runtimeProvided
          />
        );
      case "detail":
        return id ? (
          <CategoryDetail
            config={config}
            id={id}
            locale={locale}
            runtimeProvided
          />
        ) : null;
      case "edit":
        return id ? (
          <CategoryForm
            config={config}
            id={id}
            locale={locale}
            mode="edit"
            runtimeProvided
          />
        ) : null;
    }
  })();

  return (
    <CategorySystemRuntimeProvider
      definition={resolvedDefinition}
      identityPermissions={identity?.permissions}
    >
      {content}
    </CategorySystemRuntimeProvider>
  );
}
