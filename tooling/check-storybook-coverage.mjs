#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const packageRootArg = process.argv[2] ?? path.join("packages", "ui");
const uiRoot = path.resolve(repoRoot, packageRootArg);
const srcRoot = path.join(uiRoot, "src");
const storiesRoot = path.join(uiRoot, "stories");
const configPath = path.join(uiRoot, "storybook-coverage.config.json");

const sourceFilePattern = /\.tsx$/;
const ignoredSourcePatterns = [
  /\.stories\.tsx$/,
  /\.test\.tsx$/,
  /\.types\.tsx$/,
  /(^|\/)index\.tsx$/,
];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function toUiRelative(filePath) {
  return normalizePath(path.relative(uiRoot, filePath));
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectFiles(entryPath);
      }

      return [entryPath];
    }),
  );

  return files.flat();
}

async function readCoverageConfig() {
  if (!existsSync(configPath)) {
    return { ignored: [] };
  }

  const config = JSON.parse(await readFile(configPath, "utf8"));

  return {
    ignored: Array.isArray(config.ignored) ? config.ignored : [],
  };
}

function hasExportedReactComponent(source) {
  return (
    /\bexport\s+function\s+[A-Z][A-Za-z0-9_]*\s*\(/.test(source) ||
    /\bexport\s+const\s+[A-Z][A-Za-z0-9_]*\s*=/.test(source)
  );
}

function storyPathForSource(sourcePath) {
  const relativeSourcePath = path.relative(srcRoot, sourcePath);
  const withoutExtension = relativeSourcePath.replace(/\.tsx$/, "");

  return path.join(storiesRoot, `${withoutExtension}.stories.tsx`);
}

const config = await readCoverageConfig();
const invalidIgnores = config.ignored.filter(
  (item) => !item.path || !item.reason || !item.reason.trim(),
);

if (invalidIgnores.length > 0) {
  console.error("Storybook coverage ignores must include path and reason:");
  for (const item of invalidIgnores) {
    console.error(`- ${item.path ?? "(missing path)"}`);
  }
  process.exit(1);
}

const ignoredByPath = new Map(
  config.ignored.map((item) => [normalizePath(item.path), item.reason.trim()]),
);

const sourceFiles = (await collectFiles(srcRoot)).filter((filePath) => {
  const relativePath = normalizePath(path.relative(srcRoot, filePath));

  return (
    sourceFilePattern.test(filePath) &&
    !ignoredSourcePatterns.some((pattern) => pattern.test(relativePath))
  );
});

const covered = [];
const ignored = [];
const missing = [];

for (const sourcePath of sourceFiles) {
  const uiRelativePath = toUiRelative(sourcePath);
  const source = await readFile(sourcePath, "utf8");

  if (!hasExportedReactComponent(source)) {
    continue;
  }

  if (ignoredByPath.has(uiRelativePath)) {
    ignored.push({
      path: uiRelativePath,
      reason: ignoredByPath.get(uiRelativePath),
    });
    continue;
  }

  const storyPath = storyPathForSource(sourcePath);

  if (existsSync(storyPath)) {
    covered.push({
      source: uiRelativePath,
      story: toUiRelative(storyPath),
    });
    continue;
  }

  missing.push({
    source: uiRelativePath,
    expectedStory: toUiRelative(storyPath),
  });
}

if (missing.length > 0) {
  console.error("Missing Storybook coverage:");
  for (const item of missing) {
    console.error(`- ${item.source} -> ${item.expectedStory}`);
  }
  process.exit(1);
}

console.log(
  `Storybook coverage passed: ${covered.length} covered, ${ignored.length} ignored.`,
);

for (const item of covered) {
  console.log(`- ${item.source} -> ${item.story}`);
}

for (const item of ignored) {
  console.log(`- ignored ${item.path}: ${item.reason}`);
}
