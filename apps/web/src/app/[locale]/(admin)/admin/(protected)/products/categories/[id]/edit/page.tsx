import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { CategoryScreenComposition } from "../../../../../../../../../features/catalog/admin/categories/category-system/CategoryScreenComposition";
import { resolveCategoryRoute } from "../../../../../../../../../features/catalog/admin/categories/category-system/category-route-resolution";

type ProductCategoryEditPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("productCategoriesTitle"),
  };
}

export default async function ProductCategoryEditPage({
  params,
}: ProductCategoryEditPageProps) {
  const { id, locale } = await params;
  const resolution = resolveCategoryRoute({
    systemKey: "catalogue",
    routeFamilyKey: "product-categories",
    screen: "edit",
    locale,
    id,
  });

  if (resolution.status !== "ready" || resolution.identifier === undefined) {
    notFound();
  }

  return (
    <CategoryScreenComposition
      id={String(resolution.identifier)}
      locale={resolution.locale}
      routeFamilyKey="product-categories"
      screen="edit"
      systemKey="catalogue"
    />
  );
}
