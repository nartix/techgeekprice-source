import {
  defineAdminFormConfig,
  type AdminFieldOption,
  type AdminFormOptionLoaderApi,
} from "../../../platform/admin/forms";
import type {
  AdminPermissionOptionDto,
  AdminRoleOptionDto,
  AdminUserCreateDto,
  AdminUserDto,
  AdminUserMutationDto,
  SpringPageResponseDto,
} from "@tgp/contracts";
import {
  mapUserDtoToFormValues,
  mapUserFormValuesToCreateDto,
  mapUserFormValuesToMutationDto,
} from "./mappers/user-admin.mapper";
import { createUserAdminSchema } from "./schemas/user-admin.schema";
import type { UserAdminFormValues } from "./types/user-admin.types";

type TranslationFn = (key: string) => string;

const ROLE_OPTION_SORT = ["code,asc"];
const PERMISSION_OPTION_SORT = ["resource,asc", "action,asc", "code,asc"];

async function loadRoleOptions({
  api,
  search,
}: {
  api: AdminFormOptionLoaderApi;
  search?: string;
}): Promise<AdminFieldOption[]> {
  const response = await api.custom<SpringPageResponseDto<AdminRoleOptionDto>>({
    method: "get",
    query: {
      active: true,
      page: 0,
      q: optionSearch(search),
      size: 100,
      sort: ROLE_OPTION_SORT,
    },
    url: "/api/v1/admin/roles",
  });

  return response.data.map(roleToOption);
}

async function loadPermissionOptions({
  api,
  search,
}: {
  api: AdminFormOptionLoaderApi;
  search?: string;
}): Promise<AdminFieldOption[]> {
  const response = await api.custom<
    SpringPageResponseDto<AdminPermissionOptionDto>
  >({
    method: "get",
    query: {
      active: true,
      page: 0,
      q: optionSearch(search),
      size: 50,
      sort: PERMISSION_OPTION_SORT,
    },
    url: "/api/v1/admin/permissions",
  });

  return response.data.map(permissionToOption);
}

function roleToOption(role: AdminRoleOptionDto): AdminFieldOption {
  return {
    description: role.description ?? undefined,
    disabled: !role.active,
    label: labelWithCode(role.name, role.code),
    value: role.code,
  };
}

function permissionToOption(
  permission: AdminPermissionOptionDto,
): AdminFieldOption {
  return {
    description: permission.description ?? undefined,
    disabled: !permission.active,
    label: labelWithCode(permission.name, permission.code),
    meta: {
      action: permission.action,
      resource: permission.resource,
    },
    value: permission.code,
  };
}

function labelWithCode(name: string, code: string): string {
  return name && name !== code ? `${name} (${code})` : code;
}

function optionSearch(search: string | undefined): string | undefined {
  const trimmed = search?.trim();
  return trimmed ? trimmed : undefined;
}

export function createUserAdminFormConfig(
  t: TranslationFn,
  tActions: TranslationFn,
) {
  return defineAdminFormConfig<
    UserAdminFormValues,
    AdminUserCreateDto,
    AdminUserMutationDto,
    AdminUserDto
  >({
    cancelHref: "/admin/users",
    cancelLabel: tActions("cancel"),
    defaultValues: {
      active: true,
      email: "",
      confirmPassword: "",
      firstName: "",
      id: undefined,
      lastName: "",
      password: "",
      permissions: [],
      roles: [],
      username: "",
    },
    errorMessage: t("form.errorMessage"),
    hiddenSubmitBehavior: "omit",
    loadErrorMessage: t("form.errorMessage"),
    loadErrorTitle: t("form.errorTitle"),
    loadingMessage: t("form.loading"),
    mapFormValuesToCreateRequest: mapUserFormValuesToCreateDto,
    mapFormValuesToUpdateRequest: mapUserFormValuesToMutationDto,
    mapRecordToFormValues: mapUserDtoToFormValues,
    passwordFields: { allow: true },
    resource: "users",
    schema: ({ mode }) =>
      createUserAdminSchema(
        {
          emailInvalid: t("validation.emailInvalid"),
          emailRequired: t("validation.emailRequired"),
          emailSize: t("validation.emailSize"),
          firstNameSize: t("validation.firstNameSize"),
          lastNameSize: t("validation.lastNameSize"),
          passwordRequired: t("validation.passwordRequired"),
          passwordSize: t("validation.passwordSize"),
          passwordConfirmationMismatch: t(
            "validation.passwordConfirmationMismatch",
          ),
          passwordConfirmationRequired: t(
            "validation.passwordConfirmationRequired",
          ),
          permissionsSize: t("validation.permissionsSize"),
          rolesSize: t("validation.rolesSize"),
          usernameRequired: t("validation.usernameRequired"),
          usernameSize: t("validation.usernameSize"),
        },
        { mode },
      ),
    sections: [
      {
        columns: 2,
        fields: [
          {
            autoFocus: true,
            label: t("fields.username"),
            name: "username",
            required: true,
            type: "text",
          },
          {
            label: t("fields.email"),
            name: "email",
            required: true,
            type: "email",
          },
          {
            createOnly: true,
            description: t("form.passwordDescription"),
            inputProps: {
              autoComplete: "new-password",
              maxLength: 128,
              minLength: 8,
            },
            label: t("fields.password"),
            name: "password",
            required: true,
            type: "password",
          },
          {
            createOnly: true,
            inputProps: {
              autoComplete: "new-password",
              maxLength: 128,
              minLength: 8,
            },
            label: t("fields.confirmPassword"),
            name: "confirmPassword",
            required: true,
            type: "password",
            uiOnly: true,
          },
          {
            label: t("fields.firstName"),
            name: "firstName",
            type: "text",
          },
          {
            label: t("fields.lastName"),
            name: "lastName",
            type: "text",
          },
          {
            // Full user edits use the write endpoint; status-only moderators use detail status actions.
            label: t("fields.active"),
            name: "active",
            type: "switch",
          },
        ],
        id: "account",
        title: t("sections.account"),
      },
      {
        columns: 1,
        description: t("sections.accessDescription"),
        fields: [
          {
            description: t("form.rolesDescription"),
            label: t("fields.roles"),
            loadOptions: loadRoleOptions,
            name: "roles",
            type: "multi-select",
          },
          {
            description: t("form.permissionsDescription"),
            label: t("fields.permissions"),
            loadOptions: loadPermissionOptions,
            name: "permissions",
            type: "multi-select",
          },
        ],
        id: "access",
        title: t("sections.access"),
      },
    ],
    serverErrorFieldMap: {
      USER_ALREADY_EXISTS: "root",
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
