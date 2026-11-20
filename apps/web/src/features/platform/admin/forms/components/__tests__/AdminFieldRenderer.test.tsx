import { describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";

import { render, screen } from "../../../../../../../tests/test-utils/render";
import type { AdminFormField } from "../../types/admin-form.types";
import { AdminFieldRenderer } from "../AdminFieldRenderer";

interface TestValues {
  name: string;
  password: string;
}

describe("AdminFieldRenderer", () => {
  it("renders text fields with labels, descriptions, placeholders, and required state", () => {
    render(<RendererHarness field={textField()} />);

    expect(screen.getByRole("textbox", { name: /name/i })).toBeRequired();
    expect(screen.getByPlaceholderText("Resource name")).toBeVisible();
    expect(screen.getByText("Shown in admin lists.")).toBeVisible();
  });

  it("rejects password fields unless the resource explicitly allows them", () => {
    expect(() =>
      render(<RendererHarness field={passwordField()} passwordAllowed={false} />),
    ).toThrow(/password field/i);
  });

  it("passes custom render context through to custom fields", () => {
    const renderCustom = vi.fn(() => <div>Custom field rendered</div>);

    render(
      <RendererHarness
        field={{
          label: "Name",
          name: "name",
          render: renderCustom,
          type: "custom",
        }}
      />,
    );

    expect(screen.getByText("Custom field rendered")).toBeVisible();
    expect(renderCustom).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: false,
        mode: "create",
        readOnly: false,
        required: true,
      }),
    );
  });
});

function RendererHarness({
  field,
  passwordAllowed = true,
}: {
  field: AdminFormField<TestValues>;
  passwordAllowed?: boolean;
}) {
  const form = useForm<TestValues>({
    defaultValues: { name: "", password: "" },
  });

  return (
    <AdminFieldRenderer
      disabled={false}
      field={field}
      form={form}
      mode="create"
      optionState={{
        error: null,
        loading: false,
        options: [],
        reload: vi.fn(),
        search: "",
        setSearch: vi.fn(),
      }}
      passwordAllowed={passwordAllowed}
      readOnly={false}
      required
      values={form.getValues()}
    />
  );
}

function textField(): AdminFormField<TestValues> {
  return {
    description: "Shown in admin lists.",
    label: "Name",
    name: "name",
    placeholder: "Resource name",
    type: "text",
  };
}

function passwordField(): AdminFormField<TestValues> {
  return {
    label: "Password",
    name: "password",
    type: "password",
  };
}
