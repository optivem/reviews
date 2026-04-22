#!/usr/bin/env node

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { loadConfig } from "./load-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");

const config = loadConfig(ROOT);

// Label colors by type
const COLORS = {
  course: "5319e7",    // purple
  project: "0075ca",   // blue
  module: "e4e669",    // yellow
  closed: "d73a4a",    // red
};

// GitHub default labels — never delete, never recolor
const PROTECTED = new Set(config.labels.githubDefaults);

// Build expected labels from config
const expected = new Map();

for (const p of config.projects) {
  expected.set(`project-${p.key.toLowerCase()}`, COLORS.project);
}

for (const c of config.courses) {
  expected.set(`course-${c.id}`, COLORS.course);
}

for (const c of config.courses) {
  for (const m of c.modules) {
    const moduleKey = m.label || m.number;
    expected.set(`module-${moduleKey}`, COLORS.module);
  }
}

for (const reason of config.labels.closedReasons) {
  expected.set(`closed-${reason}`, COLORS.closed);
}

// Fetch existing labels (with colors)
const existing = new Map();
for (const l of JSON.parse(
  execSync("gh label list --limit 500 --json name,color", { encoding: "utf-8" })
)) {
  existing.set(l.name, l.color);
}

// Compute diff
const toCreate = [];
const toUpdate = [];
const toDelete = [];

for (const [name, color] of expected) {
  if (!existing.has(name)) {
    toCreate.push({ name, color });
  } else if (existing.get(name).toLowerCase() !== color.toLowerCase()) {
    toUpdate.push({ name, color, oldColor: existing.get(name) });
  }
}

for (const [name] of existing) {
  if (!expected.has(name) && !PROTECTED.has(name)) {
    toDelete.push(name);
  }
}

// Check issue usage on to-delete labels before deleting.
// Single gh call — build label -> count map from all issues at once.
const labelUsage = new Map();
const allIssues = JSON.parse(
  execSync("gh issue list --state all --limit 1000 --json labels", {
    encoding: "utf-8",
  })
);
for (const iss of allIssues) {
  for (const l of iss.labels) {
    labelUsage.set(l.name, (labelUsage.get(l.name) || 0) + 1);
  }
}
const issueCount = (label) => labelUsage.get(label) || 0;

// Print plan
const mode = APPLY ? "APPLY" : "DRY-RUN";
console.log(`\n=== sync-labels (${mode}) ===\n`);

console.log(`Create (${toCreate.length}):`);
for (const { name, color } of toCreate) {
  console.log(`  + ${name} (#${color})`);
}

console.log(`\nUpdate color (${toUpdate.length}):`);
for (const { name, color, oldColor } of toUpdate) {
  console.log(`  ~ ${name}: #${oldColor} -> #${color}`);
}

console.log(`\nDelete (${toDelete.length}):`);
const deleteSafe = [];
const deleteBlocked = [];
for (const name of toDelete) {
  const n = issueCount(name);
  if (n > 0) {
    deleteBlocked.push({ name, count: n });
    console.log(`  ! ${name} (SKIPPED — ${n} issue(s) attached)`);
  } else {
    deleteSafe.push(name);
    console.log(`  - ${name}`);
  }
}

console.log(
  `\nSummary: +${toCreate.length} create, ~${toUpdate.length} update, -${deleteSafe.length} delete, ${deleteBlocked.length} blocked\n`
);

if (!APPLY) {
  console.log("Dry-run only. Re-run with --apply to execute.\n");
  process.exit(0);
}

// Execute
for (const { name, color } of toCreate) {
  console.log(`Creating: ${name}`);
  execSync(`gh label create "${name}" --color "${color}" --force`, {
    stdio: "inherit",
  });
}

for (const { name, color } of toUpdate) {
  console.log(`Updating: ${name}`);
  execSync(`gh label edit "${name}" --color "${color}"`, { stdio: "inherit" });
}

for (const name of deleteSafe) {
  console.log(`Deleting: ${name}`);
  execSync(`gh label delete "${name}" --yes`, { stdio: "inherit" });
}

console.log("\nDone.\n");
