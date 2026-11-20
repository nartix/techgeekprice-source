import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CategoryScreenComposition } from "../../../../../../../../features/catalog/admin/categories/category-system/CategoryScreenComposition";
import {
  resolveCategoryRoute,
  resolveCategoryRouteMetadata,
} from "../../../../../../../../features/catalog/admin/categories/category-system/category-route-resolution";

type Props = {
  params: Promise<{ locale: string; systemKey: string }>;
  searchParams: Promise<{ parentId?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { systemKey } = await params;
  const metadata = resolveCategoryRouteMetadata(systemKey);

  if (!metadata) {
    notFound();
  }

  const t = await getTranslations();

  return { title: t(metadata.metadataKey) };
}

export default async function GenericCategoryListPage({
  params,
  searchParams,
}: Props) {
  const { locale, systemKey } = await params;
  const { parentId } = await searchParams;
  const resolution = resolveCategoryRoute({
    systemKey,
    routeFamilyKey: "generic",
    screen: "list",
    locale,
    parentId: typeof parentId === "string" ? parentId : undefined,
  });

  if (resolution.status !== "ready") notFound();

  return (
    <CategoryScreenComposition
      systemKey={systemKey}
      routeFamilyKey="generic"
      screen="list"
      locale={resolution.locale}
    />
  );
}
