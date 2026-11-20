import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../../tests/test-utils/render";
import type { AdminFormConfig } from "../../types/admin-form.types";
import { AdminGeneratedFormView } from "../AdminGeneratedForm";

interface TestValues {
  adminOnly?: string;
  name: string;
}

describe("AdminGeneratedFormView", () => {
  it("keeps retained values mounted while a caller closes submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <AdminGeneratedFormView
        action="edit"
        config={config()}
        initialValues={{ name: "Retained category" }}
        submitEnabled={false}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("textbox", { name: /name/i })).toHaveValue(
      "Retained category",
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it("uses mode-aware schemas and omits permission-hidden values on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <AdminGeneratedFormView
        action="create"
        config={config()}
        permissions={[]}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /create/i }));
    expect(await screen.findByText("Name is required.")).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <AdminGeneratedFormView
        action="edit"
        config={config()}
        initialValues={{ adminOnly: "secret", name: "" }}
        permissions={[]}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ name: "" });
  });

  it("shows localized success feedback and prevents duplicate submits while saving", () => {
    render(
      <AdminGeneratedFormView
        action="edit"
        config={config()}
        disabled
        loading
        successMessage="Resource saved."
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("Resource saved.")).toBeVisible();
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });
});

function config(): AdminFormConfig<TestValues> {
  return {
    cancelHref: "/admin/tests",
    cancelLabel: "Cancel",
    defaultValues: { adminOnly: "secret", name: "" },
    resource: "tests",
    schema: ({ mode }) =>
      z.object({
        adminOnly: z.string().optional(),
        name:
          mode === "create"
            ? z.string().min(1, "Name is required.")
            : z.string(),
      }),
    sections: [
      {
        fields: [
          {
            label: "Name",
            name: "name",
            type: "text",
          },
          {
            label: "Admin only",
            name: "adminOnly",
            permissions: ["admin:test:write"],
            type: "text",
          },
        ],
        id: "identity",
      },
    ],
    submitLabel: {
      create: "Create",
      edit: "Save",
    },
    successMessage: {
      edit: "Resource saved.",
    },
  };
}
