import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";

import {
  render,
  screen,
  userEvent,
  waitFor,
} from "../../../../../../../tests/test-utils/render";
import type { AdminFormField } from "../../types/admin-form.types";
import { AdminGeneratedField } from "../AdminGeneratedField";

interface TestValues {
  kind: string;
  name?: string;
}

describe("AdminGeneratedField hidden behavior", () => {
  it("clears hidden values when configured", async () => {
    const user = userEvent.setup();

    render(<HiddenFieldHarness field={field({ clearWhenHidden: true })} />);

    await user.type(screen.getByRole("textbox", { name: /name/i }), "Draft");
    await user.click(screen.getByRole("button", { name: /hide/i }));

    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: /name/i })).toBeNull(),
    );
    expect(screen.getByTestId("current-name")).toHaveTextContent("");
  });

  it("preserves hidden values when configured", async () => {
    const user = userEvent.setup();

    render(
      <HiddenFieldHarness
        field={field({ clearWhenHidden: true, preserveWhenHidden: true })}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /name/i }), "Draft");
    await user.click(screen.getByRole("button", { name: /hide/i }));

    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: /name/i })).toBeNull(),
    );
    expect(screen.getByTestId("current-name")).toHaveTextContent("Draft");
  });
});

function HiddenFieldHarness({ field }: { field: AdminFormField<TestValues> }) {
  const form = useForm<TestValues>({
    defaultValues: { kind: "visible", name: "" },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => form.setValue("kind", "hidden", { shouldDirty: true })}
      >
        Hide
      </button>
      <AdminGeneratedField
        field={field}
        form={form}
        mode="create"
        passwordAllowed={false}
        permissions={[]}
        roles={[]}
      />
      <output data-testid="current-name">{form.watch("name") ?? ""}</output>
    </>
  );
}

function field(
  overrides: Partial<AdminFormField<TestValues>>,
): AdminFormField<TestValues> {
  return {
    dependsOn: ["kind"],
    label: "Name",
    name: "name",
    type: "text",
    visibleWhen: ({ values }) => values.kind === "visible",
    ...overrides,
  };
}
