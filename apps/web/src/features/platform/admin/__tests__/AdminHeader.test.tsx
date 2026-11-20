import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../tests/test-utils/render";
import { AdminHeader } from "../components/AdminHeader";

describe("AdminHeader", () => {
  it("announces mobile navigation state", async () => {
    const user = userEvent.setup();
    const onMenuToggle = vi.fn();
    const { rerender } = render(
      <AdminHeader
        menuControl="navigation"
        menuLabel="Open navigation"
        menuOpened={false}
        onMenuToggle={onMenuToggle}
        title="Dashboard"
      />,
    );

    const openButton = screen.getByRole("button", {
      name: /open navigation/i,
    });

    expect(openButton).toHaveAttribute("aria-expanded", "false");
    await user.click(openButton);
    expect(onMenuToggle).toHaveBeenCalledTimes(1);

    rerender(
      <AdminHeader
        menuControl="navigation"
        menuLabel="Close navigation"
        menuOpened
        onMenuToggle={onMenuToggle}
        title="Dashboard"
      />,
    );

    expect(
      screen.getByRole("button", { name: /close navigation/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("announces desktop sidebar collapse state", () => {
    const onMenuToggle = vi.fn();
    const { rerender } = render(
      <AdminHeader
        menuControl="sidebar"
        menuLabel="Collapse sidebar"
        menuOpened={false}
        onMenuToggle={onMenuToggle}
        title="Dashboard"
      />,
    );

    expect(
      screen.getByRole("button", { name: /collapse sidebar/i }),
    ).toHaveAttribute("aria-expanded", "true");

    rerender(
      <AdminHeader
        menuControl="sidebar"
        menuLabel="Expand sidebar"
        menuOpened
        onMenuToggle={onMenuToggle}
        title="Dashboard"
      />,
    );

    expect(
      screen.getByRole("button", { name: /expand sidebar/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
