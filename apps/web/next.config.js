/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";
import { readFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath, URL as NodeURL } from "node:url";

const withNextIntl = createNextIntlPlugin();

function getSpringAdminApiDestination() {
  const baseUrl = getSpringApiBaseUrl();

  return `${baseUrl.replace(/\/+$/, "")}/api/v1/admin/:path*`;
}

export function getSpringApiBaseUrl() {
  const runtimeConfig = getRuntimeConfig();

  return validateSpringApiBaseUrl(
    process.env.SPRING_API_BASE_URL ?? runtimeConfig.spring_api_base_url,
  );
}

function getRuntimeConfig() {
  const configPath = process.env.CONFIG_PATH;

  if (!configPath) {
    return {};
  }

  try {
    const parsedConfig = JSON.parse(readFileSync(configPath, "utf8"));

    if (parsedConfig === null || typeof parsedConfig !== "object") {
      throw new TypeError("Runtime config must be a JSON object.");
    }

    return parsedConfig;
  } catch (cause) {
    throw new Error(`Unable to load runtime config from ${configPath}.`, {
      cause,
    });
  }
}

function validateSpringApiBaseUrl(value) {
  if (typeof value !== "string") {
    throw new TypeError("Spring API base URL must be a string.");
  }

  const baseUrl = value.trim();

  try {
    const url = new URL(baseUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new TypeError("Invalid Spring URL.");
  } catch (cause) {
    throw new TypeError("Spring API base URL must be an absolute URL.", {
      cause,
    });
  }

  return baseUrl;
}

const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new NodeURL("../../", import.meta.url)),
  experimental: {
    cpus: 2,
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
  },
  transpilePackages: [],
  async rewrites() {
    return [
      {
        source: "/api/v1/admin/:path*",
        destination: getSpringAdminApiDestination(),
      },
    ];
  },
};

export default withNextIntl(nextConfig);
