import { TextInput } from "@mantine/core";
import { z } from "zod";
import { Controller } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../../tests/test-utils/render";
import type { AdminFormConfig } from "../../types/admin-form.types";
import { AdminGeneratedFormView } from "../AdminGeneratedForm";

interface CustomValues {
  code: string;
}

describe("AdminCustomField integration", () => {
  it("participates in form state, validation errors, and payload mapping", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const formConfig = config();

    render(
      <AdminGeneratedFormView
        action="create"
        config={formConfig}
        onSubmit={(values) =>
          onSubmit(formConfig.mapFormValuesToCreateRequest?.(values))
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("Code is required.")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: /custom code/i }), "abc");
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(onSubmit).toHaveBeenCalledWith({ code: "ABC" });
  });
});

function config(): AdminFormConfig<CustomValues, { code: string }> {
  return {
    defaultValues: { code: "" },
    mapFormValuesToCreateRequest: ({ code }) => ({ code: code.toUpperCase() }),
    resource: "custom",
    schema: z.object({
      code: z.string().min(1, "Code is required."),
    }),
    sections: [
      {
        fields: [
          {
            label: "Custom code",
            name: "code",
            render: ({ disabled, error, field, form, required }) => (
              <Controller
                control={form.control}
                name={field.name}
                render={({ field: rhfField }) => (
                  <TextInput
                    disabled={disabled}
                    error={error}
                    label={field.label}
                    required={required}
                    value={rhfField.value ?? ""}
                    onBlur={rhfField.onBlur}
                    onChange={rhfField.onChange}
                  />
                )}
              />
            ),
            required: true,
            type: "custom",
          },
        ],
        id: "custom",
      },
    ],
    submitLabel: {
      create: "Create",
    },
  };
}
