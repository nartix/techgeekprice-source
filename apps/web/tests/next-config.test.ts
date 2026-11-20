import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig, { getSpringApiBaseUrl } from "../next.config.js";

const originalEnv = process.env;
const tempDirs: string[] = [];

describe("next config", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();

    for (const tempDir of tempDirs.splice(0)) {
      rmSync(tempDir, { force: true, recursive: true });
    }
  });

  it("loads production configuration without reading the development route manifest", async () => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    vi.resetModules();
    const { default: productionConfig } = await import("../next.config.js");

    expect(productionConfig.allowedDevOrigins).toBeUndefined();
    expect(productionConfig.output).toBe("standalone");
  });

  it("uses SPRING_API_BASE_URL before mounted runtime config", async () => {
    const configPath = createRuntimeConfig({
      spring_api_base_url: "https://runtime.spring.example.test",
    });

    process.env = {
      ...originalEnv,
      CONFIG_PATH: configPath,
      SPRING_API_BASE_URL: "https://env.spring.example.test",
    };

    expect(getSpringApiBaseUrl()).toBe("https://env.spring.example.test");
  });

  it("uses mounted runtime config for rewrites when env var is not set", async () => {
    const configPath = createRuntimeConfig({
      spring_api_base_url: "https://runtime.spring.example.test/",
    });

    process.env = {
      ...originalEnv,
      CONFIG_PATH: configPath,
    };
    delete process.env.SPRING_API_BASE_URL;

    if (typeof nextConfig.rewrites !== "function") {
      throw new TypeError("Expected Next config rewrites to be a function.");
    }

    const rewrites = await nextConfig.rewrites();

    expect(getSpringApiBaseUrl()).toBe("https://runtime.spring.example.test/");
    expect(rewrites).toContainEqual({
      source: "/api/v1/admin/:path*",
      destination: "https://runtime.spring.example.test/api/v1/admin/:path*",
    });
  });
});

function createRuntimeConfig(config: Record<string, unknown>): string {
  const tempDir = mkdtempSync(join(tmpdir(), "tgp-next-config-"));
  const configPath = join(tempDir, "config.json");

  tempDirs.push(tempDir);
  writeFileSync(configPath, JSON.stringify(config), "utf8");

  return configPath;
}
