import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { generate } from "./generate-openapi.mjs";

const schema = {
  openapi: "3.1.0",
  info: { title: "Test", version: "1" },
  paths: {},
  components: {
    schemas: {
      Example: { type: "object", properties: { name: { type: "string" } } },
    },
  },
};
async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(), "tgp-openapi-"));
  const schemaPath = join(dir, "schema.json");
  const outputPath = join(dir, "generated.ts");
  await writeFile(schemaPath, JSON.stringify(schema));
  try {
    await run({ schemaPath, outputPath });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("generation is deterministic and check does not write", () =>
  fixture(async (options) => {
    await generate(options);
    const first = await readFile(options.outputPath, "utf8");
    await generate(options);
    assert.equal(await readFile(options.outputPath, "utf8"), first);
    await generate({ ...options, check: true });
    assert.equal(await readFile(options.outputPath, "utf8"), first);
  }));

test("output drift fails without overwriting the changed output", () =>
  fixture(async (options) => {
    await generate(options);
    await writeFile(options.outputPath, "drift");
    await assert.rejects(generate({ ...options, check: true }), /out of date/);
    assert.equal(await readFile(options.outputPath, "utf8"), "drift");
  }));

test("snapshot drift is detected even when it does not alter generated shapes", () =>
  fixture(async (options) => {
    await generate(options);
    const before = await readFile(options.outputPath, "utf8");
    await writeFile(
      options.schemaPath,
      JSON.stringify({ ...schema, info: { title: "Changed", version: "1" } }),
    );
    await assert.rejects(generate({ ...options, check: true }), /out of date/);
    assert.equal(await readFile(options.outputPath, "utf8"), before);
  }));

test("external references are rejected before loading other files or URLs", () =>
  fixture(async (options) => {
    for (const ref of [
      "https://example.invalid/contract",
      "../private.json",
      "file:///tmp/private.json",
    ]) {
      await writeFile(
        options.schemaPath,
        JSON.stringify({
          ...schema,
          components: { schemas: { Example: { $ref: ref } } },
        }),
      );
      await assert.rejects(generate(options), /local fragment/);
    }
  }));
