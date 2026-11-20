import { describe, expect, it, vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "../../../../../../tests/test-utils/render";
import { CategoryFilters } from "../components/CategoryFilters";

describe("CategoryFilters", () => {
  it("updates text filters, active filter, and clears values from keyboard-accessible controls", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const filters = { q: "", slug: "", active: "all" as const };

    render(<CategoryFilters filters={filters} onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: /search/i }), {
      target: { value: "lap" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, q: "lap" });

    fireEvent.change(screen.getByRole("textbox", { name: /slug/i }), {
      target: { value: "laptops" },
    });
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, slug: "laptops" });

    await user.click(screen.getByRole("combobox", { name: /status/i }));
    expect(screen.getByLabelText(/category filters/i)).toContainElement(
      screen.getByRole("listbox"),
    );
    await user.click(screen.getByRole("option", { name: /^active$/i }));
    expect(onChange).toHaveBeenLastCalledWith({ ...filters, active: "active" });
  });

  it("clears active filters", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CategoryFilters
        filters={{ q: "lap", slug: "laptops", active: "inactive" }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(onChange).toHaveBeenCalledWith({ q: "", slug: "", active: "all" });
  });
});
