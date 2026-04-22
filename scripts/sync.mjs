#!/usr/bin/env node

/**
 * Sync all sandbox data derived from the courses repo.
 * Runs the local sync scripts in order:
 *
 *   1. sync-course-structure.mjs  → config/courses/*.json (modules + milestones)
 *   2. sync-checklists.mjs        → checklists/{courseId}/{NN}.md
 *   3. sync-issue-template.mjs    → .github/ISSUE_TEMPLATE/review-request.yml
 *   4. generate-dashboard.mjs     → docs/index.html (requires GITHUB_TOKEN/OWNER/REPO)
 *
 * Thinkific URL scraping (courses/tools/sync-sandbox-urls.ts) is separate —
 * it needs Playwright and lives in the courses repo.
 *
 * Usage: node scripts/sync.mjs
 */

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run(label, moduleFile) {
  console.log(`\n── ${label} ──`);
  await import(pathToFileURL(join(__dirname, moduleFile)).href);
}

await run("Course structure",   "./sync-course-structure.mjs");
await run("Review checklists",  "./sync-checklists.mjs");
await run("Issue template",     "./sync-issue-template.mjs");

if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
  await run("Dashboard",        "./generate-dashboard.mjs");
} else {
  console.log(`\n── Dashboard ──`);
  console.log("Skipped: set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO to include dashboard regeneration.");
  console.log("Tip: GITHUB_TOKEN=$(gh auth token) GITHUB_OWNER=optivem GITHUB_REPO=sandbox node scripts/sync.mjs");
}
