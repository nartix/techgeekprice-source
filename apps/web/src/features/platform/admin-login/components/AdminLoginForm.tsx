"use client";

import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useMounted } from "@mantine/hooks";
import { IconShieldLock } from "@tabler/icons-react";
import { createAdminAuthClient } from "@tgp/api-client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { createZodFormResolver } from "../../admin/forms/createZodFormResolver";
import { createAdminAuthProvider } from "../../admin/providers/adminAuthProvider";
import {
  adminLoginSchema,
  type AdminLoginValues,
} from "../schemas/admin-login.schema";
import classes from "./AdminLoginForm.module.css";

type Locale = "en-CA" | "en-US" | "fr-CA";

interface AdminLoginFormProps {
  apiBaseUrl: string;
  locale: Locale;
  demoEnabled?: boolean;
  authProvider?: {
    login?: (values: AdminLoginValues) => Promise<{
      success: boolean;
      redirectTo?: string;
      error?: Error;
    }>;
  };
}

export function AdminLoginForm({
  apiBaseUrl,
  locale,
  authProvider,
  demoEnabled = false,
}: AdminLoginFormProps) {
  const t = useTranslations("Admin.Login");
  const router = useRouter();
  const mounted = useMounted();
  const [formError, setFormError] = useState<string | null>(null);
  const provider = useMemo(
    () =>
      authProvider ??
      createAdminAuthProvider({
        authClient: createAdminAuthClient({ baseUrl: apiBaseUrl }),
        locale,
      }),
    [apiBaseUrl, authProvider, locale],
  );
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    setValue,
  } = useForm<AdminLoginValues>({
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
    resolver: createZodFormResolver<AdminLoginValues>(adminLoginSchema),
  });

  async function onSubmit(values: AdminLoginValues) {
    setFormError(null);
    const result = await provider.login?.(values);

    if (result?.success) {
      router.push(result.redirectTo ?? `/${locale}/admin`);
      return;
    }

    const errorKey =
      result?.error?.name === "AdminForbiddenError"
        ? "errors.forbidden"
        : result?.error?.name === "AdminSessionVerificationError"
          ? "errors.sessionVerification"
          : result?.error?.name === "AdminApiUnavailableError"
            ? "errors.apiUnavailable"
            : "errors.generic";

    setValue("password", "");
    setFormError(t(errorKey));
  }

  return (
    <form
      className={classes.card}
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <Stack gap="xl">
        <Stack align="center" className={classes.header} gap="md">
          <ThemeIcon className={classes.icon} radius="xl" size={56}>
            <IconShieldLock aria-hidden="true" size={34} stroke={1.75} />
          </ThemeIcon>
          <Stack align="center" gap={4}>
            <Title className={classes.title} order={1}>
              {t("title")}
            </Title>
            <Text className={classes.subtitle}>{t("subtitle")}</Text>
          </Stack>
        </Stack>
        {demoEnabled ? (
          <Stack className={classes.demo} gap="sm">
            <Text fw={700}>{t("demo.title")}</Text>
            <Text size="sm">{t("demo.description")}</Text>
            <Text size="sm">
              {t("demo.credentials", { username: "demo", password: "demo" })}
            </Text>
            <Button
              classNames={{ label: classes.demoButtonLabel }}
              color="indigo.8"
              fullWidth
              size="md"
              disabled={!mounted || isSubmitting}
              onClick={() => {
                setFormError(null);
                setValue("usernameOrEmail", "demo", { shouldValidate: true });
                setValue("password", "demo", { shouldValidate: true });
              }}
              type="button"
              variant="filled"
            >
              {t("demo.useAccount")}
            </Button>
          </Stack>
        ) : null}
        {formError ? (
          <Alert className={classes.alert} color="red">
            {formError}
          </Alert>
        ) : null}
        <Controller
          control={control}
          name="usernameOrEmail"
          render={({ field }) => (
            <TextInput
              {...field}
              autoComplete="username"
              classNames={{
                error: classes.fieldError,
                input: classes.input,
                label: classes.label,
              }}
              error={
                errors.usernameOrEmail
                  ? t("errors.usernameRequired")
                  : undefined
              }
              label={t("usernameLabel")}
              placeholder={t("usernamePlaceholder")}
              required
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <PasswordInput
              {...field}
              autoComplete="current-password"
              classNames={{
                error: classes.fieldError,
                input: classes.input,
                label: classes.label,
              }}
              error={errors.password ? t("errors.passwordRequired") : undefined}
              label={t("passwordLabel")}
              placeholder={t("passwordPlaceholder")}
              required
            />
          )}
        />
        <Button
          className={classes.submitButton}
          disabled={!mounted}
          fullWidth
          loading={isSubmitting}
          size="lg"
          type="submit"
        >
          {t("submit")}
        </Button>
      </Stack>
    </form>
  );
}
