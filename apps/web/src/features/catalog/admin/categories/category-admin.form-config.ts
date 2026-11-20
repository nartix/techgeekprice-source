import {
  defineAdminFormConfig,
  slugify,
} from "../../../platform/admin/forms";
import type {
  AdminCategoryDetailDto,
  AdminCategoryMutationDto,
} from "@tgp/contracts";
import { createElement } from "react";

import { CategoryParentField } from "./components/CategoryParentField";
import type { AdminCategoryListingConfig } from "./admin-category-listing.config";
import {
  mapCategoryDtoToFormValues,
  mapCategoryFormValuesToMutationDto,
} from "./mappers/category-admin.mapper";
import { createCategoryAdminSchema } from "./schemas/category-admin.schema";
import type { CategoryAdminFormValues } from "./types/category-admin.types";

type TranslationFn = (key: string) => string;

export function createCategoryAdminFormConfig(
  t: TranslationFn,
  tActions: TranslationFn,
  options: {
    config: AdminCategoryListingConfig;
    parentFieldEnabled?: boolean;
  },
) {
  const categoryConfig = options.config;

  return defineAdminFormConfig<
    CategoryAdminFormValues,
    AdminCategoryMutationDto,
    AdminCategoryMutationDto,
    AdminCategoryDetailDto
  >({
    cancelHref: categoryConfig.listHref,
    cancelLabel: tActions("cancel"),
    defaultValues: {
      active: true,
      id: undefined,
      name: "",
      parentId: "",
      slug: "",
      slugManuallyEdited: false,
    },
    errorMessage: t("form.errorMessage"),
    hiddenSubmitBehavior: "omit",
    loadErrorMessage: t("form.errorMessage"),
    loadErrorTitle: t("form.errorTitle"),
    loadingMessage: t("form.loading"),
    mapFormValuesToCreateRequest: mapCategoryFormValuesToMutationDto,
    mapFormValuesToUpdateRequest: mapCategoryFormValuesToMutationDto,
    mapRecordToFormValues: mapCategoryDtoToFormValues,
    passwordFields: { allow: false },
    resource: categoryConfig.resource,
    updateMethod: "patch",
    schema: createCategoryAdminSchema({
      nameRequired: t("validation.nameRequired"),
      nameSize: t("validation.nameSize"),
      parentIdInvalid: t("validation.parentIdInvalid"),
      selfParentInvalid: t("validation.selfParentInvalid"),
      slugInvalid: t("validation.slugInvalid"),
      slugRequired: t("validation.slugRequired"),
    }),
    sections: [
      {
        columns: 2,
        fields: [
          {
            dependsOn: ["id"],
            description: t("form.parentDescription"),
            disabledWhen: ({ mode, values }) =>
              options.parentFieldEnabled === false ||
              (mode === "edit" && Boolean(values.id) && values.parentId === values.id),
            label: t("fields.parentId"),
            name: "parentId",
            render: (ctx) =>
              createElement(CategoryParentField, {
                ...ctx,
                apiBasePath: categoryConfig.apiBasePath,
              }),
            type: "custom",
          },
          {
            autoFocus: true,
            label: t("fields.name"),
            name: "name",
            onValueChange: ({ setValue, value, values }) => {
              if (!values.slugManuallyEdited) {
                setValue("slug", slugify(String(value)), {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            },
            required: true,
            type: "text",
          },
          {
            label: t("fields.slug"),
            name: "slug",
            onValueChange: ({ setValue }) => {
              setValue("slugManuallyEdited", true, {
                shouldDirty: true,
                shouldValidate: false,
              });
            },
            required: true,
            type: "slug",
          },
          {
            label: t("fields.active"),
            name: "active",
            type: "switch",
          },
        ],
        id: "category",
        title: t("sections.category"),
      },
    ],
    serverErrorFieldMap: {
      DUPLICATE_CATEGORY_SLUG: "slug",
    },
    submitLabel: {
      create: t("form.createSubmit"),
      edit: t("form.editSubmit"),
    },
    successMessage: {
      create: t("form.createSuccess"),
      edit: t("form.editSuccess"),
    },
    title: {
      create: t("form.createTitle"),
      edit: t("form.editTitle"),
    },
  });
}
