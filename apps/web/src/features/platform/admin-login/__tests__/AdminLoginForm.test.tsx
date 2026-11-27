import { describe, expect, it, vi } from "vitest";
import frCaMessages from "../../../../../messages/fr-CA.json";

import {
  render,
  screen,
  userEvent,
} from "../../../../../tests/test-utils/render";
import { AdminLoginForm } from "../components/AdminLoginForm";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("AdminLoginForm", () => {
  it("hides public demo credentials by default", () => {
    render(
      <AdminLoginForm
        apiBaseUrl="https://categorylisting.ferozfaiz.com"
        locale="en-CA"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /use demo account/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/username: demo/i)).not.toBeInTheDocument();
  });

  it("fills the public demo credentials without submitting, then uses normal sign-in", async () => {
    const user = userEvent.setup();
    const authProvider = { login: vi.fn(async () => ({ success: true })) };
    render(
      <AdminLoginForm
        apiBaseUrl="https://categorylisting.ferozfaiz.com"
        locale="en-CA"
        demoEnabled
        authProvider={authProvider}
      />,
    );
    expect(screen.getByText(/username: demo.*password: demo/i)).toBeVisible();
    expect(
      screen.getByText(/edit categories.*users are read-only/i),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: /use demo account/i }));
    expect(
      screen.getByRole("textbox", { name: /username or email/i }),
    ).toHaveValue("demo");
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveValue("demo");
    expect(authProvider.login).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(authProvider.login).toHaveBeenCalledWith({
      usernameOrEmail: "demo",
      password: "demo",
    });
  });

  it("localizes the demo instructions in French", () => {
    render(
      <AdminLoginForm
        apiBaseUrl="https://categorylisting.ferozfaiz.com"
        locale="fr-CA"
        demoEnabled
      />,
      { locale: "fr-CA", messages: frCaMessages },
    );
    expect(
      screen.getByRole("button", {
        name: /utiliser le compte de démonstration/i,
      }),
    ).toBeVisible();
    expect(screen.getByText(/lecture seule/i)).toBeVisible();
  });

  it("renders localized labels and autocomplete attributes", () => {
    render(<AdminLoginForm apiBaseUrl="https://spring.test" locale="en-CA" />);

    expect(
      screen.getByRole("heading", { name: /admin sign in/i }),
    ).toBeVisible();
    expect(
      screen.getByText(/welcome back. sign in to your workspace/i),
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: /username or email/i }),
    ).toHaveAttribute("autocomplete", "username");
    expect(
      screen.getByRole("textbox", { name: /username or email/i }),
    ).toHaveAttribute("placeholder", "Enter your username or email");
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveAttribute("autocomplete", "current-password");
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveAttribute("placeholder", "Enter your password");
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  it("reveals and hides the password from the keyboard", async () => {
    const user = userEvent.setup();
    render(<AdminLoginForm apiBaseUrl="https://spring.test" locale="en-CA" />);
    const password = screen.getByLabelText(/^password/i, { selector: "input" });
    password.focus();
    await user.tab();
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle).toHaveFocus();
    await user.keyboard(" ");
    expect(password).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Enter}");
    expect(password).toHaveAttribute("type", "password");
  });

  it("shows required validation and supports keyboard submission", async () => {
    const user = userEvent.setup();
    const authProvider = {
      login: vi.fn(),
    };

    render(
      <AdminLoginForm
        apiBaseUrl="https://spring.test"
        authProvider={authProvider}
        locale="en-CA"
      />,
    );

    await user.click(
      screen.getByRole("textbox", { name: /username or email/i }),
    );
    await user.keyboard("{Enter}");

    expect(
      await screen.findByText(/enter your username or email/i),
    ).toBeVisible();
    expect(screen.getByText(/enter your password/i)).toBeVisible();
    expect(authProvider.login).not.toHaveBeenCalled();
  });

  it("submits credentials, shows loading, and preserves only non-secret failed values", async () => {
    const user = userEvent.setup();
    const authProvider = {
      login: vi.fn(async () => ({
        success: false,
        error: { name: "AdminLoginError", message: "Safe failure" },
      })),
    };

    render(
      <AdminLoginForm
        apiBaseUrl="https://spring.test"
        authProvider={authProvider}
        locale="en-CA"
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /username or email/i }),
      "admin",
    );
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "secret",
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authProvider.login).toHaveBeenCalledWith({
      usernameOrEmail: "admin",
      password: "secret",
    });
    expect(await screen.findByText(/we could not sign you in/i)).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: /username or email/i }),
    ).toHaveValue("admin");
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveValue("");
  });

  it("shows a session verification message when login succeeds but identity loading fails", async () => {
    const user = userEvent.setup();
    const authProvider = {
      login: vi.fn(async () => ({
        success: false,
        error: {
          name: "AdminSessionVerificationError",
          message: "Safe verification failure",
        },
      })),
    };

    render(
      <AdminLoginForm
        apiBaseUrl="https://spring.test"
        authProvider={authProvider}
        locale="en-CA"
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /username or email/i }),
      "admin",
    );
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "secret",
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/admin session could not be verified/i),
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: /username or email/i }),
    ).toHaveValue("admin");
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveValue("");
  });

  it("shows an API availability message when secure sign-in setup fails", async () => {
    const user = userEvent.setup();
    const authProvider = {
      login: vi.fn(async () => ({
        success: false,
        error: {
          name: "AdminApiUnavailableError",
          message: "Safe API failure",
        },
      })),
    };

    render(
      <AdminLoginForm
        apiBaseUrl="https://spring.test"
        authProvider={authProvider}
        locale="en-CA"
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: /username or email/i }),
      "admin",
    );
    await user.type(
      screen.getByLabelText(/^password/i, { selector: "input" }),
      "secret",
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/admin sign-in API/i)).toBeVisible();
    expect(
      screen.getByLabelText(/^password/i, { selector: "input" }),
    ).toHaveValue("");
  });
});
