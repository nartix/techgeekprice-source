import { useIsAuthenticated } from "@refinedev/core";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  userEvent,
  act,
} from "../../../../../tests/test-utils/render";
import { server } from "../../../../../tests/msw/server";
import { AdminRoot } from "../components/AdminRoot";
import {
  clearAdminIdentity,
  setAdminIdentity,
} from "../session/adminIdentityStore";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => stableRouter,
  usePathname: () => "/en-CA/admin",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/navigation.js", () => ({
  useRouter: () => stableRouter,
  usePathname: () => "/en-CA/admin",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../components/AdminShell", () => ({
  AdminShell: ({
    children,
    identity,
  }: {
    children: React.ReactNode;
    identity: { username: string } | null;
  }) => (
    <>
      <span data-testid="verified-username">{identity?.username}</span>
      {children}
    </>
  ),
}));
vi.mock("@refinedev/nextjs-router", () => ({ default: {} }));
const stableRouter = { replace };
const baseUrl = "https://session-boundary.test";
const identity = {
  id: "1",
  username: "admin",
  roles: ["ADMIN"],
  permissions: ["admin:access"],
  sessionScope: "admin" as const,
};
const me = `${baseUrl}/api/v1/admin/auth/me`;
let logouts = 0;
beforeEach(() => {
  replace.mockClear();
  clearAdminIdentity();
  logouts = 0;
  server.use(
    http.post(`${baseUrl}/api/v1/admin/auth/logout`, () => {
      logouts++;
      return HttpResponse.json({ success: true });
    }),
  );
});
afterEach(() => {
  vi.useRealTimers();
});
const root = (children = <div>Protected content</div>) => (
  <AdminRoot apiBaseUrl={baseUrl} locale="en-CA">
    {children}
  </AdminRoot>
);

it("blocks cached identity during outage and recovers on explicit retry", async () => {
  setAdminIdentity(identity);
  let healthy = false;
  server.use(
    http.get(me, () =>
      healthy
        ? HttpResponse.json(identity)
        : new HttpResponse("<html>private details</html>", { status: 503 }),
    ),
  );
  render(root());
  expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  await screen.findByText("Session verification unavailable");
  expect(
    screen.queryByText(/private details|session expired/i),
  ).not.toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
  expect(logouts).toBe(0);
  healthy = true;
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByText("Protected content");
});

it.each([401, 403])(
  "handles non-JSON %s without protected content",
  async (status) => {
    server.use(
      http.get(me, () => new HttpResponse("private diagnostics", { status })),
    );
    render(root());
    if (status === 401)
      await waitFor(() =>
        expect(replace).toHaveBeenCalledWith("/en-CA/admin/login"),
      );
    else {
      await screen.findByText("Access denied");
      expect(replace).not.toHaveBeenCalled();
    }
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    expect(logouts).toBe(0);
  },
);

it("shows unavailable for a network failure", async () => {
  server.use(http.get(me, () => HttpResponse.error()));
  render(root());
  await screen.findByText("Session verification unavailable");
  expect(replace).not.toHaveBeenCalled();
});

it("denies an identity without dashboard access", async () => {
  server.use(
    http.get(me, () =>
      HttpResponse.json({ ...identity, roles: [], permissions: [] }),
    ),
  );
  render(root());
  await screen.findByText("Access denied");
  expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
});

function Recheck() {
  const { refetch } = useIsAuthenticated();
  return (
    <>
      <div>Protected content</div>
      <button onClick={() => void refetch()}>Recheck</button>
    </>
  );
}
it("refreshes the shell identity after a successful Refine recheck", async () => {
  let username = "admin";
  server.use(http.get(me, () => HttpResponse.json({ ...identity, username })));
  render(root(<Recheck />));
  await screen.findByText("Protected content");
  expect(screen.getByTestId("verified-username")).toHaveTextContent("admin");
  username = "updated-admin";
  await userEvent.click(screen.getByRole("button", { name: "Recheck" }));
  await waitFor(() =>
    expect(screen.getByTestId("verified-username")).toHaveTextContent(
      "updated-admin",
    ),
  );
});

it("closes protected content when a later Refine check fails", async () => {
  let healthy = true;
  server.use(
    http.get(me, () =>
      healthy
        ? HttpResponse.json(identity)
        : new HttpResponse("offline", { status: 503 }),
    ),
  );
  render(root(<Recheck />));
  await screen.findByText("Protected content");
  healthy = false;
  await userEvent.click(screen.getByRole("button", { name: "Recheck" }));
  await screen.findByText("Session verification unavailable");
  expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  expect(logouts).toBe(0);
});

it("leaves loading after the verification deadline even if transport never settles", async () => {
  vi.useFakeTimers();
  server.use(http.get(me, () => new Promise(() => {})));
  render(root());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30_001);
  });
  expect(
    screen.getByText("Session verification unavailable"),
  ).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});

it("ignores obsolete verification after a backend replacement", async () => {
  let finish!: () => void;
  server.use(
    http.get(me, async () => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      return HttpResponse.json(identity);
    }),
    http.get(
      "https://replacement.test/api/v1/admin/auth/me",
      () => new HttpResponse("offline", { status: 503 }),
    ),
  );
  const { rerender } = render(root());
  await waitFor(() => expect(finish).toBeTypeOf("function"));
  rerender(
    <AdminRoot apiBaseUrl="https://replacement.test" locale="en-CA">
      <div>Protected content</div>
    </AdminRoot>,
  );
  await screen.findByText("Session verification unavailable");
  await act(async () => {
    finish();
  });
  expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});
