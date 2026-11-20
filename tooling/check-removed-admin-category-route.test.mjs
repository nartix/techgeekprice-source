import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { scanForRemovedAdminCategoryRoute } from "./check-removed-admin-category-route.mjs";

test("reports active occurrences with file and line while ignoring historical specs", async () => {
  const root = await mkdtemp(join(tmpdir(), "category-route-"));
  await mkdir(join(root, "apps"), { recursive: true });
  await mkdir(join(root, "specs"), { recursive: true });
  const forbidden = ["/api/v1/admin", "categories"].join("/");
  await writeFile(
    join(root, "apps", "bad.ts"),
    `const route = "${forbidden}";\n`,
  );
  await writeFile(join(root, "specs", "historical.md"), forbidden);

  assert.deepEqual(await scanForRemovedAdminCategoryRoute(root), [
    { file: "apps/bad.ts", line: 1 },
  ]);
});
