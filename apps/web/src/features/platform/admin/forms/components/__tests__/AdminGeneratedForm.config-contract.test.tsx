import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../../tests/test-utils/render";
import type { AdminFormConfig } from "../../types/admin-form.types";
import { AdminGeneratedFormView } from "../AdminGeneratedForm";

interface FutureValues {
  active: boolean;
  code: string;
  id?: string;
  slug: string;
}

describe("AdminGeneratedForm future resource config contract", () => {
  it("supports typed standard fields, create mapping, and known server error mapping", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => {
      throw {
        details: {
          code: "DUPLICATE_FUTURE_SLUG",
          fieldErrors: [],
          message: "Slug already exists.",
          path: "/api/v1/admin/future",
          timestamp: "2026-06-04T00:00:00Z",
        },
      };
    });

    render(
      <AdminGeneratedFormView
        action="create"
        config={config()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /code/i }), "SKU 1");
    await user.type(screen.getByRole("textbox", { name: /slug/i }), "sku-1");
    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      active: true,
      code: "SKU 1",
      slug: "sku-1",
    });
    expect(await screen.findByText("Slug already exists.")).toBeVisible();
  });

  it("maps edit records and submits update payloads without copying a manual form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <AdminGeneratedFormView
        action="edit"
        config={config()}
        initialValues={config().mapRecordToFormValues?.({
          active: false,
          code: "OLD",
          id: "future_1",
          slug: "old",
        })}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("textbox", { name: /code/i })).toHaveValue("OLD");

    await user.clear(screen.getByRole("textbox", { name: /code/i }));
    await user.type(screen.getByRole("textbox", { name: /code/i }), "NEW");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      active: false,
      code: "NEW",
      id: "future_1",
      slug: "old",
    });
  });
});

function config(): AdminFormConfig<
  FutureValues,
  { active: boolean; code: string; slug: string },
  FutureValues,
  FutureValues
> {
  return {
    defaultValues: { active: true, code: "", slug: "" },
    mapFormValuesToCreateRequest: ({ active, code, slug }) => ({
      active,
      code,
      slug,
    }),
    mapFormValuesToUpdateRequest: (values) => values,
    mapRecordToFormValues: (record) => record,
    resource: "future",
    schema: z.object({
      active: z.boolean(),
      code: z.string().min(1, "Code is required."),
      id: z.string().optional(),
      slug: z.string().min(1, "Slug is required."),
    }),
    sections: [
      {
        fields: [
          { label: "Code", name: "code", required: true, type: "text" },
          { label: "Slug", name: "slug", required: true, type: "slug" },
          { label: "Active", name: "active", type: "switch" },
        ],
        id: "main",
      },
    ],
    serverErrorFieldMap: {
      DUPLICATE_FUTURE_SLUG: "slug",
    },
    submitLabel: {
      create: "Create",
      edit: "Save",
    },
  };
}
