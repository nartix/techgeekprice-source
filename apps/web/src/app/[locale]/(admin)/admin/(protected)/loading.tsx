import { getTranslations } from "next-intl/server";

import { AdminLoading } from "../../../../../features/platform/admin/components/AdminLoading";

export default async function ProtectedAdminLoading() {
  const t = await getTranslations("Admin.States");

  return <AdminLoading label={t("loading")} />;
}
