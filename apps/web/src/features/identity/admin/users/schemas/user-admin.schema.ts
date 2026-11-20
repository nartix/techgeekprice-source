import { z } from "zod";

export interface UserAdminValidationMessages {
  usernameRequired: string;
  usernameSize: string;
  emailRequired: string;
  emailInvalid: string;
  emailSize: string;
  passwordRequired: string;
  passwordSize: string;
  passwordConfirmationRequired: string;
  passwordConfirmationMismatch: string;
  firstNameSize: string;
  lastNameSize: string;
  rolesSize: string;
  permissionsSize: string;
}

interface UserAdminSchemaOptions {
  mode?: "create" | "edit" | "show";
}

export function createUserAdminSchema(
  messages: UserAdminValidationMessages,
  options: UserAdminSchemaOptions = {},
) {
  const mode = options.mode ?? "create";

  return z
    .object({
      id: z.string().optional(),
      username: z
        .string()
        .trim()
        .min(1, messages.usernameRequired)
        .max(100, messages.usernameSize),
      email: z
        .string()
        .trim()
        .min(1, messages.emailRequired)
        .max(320, messages.emailSize)
        .email(messages.emailInvalid),
      password:
        mode === "create"
          ? createPasswordSchema(messages)
          : z.string().default(""),
      confirmPassword:
        mode === "create"
          ? createPasswordConfirmationSchema(messages)
          : z.string().default(""),
      firstName: z.string().trim().max(100, messages.firstNameSize),
      lastName: z.string().trim().max(100, messages.lastNameSize),
      roles: z.array(z.string()).max(50, messages.rolesSize),
      permissions: z.array(z.string()).max(200, messages.permissionsSize),
      active: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (mode === "create" && values.password !== values.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: messages.passwordConfirmationMismatch,
          path: ["confirmPassword"],
        });
      }
    });
}

function createPasswordSchema(messages: UserAdminValidationMessages) {
  return z.string().superRefine((value, ctx) => {
    if (value.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: messages.passwordRequired,
      });
      return;
    }

    if (value.length < 8 || value.length > 128) {
      ctx.addIssue({
        code: "custom",
        message: messages.passwordSize,
      });
    }
  });
}

function createPasswordConfirmationSchema(
  messages: UserAdminValidationMessages,
) {
  return z.string().superRefine((value, ctx) => {
    if (value.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        message: messages.passwordConfirmationRequired,
      });
    }
  });
}
