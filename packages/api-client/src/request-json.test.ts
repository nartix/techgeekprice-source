import { describe, expect, it } from "vitest";
import { requestJson } from "./request-json";
import { adminFetch } from "./admin/adminFetch";
import { HttpStatusError, JsonParseError } from "./api-client-error";

for (const [name, request] of [
  [
    "requestJson",
    (fetcher: typeof fetch, signal?: AbortSignal) =>
      requestJson("https://spring.test/public", { fetcher, signal }),
  ],
  [
    "adminFetch",
    (fetcher: typeof fetch, signal?: AbortSignal) =>
      adminFetch("/api/v1/admin/users", {
        baseUrl: "https://spring.test",
        fetcher,
        signal,
      }),
  ],
] as const) {
  describe(name, () => {
    for (const status of [401, 403, 500, 503]) {
      it.each([
        "",
        "<html>private diagnostic</html>",
        "upstream failed",
        '{"broken":',
        '{"code":"unavailable"}',
      ])(`preserves ${status} for body %j`, async (body) => {
        await expect(
          request(
            async () =>
              new Response(body, { status, statusText: "private diagnostic" }),
          ),
        ).rejects.toMatchObject({
          status,
          ...(name === "adminFetch" && status === 401
            ? { name: "AdminUnauthorizedError" }
            : name === "adminFetch" && status === 403
              ? { name: "AdminForbiddenError" }
              : { name: "HttpStatusError" }),
        });
        try {
          await request(
            async () =>
              new Response(body, { status, statusText: "private diagnostic" }),
          );
        } catch (error) {
          expect((error as Error).message).not.toMatch(
            /private diagnostic|<html>|upstream/,
          );
        }
      });
    }
    it("retains HTTP status if consuming the error body fails", async () => {
      const response = new Response("", { status: 503 });
      response.text = async () => {
        throw new Error("body socket failed");
      };
      await expect(request(async () => response)).rejects.toMatchObject({
        status: 503,
        name: "HttpStatusError",
      });
    });
    it("still reports invalid successful JSON", async () => {
      await expect(
        request(async () => new Response("{bad", { status: 200 })),
      ).rejects.toBeInstanceOf(JsonParseError);
    });
    it.each([200, 204, 205])("preserves null for empty %s", async (status) => {
      await expect(
        request(async () => new Response(null, { status })),
      ).resolves.toBeNull();
    });
    it("preserves cancellation while reading a successful body", async () => {
      const abort = new DOMException("Cancelled", "AbortError");
      const response = new Response("{}");
      response.text = async () => {
        throw abort;
      };
      await expect(request(async () => response)).rejects.toBe(abort);
    });
    it.each(["invalid JSON", "body failure"])(
      "normalizes cancellation during %s to AbortError",
      async (failure) => {
        const controller = new AbortController();
        const response = new Response("{}");
        response.text = async () => {
          controller.abort(new Error("custom cancellation reason"));
          if (failure === "body failure") throw controller.signal.reason;
          return "{bad";
        };
        await expect(
          request(async () => response, controller.signal),
        ).rejects.toMatchObject({ name: "AbortError" });
      },
    );
    it("ignores a successful response arriving after cancellation", async () => {
      const controller = new AbortController();
      await expect(
        request(async () => {
          controller.abort();
          return new Response("{}");
        }, controller.signal),
      ).rejects.toMatchObject({ name: "AbortError" });
    });
    it("preserves a deliberate transport abort", async () => {
      const abort = new DOMException("Cancelled", "AbortError");
      await expect(
        request(async () => {
          throw abort;
        }),
      ).rejects.toBe(abort);
    });
  });
}

it("keeps generic status errors safe", () => {
  expect(
    new HttpStatusError({
      status: 500,
      statusText: "secret",
      body: "<html>secret</html>",
    }).message,
  ).not.toContain("secret");
});

it("honors cancellation inherited from a Request input", async () => {
  const controller = new AbortController();
  const input = new Request("https://spring.test/public", {
    signal: controller.signal,
  });
  controller.abort(new Error("custom cancellation reason"));
  await expect(
    requestJson(input, { fetcher: async () => new Response("{}") }),
  ).rejects.toMatchObject({ name: "AbortError" });
});

it.each([null, "replacement"] as const)(
  "allows an explicit %s signal to override a Request signal",
  async (override) => {
    const controller = new AbortController();
    const input = new Request("https://spring.test/public", {
      signal: controller.signal,
    });
    controller.abort();
    const signal = override === null ? null : new AbortController().signal;
    await expect(
      requestJson(input, {
        signal,
        fetcher: async () => new Response('{"ok":true}'),
      }),
    ).resolves.toEqual({ ok: true });
  },
);
