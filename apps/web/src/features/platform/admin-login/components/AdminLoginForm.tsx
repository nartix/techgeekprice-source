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
import { type MouseEvent, useMemo, useState } from "react";
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
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      <Stack gap="md">
        <Stack align="center" className={classes.header} gap="sm">
          <ThemeIcon className={classes.icon} radius="md" size={48}>
            <IconShieldLock aria-hidden="true" size={26} stroke={1.75} />
          </ThemeIcon>
          <Stack align="center" gap={4}>
            <Text className={classes.brand}>Tech Geek Price</Text>
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
          <Alert
            classNames={{ root: classes.alert, message: classes.alertMessage }}
            color="red"
          >
            {formError}
          </Alert>
        ) : null}
        <Controller
          control={control}
          name="usernameOrEmail"
          render={({ field }) => (
            <TextInput
              {...field}
              radius="md"
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
              radius="md"
              aria-invalid={errors.password ? true : undefined}
              visible={passwordVisible}
              onVisibilityChange={setPasswordVisible}
              rightSectionWidth={48}
              visibilityToggleButtonProps={{
                tabIndex: 0,
                onClick: (event: MouseEvent<HTMLButtonElement>) => {
                  // Mantine handles pointer presses and Space. Enter and assistive
                  // technology can activate a button with a click alone.
                  if (event.detail === 0)
                    setPasswordVisible((visible) => !visible);
                },
                "aria-label": t("togglePassword"),
              }}
              autoComplete="current-password"
              classNames={{
                error: classes.fieldError,
                input: classes.input,
                label: classes.label,
                innerInput: classes.innerInput,
                visibilityToggle: classes.toggle,
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
          size="md"
          radius="md"
          type="submit"
        >
          {t("submit")}
        </Button>
      </Stack>
    </form>
  );
}
