import { z } from "zod";

export interface CategoryAdminValidationMessages {
  nameRequired: string;
  nameSize: string;
  parentIdInvalid?: string;
  slugRequired: string;
  slugInvalid: string;
  selfParentInvalid?: string;
}

export function createCategoryAdminSchema(
  messages: CategoryAdminValidationMessages,
) {
  return z
    .object({
      id: z.string().optional(),
      parentId: z
        .string()
        .trim()
        .regex(
          /^\d*$/,
          messages.parentIdInvalid ??
            messages.selfParentInvalid ??
            messages.slugInvalid,
        ),
      name: z
        .string()
        .trim()
        .min(1, messages.nameRequired)
        .max(255, messages.nameSize),
      slug: z
        .string()
        .trim()
        .min(1, messages.slugRequired)
        .max(180, messages.slugInvalid)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, messages.slugInvalid),
      slugManuallyEdited: z.boolean().default(false),
      active: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (values.id && values.parentId && values.id === values.parentId) {
        ctx.addIssue({
          code: "custom",
          message: messages.selfParentInvalid ?? messages.slugInvalid,
          path: ["parentId"],
        });
      }
    });
}
