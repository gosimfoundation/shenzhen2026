import { expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Exercise the actual command in an isolated project, never rewriting the working tree.
it("imports only the two canonical files and supports a read-only dry run", () => {
  const root = mkdtempSync(path.join(tmpdir(), "gosim-cfp-test-"));
  try {
    for (const dir of ["src/json", "scripts/lib"]) mkdirSync(path.join(root, dir), {recursive: true});
    for (const file of ["src/json/Speakers.json", "src/json/Schedule.json", "scripts/import-confirmed-speakers.mjs", "scripts/lib/confirmed-content.mjs"]) copyFileSync(file, path.join(root, file));
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"), "dir");
    const input = path.join(root, "export.json");
    writeFileSync(input, JSON.stringify([{ref: "P-999", status: "accept", name: "CLI Example", title: "CLI session", abstract: "CLI description", tracks: ["ws-vllm"]}]));
    const files = ["Speakers.json", "Schedule.json"];
    const snapshot = () => files.map((file) => readFileSync(path.join(root, "src/json", file), "utf8"));
    const before = snapshot();
    const run = (...args: string[]) => execFileSync(process.execPath, [path.join(root, "scripts/import-confirmed-speakers.mjs"), input, ...args], {encoding: "utf8"});
    expect(run("--dry-run")).toContain("no files or photos changed");
    expect(snapshot()).toEqual(before);
    run();
    const imported = snapshot();
    expect(JSON.parse(imported[0]).speakers.find((s) => s.id === "cli-example").draft).toBe(true);
    expect(readdirSync(path.join(root, "src/json")).sort()).toEqual([...files].sort());
    run();
    expect(snapshot()).toEqual(imported);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
