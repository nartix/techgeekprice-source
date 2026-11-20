import { z } from "zod";

export const adminLoginSchema = z.object({
  usernameOrEmail: z
    .string()
    .trim()
    .min(1, "Admin.Login.errors.usernameRequired"),
  password: z.string().min(1, "Admin.Login.errors.passwordRequired"),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;
