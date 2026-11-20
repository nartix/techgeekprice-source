import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const sentinel = ["/api/v1/admin", "categories"].join("/");
const roots = [
  "apps",
  "packages",
  "test",
  "tests",
  "e2e",
  "examples",
  "requests",
  "docs/api/http",
];
const excludedDirectories = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
  "storybook-static",
  "playwright-report",
  "test-results",
]);

async function walk(root, directory, findings) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name))
        await walk(root, join(directory, entry.name), findings);
      continue;
    }
    if (!entry.isFile()) continue;
    const path = join(directory, entry.name);
    const content = await readFile(path, "utf8");
    content.split(/\r?\n/).forEach((line, index) => {
      if (line.includes(sentinel))
        findings.push({ file: relative(root, path), line: index + 1 });
    });
  }
}

export async function scanForRemovedAdminCategoryRoute(root = process.cwd()) {
  const resolvedRoot = resolve(root);
  const findings = [];
  for (const candidate of roots) {
    const path = join(resolvedRoot, candidate);
    try {
      if ((await stat(path)).isDirectory())
        await walk(resolvedRoot, path, findings);
    } catch {
      // Optional active roots are not required in every checkout.
    }
  }
  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const findings = await scanForRemovedAdminCategoryRoute();
  if (findings.length) {
    findings.forEach(({ file, line }) => console.error(`${file}:${line}`));
    process.exitCode = 1;
  }
}
