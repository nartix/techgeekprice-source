import { readFileSync } from "node:fs";

import { z } from "zod";

const serverEnvSchema = z.object({
  SPRING_API_BASE_URL: z.string().trim().url(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SPRING_API_BASE_URL: z.string().trim().url(),
});

const productionClientEnvSchema = z.object({
  NEXT_PUBLIC_SPRING_API_BASE_URL: z
    .string()
    .trim()
    .url()
    .refine((value) => {
      try {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase();
        return (
          url.protocol === "https:" &&
          !url.username &&
          !url.password &&
          !url.search &&
          !url.hash &&
          url.pathname === "/" &&
          hostname !== "localhost" &&
          !hostname.endsWith(".localhost") &&
          !hostname.startsWith("127.") &&
          hostname !== "[::1]"
        );
      } catch {
        return false;
      }
    }, "Production admin URL must be an explicit HTTPS origin without credentials, a path, query, fragment, or loopback host."),
});

const runtimeConfigSchema = z
  .object({
    spring_api_base_url: z.string().trim().url().optional(),
    next_public_spring_api_base_url: z.string().trim().url().optional(),
  })
  .passthrough();

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;
let cachedClientEnv: ClientEnv | undefined;
let cachedRuntimeConfig: z.infer<typeof runtimeConfigSchema> | undefined;

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("Server environment can only be read on the server.");
  }

  const runtimeConfig = getRuntimeConfig();

  cachedServerEnv ??= serverEnvSchema.parse({
    SPRING_API_BASE_URL:
      process.env.SPRING_API_BASE_URL ?? runtimeConfig.spring_api_base_url,
  });
  return Object.freeze(cachedServerEnv);
}

export function getSpringApiBaseUrl(): string {
  return getServerEnv().SPRING_API_BASE_URL;
}

export function getClientEnv(): ClientEnv {
  if (typeof window !== "undefined")
    throw new Error("Client settings must be projected by the server.");
  const runtimeConfig = getRuntimeConfig();

  const production = process.env.NODE_ENV === "production";
  const schema = production ? productionClientEnvSchema : clientEnvSchema;
  cachedClientEnv ??= schema.parse({
    NEXT_PUBLIC_SPRING_API_BASE_URL:
      process.env.NEXT_PUBLIC_SPRING_API_BASE_URL ??
      runtimeConfig.next_public_spring_api_base_url ??
      (production ? undefined : "http://localhost:3000"),
  });
  return Object.freeze(cachedClientEnv);
}

export function getPublicSpringApiBaseUrl(): string {
  return getClientEnv().NEXT_PUBLIC_SPRING_API_BASE_URL;
}

// Public fixture credentials are enabled only for the approved portfolio build.
export function getPortfolioDemoEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_PORTFOLIO_DEMO === "true" &&
    getPublicSpringApiBaseUrl() === "https://categorylisting.ferozfaiz.com"
  );
}

function getRuntimeConfig(): z.infer<typeof runtimeConfigSchema> {
  if (typeof window !== "undefined") {
    return {};
  }

  if (cachedRuntimeConfig) {
    return cachedRuntimeConfig;
  }

  const configPath = process.env.CONFIG_PATH;

  if (!configPath) {
    cachedRuntimeConfig = {};
    return cachedRuntimeConfig;
  }

  try {
    cachedRuntimeConfig = runtimeConfigSchema.parse(
      JSON.parse(readFileSync(configPath, "utf8")),
    );
  } catch (cause) {
    throw new Error(`Unable to load runtime config from ${configPath}.`, {
      cause,
    });
  }

  return cachedRuntimeConfig;
}
