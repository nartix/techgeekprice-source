import { describe, expect, it } from "vitest";

import type { AdminFormField, AdminFormSection } from "../../types/admin-form.types";
import {
  canRenderAdminField,
  canRenderAdminSection,
  createAdminFormRuntimeContext,
  isAdminFieldDisabled,
  isAdminFieldRequired,
  shouldClearAdminFieldWhenHidden,
} from "../adminFormVisibility";

interface TestValues {
  active: boolean;
  kind: string;
  name: string;
}

const baseContext = createAdminFormRuntimeContext<TestValues>({
  mode: "create",
  permissions: ["admin:test:write"],
  roles: ["ADMIN"],
  values: { active: true, kind: "public", name: "" },
});

describe("admin form visibility", () => {
  it("applies mode, permission, role, and predicate visibility rules", () => {
    expect(canRenderAdminField(field({ name: "name" }), baseContext)).toBe(true);
    expect(
      canRenderAdminField(field({ editOnly: true, name: "name" }), baseContext),
    ).toBe(false);
    expect(
      canRenderAdminField(
        field({ name: "name", permissions: ["admin:other"] }),
        baseContext,
      ),
    ).toBe(false);
    expect(
      canRenderAdminField(
        field({ name: "name", roles: ["MODERATOR"] }),
        baseContext,
      ),
    ).toBe(false);
    expect(
      canRenderAdminField(
        field({
          name: "name",
          visibleWhen: ({ values }) => values.kind === "private",
        }),
        baseContext,
      ),
    ).toBe(false);
  });

  it("resolves disabled and required states from static and dynamic config", () => {
    expect(isAdminFieldDisabled(field({ disabled: true, name: "name" }), baseContext)).toBe(
      true,
    );
    expect(
      isAdminFieldDisabled(
        field({
          disabledWhen: ({ values }) => values.active,
          name: "name",
        }),
        baseContext,
      ),
    ).toBe(true);
    expect(isAdminFieldRequired(field({ name: "name", required: true }), baseContext)).toBe(
      true,
    );
    expect(
      isAdminFieldRequired(
        field({
          name: "name",
          requiredWhen: ({ values }) => values.kind === "public",
        }),
        baseContext,
      ),
    ).toBe(true);
  });

  it("handles section visibility and hidden clear policy", () => {
    const section: AdminFormSection<TestValues> = {
      fields: [field({ name: "name" })],
      id: "identity",
      visibleWhen: ({ values }) => values.active,
    };

    expect(canRenderAdminSection(section, baseContext)).toBe(true);
    expect(
      shouldClearAdminFieldWhenHidden(
        field({ clearWhenHidden: true, name: "name" }),
      ),
    ).toBe(true);
    expect(
      shouldClearAdminFieldWhenHidden(
        field({
          clearWhenHidden: true,
          name: "name",
          preserveWhenHidden: true,
        }),
      ),
    ).toBe(false);
  });
});

function field(
  overrides: Partial<AdminFormField<TestValues>>,
): AdminFormField<TestValues> {
  return {
    label: "Name",
    name: "name",
    type: "text",
    ...overrides,
  };
}
