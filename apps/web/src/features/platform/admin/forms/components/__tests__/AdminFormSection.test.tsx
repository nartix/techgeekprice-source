import { describe, expect, it } from "vitest";
import { useForm } from "react-hook-form";

import { render, screen } from "../../../../../../../tests/test-utils/render";
import type { AdminFormSection as AdminFormSectionConfig } from "../../types/admin-form.types";
import { AdminFormSection } from "../AdminFormSection";

interface TestValues {
  active: boolean;
  name: string;
}

describe("AdminFormSection", () => {
  it("renders visible sections and omits hidden sections", () => {
    const { rerender } = render(
      <SectionHarness section={section({ visibleWhen: () => true })} />,
    );

    expect(screen.getByRole("heading", { name: /identity/i })).toBeVisible();
    expect(screen.getByRole("textbox", { name: /name/i })).toBeVisible();

    rerender(<SectionHarness section={section({ visibleWhen: () => false })} />);

    expect(screen.queryByRole("textbox", { name: /name/i })).toBeNull();
  });
});

function SectionHarness({
  section,
}: {
  section: AdminFormSectionConfig<TestValues>;
}) {
  const form = useForm<TestValues>({
    defaultValues: { active: true, name: "" },
  });

  return (
    <AdminFormSection
      form={form}
      mode="create"
      passwordAllowed={false}
      permissions={[]}
      roles={[]}
      section={section}
      values={form.getValues()}
    />
  );
}

function section(
  overrides: Partial<AdminFormSectionConfig<TestValues>> = {},
): AdminFormSectionConfig<TestValues> {
  return {
    fields: [
      {
        label: "Name",
        name: "name",
        type: "text",
      },
    ],
    id: "identity",
    title: "Identity",
    ...overrides,
  };
}
