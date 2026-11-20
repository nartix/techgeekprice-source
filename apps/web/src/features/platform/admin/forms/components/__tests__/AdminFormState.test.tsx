import { describe, expect, it, vi } from "vitest";

import {
  render,
  screen,
  userEvent,
} from "../../../../../../../tests/test-utils/render";
import { AdminFormState } from "../AdminFormState";

describe("AdminFormState", () => {
  it("renders loading, root error with retry, and success states", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(
      <AdminFormState loading loadingMessage="Loading record..." />,
    );

    expect(screen.getByText("Loading record...")).toBeVisible();

    rerender(
      <AdminFormState
        errorTitle="Could not save"
        retryLabel="Try again"
        rootError="Review the fields and try again."
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText("Review the fields and try again.")).toBeVisible();
    expect(onRetry).toHaveBeenCalledOnce();

    rerender(
      <AdminFormState
        successMessage="The resource was saved."
        successTitle="Saved"
      />,
    );

    expect(screen.getByText("The resource was saved.")).toBeVisible();
  });
});
