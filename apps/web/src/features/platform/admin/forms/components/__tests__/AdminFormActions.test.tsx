import { describe, expect, it } from "vitest";

import { render, screen } from "../../../../../../../tests/test-utils/render";
import { AdminFormActions } from "../AdminFormActions";

describe("AdminFormActions", () => {
  it("renders localized cancel and submit actions with loading state", () => {
    render(
      <AdminFormActions
        action="create"
        cancelHref="/admin/products/categories"
        cancelLabel="Cancel"
        loading
        locale="en-CA"
        submitLabel="Create category"
      />,
    );

    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/en-CA/admin/products/categories",
    );
    expect(
      screen.getByRole("button", { name: /create category/i }),
    ).toBeDisabled();
  });

  it("hides submit for future show mode", () => {
    render(<AdminFormActions action="show" submitLabel="Save" />);

    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
  });
});
