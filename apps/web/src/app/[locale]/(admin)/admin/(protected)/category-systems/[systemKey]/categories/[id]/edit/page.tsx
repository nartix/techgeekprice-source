import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CategoryScreenComposition } from "../../../../../../../../../../features/catalog/admin/categories/category-system/CategoryScreenComposition";
import {
  resolveCategoryRoute,
  resolveCategoryRouteMetadata,
} from "../../../../../../../../../../features/catalog/admin/categories/category-system/category-route-resolution";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ systemKey: string }>;
}): Promise<Metadata> {
  const { systemKey } = await params;
  const metadata = resolveCategoryRouteMetadata(systemKey);
  if (!metadata) notFound();
  const t = await getTranslations();
  return { title: t(metadata.metadataKey) };
}

export default async function GenericCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string; locale: string; systemKey: string }>;
}) {
  const { id, locale, systemKey } = await params;
  const resolution = resolveCategoryRoute({
    systemKey,
    routeFamilyKey: "generic",
    screen: "edit",
    locale,
    id,
  });
  if (resolution.status !== "ready" || resolution.identifier === undefined)
    notFound();
  return (
    <CategoryScreenComposition
      systemKey={systemKey}
      routeFamilyKey="generic"
      screen="edit"
      locale={resolution.locale}
      id={String(resolution.identifier)}
    />
  );
}
