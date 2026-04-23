#!/usr/bin/env node

/**
 * Sync custom-field schema on per-course GitHub Project boards.
 *
 * For each board in config/boards/*.json, reconcile its fields:
 *   - Student Project — options from config.projects (key — name)
 *   - Module          — options from the course's modules (NN - Name)
 *   - Status          — options from config.statuses (names only; option IDs
 *                       are project-specific and looked up at runtime)
 *
 * This script only touches field *schema* (fields and their options). It does
 * NOT set field values on items — that lives in sync-project-items.mjs.
 *
 * Safety:
 *   - Dry-run by default; pass --apply to execute.
 *   - Never deletes an existing option (would orphan items).
 *   - Extras (options present on the board but not in config) are kept and
 *     surfaced as warnings — delete via the UI once you confirm nothing uses them.
 *
 * Usage:
 *   node scripts/sync-project.mjs
 *   node scripts/sync-project.mjs --apply
 *   node scripts/sync-project.mjs --only pipeline          # single board (courseId)
 *   node scripts/sync-project.mjs --only pipeline --apply
 */

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./load-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

const THROTTLE_MS = 750;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- GraphQL helper (uses gh's auth token) --------------------------------
const TOKEN = execSync("gh auth token", { encoding: "utf-8" }).trim();

async function gql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "GraphQL-Features": "projects_next_graphql",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data;
}

// --- Expected schema ------------------------------------------------------

const config = loadConfig(ROOT);

const STATUS_COLORS = {
  "Open":        "GRAY",
  "In Progress": "YELLOW",
  "In Review":   "PURPLE",
  "Done":        "GREEN",
};

function expectedFieldsFor(courseId) {
  const course = config.courses.find((c) => c.id === courseId);
  if (!course) return null;

  const studentProjectOptions = config.projects.map((p) => ({
    name: `${p.key} — ${p.name}`,
    color: "BLUE",
    description: p.repo || "",
  }));

  const moduleOptions = (course.modules || []).map((m) => ({
    name: `${m.number} - ${m.name}`,
    color: "YELLOW",
    description: "",
  }));

  const statusOptions = (config.statuses || []).map((s) => ({
    name: s.name,
    color: STATUS_COLORS[s.name] || "GRAY",
    description: "",
  }));

  return {
    "Student Project": studentProjectOptions,
    "Module": moduleOptions,
    "Status": statusOptions,
  };
}

// --- Reconcile one board --------------------------------------------------

async function fetchBoardFields(projectId) {
  const data = await gql(
    `query($projectId: ID!) {
       node(id: $projectId) {
         ... on ProjectV2 {
           title
           fields(first: 50) {
             nodes {
               ... on ProjectV2SingleSelectField {
                 id name
                 options { id name }
               }
               ... on ProjectV2FieldCommon {
                 id name dataType
               }
             }
           }
         }
       }
     }`,
    { projectId }
  );
  const nodes = data.node.fields.nodes;
  const byName = new Map();
  for (const f of nodes) if (f && f.name) byName.set(f.name, f);
  return { title: data.node.title, byName };
}

async function createField(projectId, name, options) {
  return gql(
    `mutation($projectId: ID!, $name: String!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
       createProjectV2Field(input: {
         projectId: $projectId,
         dataType: SINGLE_SELECT,
         name: $name,
         singleSelectOptions: $options
       }) {
         projectV2Field { ... on ProjectV2SingleSelectField { id name options { id name } } }
       }
     }`,
    { projectId, name, options }
  );
}

async function addOptionToField(projectId, fieldId, existingOptions, newOption) {
  // GraphQL replaces the full option list on update — preserve existing names/colors.
  const merged = [
    ...existingOptions.map((o) => ({ name: o.name, color: o.color || "GRAY", description: "" })),
    newOption,
  ];
  return gql(
    `mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
       updateProjectV2Field(input: {
         fieldId: $fieldId,
         singleSelectOptions: $options
       }) {
         projectV2Field { ... on ProjectV2SingleSelectField { id name } }
       }
     }`,
    { fieldId, options: merged }
  );
}

async function reconcileBoard(courseId, board) {
  const expected = expectedFieldsFor(courseId);
  if (!expected) {
    console.log(`  SKIP: no course config for "${courseId}"`);
    return { created: 0, optionsAdded: 0, skipped: 0 };
  }

  const actual = await fetchBoardFields(board.id);
  console.log(`\n── ${actual.title} (${board.url}) ──`);

  let created = 0, optionsAdded = 0, skipped = 0;

  for (const [fieldName, expectedOptions] of Object.entries(expected)) {
    const actualField = actual.byName.get(fieldName);

    if (!actualField) {
      console.log(`  + field: ${fieldName} (${expectedOptions.length} options)`);
      for (const o of expectedOptions) console.log(`      ${o.name}`);
      if (APPLY) {
        await createField(board.id, fieldName, expectedOptions);
        await sleep(THROTTLE_MS);
      }
      created++;
      continue;
    }

    // Field exists — diff options
    const actualOptionNames = new Set((actualField.options || []).map((o) => o.name));
    const toAdd = expectedOptions.filter((o) => !actualOptionNames.has(o.name));
    const extra = (actualField.options || []).filter(
      (o) => !expectedOptions.some((e) => e.name === o.name)
    );

    if (toAdd.length === 0 && extra.length === 0) {
      console.log(`  ok:    ${fieldName} (${expectedOptions.length} options)`);
      skipped++;
      continue;
    }

    if (toAdd.length > 0) {
      console.log(`  ~ field: ${fieldName} — adding ${toAdd.length} option(s):`);
      for (const o of toAdd) console.log(`      + ${o.name}`);
      if (APPLY) {
        await addOptionToField(board.id, actualField.id, actualField.options, toAdd[0]);
        await sleep(THROTTLE_MS);
        // If multiple to add, do one-by-one so merge stays correct.
        for (let i = 1; i < toAdd.length; i++) {
          const current = await fetchBoardFields(board.id);
          const currentField = current.byName.get(fieldName);
          await addOptionToField(board.id, currentField.id, currentField.options, toAdd[i]);
          await sleep(THROTTLE_MS);
        }
      }
      optionsAdded += toAdd.length;
    }

    if (extra.length > 0) {
      console.log(`  ! field: ${fieldName} — ${extra.length} extra option(s) kept (not in config):`);
      for (const o of extra) console.log(`      ? ${o.name}`);
    }
  }

  return { created, optionsAdded, skipped };
}

// --- Main -----------------------------------------------------------------

const mode = APPLY ? "APPLY" : "DRY-RUN";
console.log(`=== sync-project (${mode}) ===`);

const boards = (config.boards || []).filter(
  (b) => !ONLY || ONLY === b.courseId
);

if (boards.length === 0) {
  console.log("No boards to sync. Check config/boards/*.json and --only.");
  process.exit(0);
}

let totalCreated = 0, totalAdded = 0, totalSkipped = 0;
for (const board of boards) {
  const r = await reconcileBoard(board.courseId, board);
  totalCreated += r.created;
  totalAdded += r.optionsAdded;
  totalSkipped += r.skipped;
}

console.log(
  `\nSummary: +${totalCreated} field(s), +${totalAdded} option(s), ${totalSkipped} ok\n`
);

if (!APPLY) {
  console.log("Dry-run only. Re-run with --apply to execute.\n");
}
