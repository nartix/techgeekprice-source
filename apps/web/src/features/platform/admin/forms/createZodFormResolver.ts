import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";

export function createZodFormResolver<TValues extends FieldValues>(
  schema: object,
): Resolver<TValues> {
  // Keep the compatibility cast in one place while Zod 4 minor versions move faster than resolver typings.
  return zodResolver(schema as never) as Resolver<TValues>;
}
