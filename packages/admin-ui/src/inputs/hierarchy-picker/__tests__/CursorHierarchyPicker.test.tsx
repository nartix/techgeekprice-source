import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { CursorHierarchyPicker } from "../CursorHierarchyPicker.js";

describe("CursorHierarchyPicker", () => {
  it("preserves selection across appended pages and selects a newly loaded destination", async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    function PaginatedPicker() {
      const [count, setCount] = useState(20);
      const [value, setValue] = useState("1");
      return (
        <CursorHierarchyPicker
          hasMore={count < 60}
          label="Parent category"
          options={Array.from({ length: count }, (_, index) => ({
            id: String(index + 1),
            label: `Category ${index + 1}`,
            source: "remote" as const,
          }))}
          value={value}
          onChange={(next) => {
            setValue(next);
            onChange(next);
          }}
          onLoadMore={() => setCount((current) => current + 20)}
        />
      );
    }
    render(
      <MantineProvider env="test">
        <PaginatedPicker />
      </MantineProvider>,
    );
    const input = screen.getByRole("combobox", { name: "Parent category" });
    expect(input.getAttribute("aria-expanded")).toBe("false");
    await user.click(input);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-controls")).toBe(
      screen.getByRole("listbox", { name: "Parent category" }).id,
    );
    await user.click(screen.getByRole("button", { name: "Load more" }));
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(screen.getAllByRole("option")).toHaveLength(60);
    expect((input as HTMLInputElement).value).toBe("Category 1");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
    await user.click(screen.getByRole("option", { name: "Category 60" }));
    expect((input as HTMLInputElement).value).toBe("Category 60");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("60");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("uses a labelled combobox and skips disabled options during keyboard selection", async () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <MantineProvider env="test">
        <CursorHierarchyPicker
          label="Parent category"
          options={[
            { id: "root", label: "No parent", source: "root" },
            {
              id: "disabled",
              label: "Archived",
              source: "remote",
              disabled: true,
            },
            { id: "1", label: "Laptops", source: "remote" },
          ]}
          value="root"
          onChange={onChange}
        />
      </MantineProvider>,
    );

    const input = screen.getByRole("combobox", { name: "Parent category" });
    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("1");
    expect(
      screen
        .getByRole("option", { hidden: true, name: "Archived" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("exposes loading, recovery, and continuation controls without changing selection", async () => {
    const onLoadMore = vi.fn();
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <MantineProvider env="test">
        <CursorHierarchyPicker
          errorMessage="The result cursor is invalid"
          hasMore
          label="Parent category"
          loading
          loadingMore={false}
          options={[{ id: "1", label: "Laptops", source: "remote" }]}
          value="1"
          onChange={vi.fn()}
          onLoadMore={onLoadMore}
          onRetry={onRetry}
        />
      </MantineProvider>,
    );

    await user.click(screen.getByRole("combobox", { name: "Parent category" }));
    expect(screen.getByRole("status").textContent).toContain("Loading options");
    expect(screen.getByRole("alert").textContent).toContain(
      "result cursor is invalid",
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it("anchors keyboard navigation to the selected option when delayed options arrive", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <MantineProvider env="test">
        <CursorHierarchyPicker
          label="Parent category"
          options={[{ id: "", label: "Root category", source: "root" }]}
          value="2"
          onChange={onChange}
        />
      </MantineProvider>,
    );

    await user.click(screen.getByRole("combobox", { name: "Parent category" }));

    rerender(
      <MantineProvider env="test">
        <CursorHierarchyPicker
          label="Parent category"
          options={[
            { id: "", label: "Root category", source: "root" },
            { id: "2", label: "Accessories", source: "remote" },
            { id: "3", label: "Cameras", source: "remote" },
          ]}
          value="2"
          onChange={onChange}
        />
      </MantineProvider>,
    );

    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("3");
  });

  it("does not reset the active option while keyboard navigation is in progress", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const props = {
      label: "Parent category",
      options: [
        { id: "", label: "Root category", source: "root" as const },
        { id: "2", label: "Accessories", source: "remote" as const },
        { id: "3", label: "Cameras", source: "remote" as const },
      ],
      value: "2",
      onChange,
    };
    const { rerender } = render(
      <MantineProvider env="test">
        <CursorHierarchyPicker {...props} />
      </MantineProvider>,
    );

    await user.click(screen.getByRole("combobox", { name: "Parent category" }));
    await user.keyboard("{ArrowDown}");

    rerender(
      <MantineProvider env="test">
        <CursorHierarchyPicker {...props} />
      </MantineProvider>,
    );
    await user.keyboard("{Enter}");

    expect(onChange).toHaveBeenCalledWith("3");
  });
});
