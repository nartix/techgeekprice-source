import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";

import { render, screen } from "../../../../../../../tests/test-utils/render";
import type { AdminFormField } from "../../types/admin-form.types";
import { AdminGeneratedField } from "../AdminGeneratedField";

interface TestValues {
  name: string;
}

describe("AdminGeneratedField dynamic state", () => {
  it("applies mode, role, permission, disabled, and required policies", () => {
    const { rerender } = render(
      <DynamicFieldHarness
        field={{
          disabledWhen: () => true,
          label: "Name",
          name: "name",
          requiredWhen: () => true,
          type: "text",
        }}
      />,
    );

    expect(screen.getByRole("textbox", { name: /name/i })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /name/i })).toBeRequired();

    rerender(
      <DynamicFieldHarness
        field={{
          editOnly: true,
          label: "Name",
          name: "name",
          type: "text",
        }}
        mode="create"
      />,
    );
    expect(screen.queryByRole("textbox", { name: /name/i })).toBeNull();

    rerender(
      <DynamicFieldHarness
        field={{
          label: "Name",
          name: "name",
          permissions: ["admin:test:write"],
          roles: ["ADMIN"],
          type: "text",
        }}
        permissions={["admin:test:read"]}
        roles={["MODERATOR"]}
      />,
    );
    expect(screen.queryByRole("textbox", { name: /name/i })).toBeNull();
  });
});

function DynamicFieldHarness({
  field,
  mode = "create",
  permissions = [],
  roles = [],
}: {
  field: AdminFormField<TestValues>;
  mode?: "create" | "edit";
  permissions?: string[];
  roles?: string[];
}) {
  const form = useForm<TestValues>({
    defaultValues: { name: "" },
  });

  return (
    <AdminGeneratedField
      field={field}
      form={form}
      mode={mode}
      passwordAllowed={false}
      permissions={permissions}
      roles={roles}
    />
  );
}
