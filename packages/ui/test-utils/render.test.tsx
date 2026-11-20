import { Button } from "@mantine/core";
import { describe, expect, it } from "vitest";

import { render, screen } from "@/test-utils";

describe("render", () => {
  it("wraps tested UI in the Mantine provider", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
