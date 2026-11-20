import { describe, expect, it } from "vitest";

import type { AdminFormConfig } from "../../types/admin-form.types";
import {
  createAdminFormSubmitValues,
  getHiddenAdminFormFieldNames,
} from "../adminFormPayload";

interface TestValues {
  adminOnly?: string;
  name: string;
  secret?: string;
  slugManuallyEdited?: boolean;
  transient?: string;
}

describe("admin form payload helpers", () => {
  it("omits UI-only and generated slug helper fields", () => {
    const payload = createAdminFormSubmitValues(
      {
        name: "Visible",
        slugManuallyEdited: true,
        transient: "client-only",
      },
      config(),
      { mode: "create" },
    );

    expect(payload).toEqual({ name: "Visible" });
  });

  it("omits hidden fields by default and preserves them when explicitly configured", () => {
    const payload = createAdminFormSubmitValues(
      {
        adminOnly: "preserved",
        name: "Visible",
        secret: "hidden",
      },
      config({
        hiddenSubmitBehavior: "omit",
        includeHiddenSection: false,
        secretHiddenSubmitBehavior: "preserve-existing-edit-value",
      }),
      {
        hiddenFieldNames: ["adminOnly", "secret"],
        mode: "edit",
      },
    );

    expect(payload).toEqual({ name: "Visible", secret: "hidden" });
  });

  it("finds fields hidden by permissions and section visibility", () => {
    const hiddenFieldNames = getHiddenAdminFormFieldNames(config(), {
      mode: "create",
      permissions: [],
      roles: [],
      values: { name: "Visible" },
    });

    expect(hiddenFieldNames).toEqual(["adminOnly", "secret"]);
  });
});

function config(args: {
  hiddenSubmitBehavior?: AdminFormConfig<TestValues>["hiddenSubmitBehavior"];
  includeHiddenSection?: boolean;
  secretHiddenSubmitBehavior?: "omit" | "preserve-existing-edit-value" | "submit";
} = {}): AdminFormConfig<TestValues> {
  const sections: AdminFormConfig<TestValues>["sections"] = [
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
        {
          hiddenSubmitBehavior: args.secretHiddenSubmitBehavior,
          label: "Secret",
          name: "secret",
          type: "text",
        },
        {
          label: "Transient",
          name: "transient",
          type: "text",
          uiOnly: true,
        },
      ],
      id: "visible",
    },
  ];

  if (args.includeHiddenSection !== false) {
    sections.push({
      fields: [
        {
          label: "Secret",
          name: "secret",
          type: "text",
        },
      ],
      id: "hidden",
      visibleWhen: () => false,
    });
  }

  return {
    defaultValues: { name: "" },
    hiddenSubmitBehavior: args.hiddenSubmitBehavior,
    resource: "tests",
    schema: {} as never,
    sections,
  };
}
