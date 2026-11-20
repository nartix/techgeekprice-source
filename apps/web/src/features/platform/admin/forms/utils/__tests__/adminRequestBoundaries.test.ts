import { describe, expect, it } from "vitest";
import type { DataProvider } from "@refinedev/core";
import { adminSpringDataProvider } from "@tgp/api-client";
import { http, HttpResponse } from "msw";
import { server } from "../../../../../../../tests/msw/server";
import { loadSmallCategoryTree } from "../../../../../catalog/admin/categories/tree/api/category-tree.api";
import { createAdminFormOptionLoaderApi } from "../adminFormOptions";

const baseUrl = "https://admin-boundary.test";
const path = "/api/v1/admin/users";
const provider = () =>
  adminSpringDataProvider({
    baseUrl,
    resources: [{ name: "users", apiPath: path }],
  }) as unknown as DataProvider;

describe("feature adapter to transport cancellation", () => {
  it.each(["tree", "custom", "options"])(
    "cancels %s before transport",
    async (kind) => {
      let requests = 0;
      server.use(
        http.get(`${baseUrl}/*`, () => {
          requests++;
          return HttpResponse.json({});
        }),
      );
      const controller = new AbortController();
      controller.abort();
      const api = createAdminFormOptionLoaderApi(provider());
      const pending =
        kind === "tree"
          ? loadSmallCategoryTree({
              dataProvider: provider(),
              signal: controller.signal,
            })
          : kind === "custom"
            ? api.custom({ url: path, signal: controller.signal })
            : api.loadOptions({
                resource: "users",
                labelField: "name",
                valueField: "id",
                signal: controller.signal,
              });
      await expect(pending).rejects.toMatchObject({ name: "AbortError" });
      expect(requests).toBe(0);
    },
  );
});

it.each(["tree", "custom", "options"])(
  "cancels an active %s request through HTTP",
  async (kind) => {
    let started!: () => void;
    let finish!: () => void;
    let receivedSignal: AbortSignal | undefined;
    const entered = new Promise<void>((resolve) => {
      started = resolve;
    });
    const responseReady = new Promise<void>((resolve) => {
      finish = resolve;
    });
    server.use(
      http.get(`${baseUrl}/*`, async ({ request }) => {
        receivedSignal = request.signal;
        started();
        await responseReady;
        return HttpResponse.json({
          data: [],
          page: {
            number: 0,
            first: true,
            last: true,
            totalElements: 0,
            numberOfElements: 0,
          },
        });
      }),
    );
    const controller = new AbortController();
    const api = createAdminFormOptionLoaderApi(provider());
    const pending =
      kind === "tree"
        ? loadSmallCategoryTree({
            dataProvider: provider(),
            signal: controller.signal,
          })
        : kind === "custom"
          ? api.custom({ url: path, signal: controller.signal })
          : api.loadOptions({
              resource: "users",
              labelField: "name",
              valueField: "id",
              signal: controller.signal,
            });
    const cancelled = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    await entered;
    controller.abort();
    finish();
    await cancelled;
    expect(receivedSignal?.aborted).toBe(true);
  },
);
