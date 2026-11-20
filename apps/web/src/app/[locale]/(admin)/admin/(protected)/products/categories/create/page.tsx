import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CategoryScreenComposition } from "../../../../../../../../features/catalog/admin/categories/category-system/CategoryScreenComposition";
import { resolveCategoryRoute } from "../../../../../../../../features/catalog/admin/categories/category-system/category-route-resolution";

type ProductCategoryCreatePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.Metadata");

  return {
    title: t("productCategoriesTitle"),
  };
}

export default async function ProductCategoryCreatePage({
  params,
}: ProductCategoryCreatePageProps) {
  const { locale } = await params;
  const resolution = resolveCategoryRoute({
    systemKey: "catalogue",
    routeFamilyKey: "product-categories",
    screen: "create",
    locale,
  });

  if (resolution.status !== "ready") return null;

  return (
    <CategoryScreenComposition
      locale={resolution.locale}
      routeFamilyKey="product-categories"
      screen="create"
      systemKey="catalogue"
    />
  );
}
