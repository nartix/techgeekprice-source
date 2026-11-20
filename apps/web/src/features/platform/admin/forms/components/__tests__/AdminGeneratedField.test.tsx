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

describe("AdminGeneratedField", () => {
  it("renders dependency-driven fields and clears values when hidden", async () => {
    const user = userEvent.setup();

    render(<GeneratedFieldHarness />);

    await user.type(screen.getByRole("textbox", { name: /name/i }), "Hidden soon");
    await user.click(screen.getByRole("button", { name: /hide/i }));

    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: /name/i })).toBeNull(),
    );
    expect(screen.getByTestId("current-name")).toHaveTextContent("");
  });
});

function GeneratedFieldHarness() {
  const form = useForm<TestValues>({
    defaultValues: { kind: "visible", name: "" },
  });
  const field: AdminFormField<TestValues> = {
    clearWhenHidden: true,
    dependsOn: ["kind"],
    label: "Name",
    name: "name",
    type: "text",
    visibleWhen: ({ values }) => values.kind === "visible",
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          form.setValue("kind", "hidden", {
            shouldDirty: true,
          })
        }
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
