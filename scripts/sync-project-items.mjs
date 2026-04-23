#!/usr/bin/env node

/**
 * Populate items on the hub GitHub Project board (config.board).
 *
 * For each course in board.courses:
 *   1. Query optivem/hub for issues with label `course-<courseId>`.
 *   2. Add each issue to the board if not already present.
 *   3. Set field values derived from the issue's labels:
 *        - Student Project ← project-<key> label
 *        - Module          ← module-<NN>-<slug> label
 *        - Course          ← course-<id> label (only set on multi-course boards)
 *        - Status          ← the item's existing Status on the board (no-op
 *                            on re-run; preserved across script invocations).
 *
 * This script only adds items and sets field values. It never removes items
 * from any project.
 *
 * Safety:
 *   - Dry-run by default; pass --add to mutate.
 *   - Never deletes items from any board.
 *
 * Usage:
 *   node scripts/sync-project-items.mjs          # dry-run
 *   node scripts/sync-project-items.mjs --add    # apply
 */

import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./load-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const ADD = args.includes("--add");

const THROTTLE_MS = 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TOKEN = execSync("gh auth token", { encoding: "utf-8" }).trim();

async function gql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors, null, 2)}`);
  }
  return json.data;
}

const config = loadConfig(ROOT);

const REPO_OWNER = "optivem";
const REPO_NAME = "hub";

// --- Fetch helpers ---

async function fetchBoardSchema(projectId) {
  const data = await gql(
    `query($projectId: ID!) {
       node(id: $projectId) {
         ... on ProjectV2 {
           title
           fields(first: 50) {
             nodes {
               ... on ProjectV2SingleSelectField {
                 id name options { id name }
               }
             }
           }
         }
       }
     }`,
    { projectId }
  );
  const byName = new Map();
  for (const f of data.node.fields.nodes) {
    if (f?.name) byName.set(f.name, f);
  }
  return { title: data.node.title, fields: byName };
}

// Fetch every issue in optivem/hub with label course-<courseId>, including
// its labels and its existing project item IDs (per project) so we can detect
// "already on the board" without a second query.
async function fetchIssuesByLabel(labelName) {
  const issues = [];
  let after = null;
  while (true) {
    const data = await gql(
      `query($owner: String!, $name: String!, $labels: [String!], $after: String) {
         repository(owner: $owner, name: $name) {
           issues(first: 50, after: $after, labels: $labels, states: [OPEN, CLOSED], orderBy: {field: CREATED_AT, direction: ASC}) {
             pageInfo { hasNextPage endCursor }
             nodes {
               id number title
               labels(first: 30) { nodes { name } }
               projectItems(first: 10) {
                 nodes {
                   id
                   project { id }
                   fieldValueByName(name: "Status") {
                     ... on ProjectV2ItemFieldSingleSelectValue { name }
                   }
                 }
               }
             }
           }
         }
       }`,
      { owner: REPO_OWNER, name: REPO_NAME, labels: [labelName], after }
    );
    const page = data.repository.issues;
    issues.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return issues;
}

// --- Label → field value resolution ---

function projectKeyFromLabels(labels) {
  const lbl = labels.find((n) => n.startsWith("project-"));
  return lbl ? lbl.slice("project-".length).toUpperCase() : null;
}

function moduleLabelFromLabels(labels) {
  const lbl = labels.find((n) => n.startsWith("module-"));
  return lbl ? lbl.slice("module-".length) : null; // e.g. "02-commit-stage"
}

function studentProjectOptionName(projectKey) {
  const p = config.projects.find((pp) => pp.key.toUpperCase() === projectKey);
  return p ? `${p.key} — ${p.name}` : null;
}

function moduleOptionName(courseId, moduleLabel) {
  if (!moduleLabel) return null;
  const course = config.courses.find((c) => c.id === courseId);
  if (!course) return null;
  const num = moduleLabel.split("-")[0];
  const mod = course.modules.find((m) => m.number === num);
  return mod ? `${mod.number} - ${mod.name}` : null;
}

// --- Mutations ---

async function addItemToProject(projectId, contentId) {
  const data = await gql(
    `mutation($projectId: ID!, $contentId: ID!) {
       addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
         item { id }
       }
     }`,
    { projectId, contentId }
  );
  return data.addProjectV2ItemById.item.id;
}

async function setSingleSelect(projectId, itemId, fieldId, optionId) {
  await gql(
    `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
       updateProjectV2ItemFieldValue(input: {
         projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
         value: { singleSelectOptionId: $optionId }
       }) { projectV2Item { id } }
     }`,
    { projectId, itemId, fieldId, optionId }
  );
}

// --- Core per-issue logic ---

function resolveFieldValue(fieldName, field, desiredName) {
  if (!field || !desiredName) return null;
  const opt = field.options.find((o) => o.name === desiredName);
  if (opt) return { field: fieldName, fieldId: field.id, optionId: opt.id, optionName: desiredName };
  return { field: fieldName, missing: desiredName };
}

function buildFieldValuePlan(issue, board, schema, course, multiCourse) {
  const labels = issue.labels.nodes.map((l) => l.name);
  const projectKey = projectKeyFromLabels(labels);
  const moduleLabel = moduleLabelFromLabels(labels);

  const spName = projectKey ? studentProjectOptionName(projectKey) : null;
  const mName = moduleOptionName(course.id, moduleLabel);

  const legacyItem = issue.projectItems.nodes.find((n) => n.project.id === config.board.id);
  const legacyStatusName = legacyItem?.fieldValueByName?.name || null;

  const toSet = [
    resolveFieldValue("Sandbox Project", schema.fields.get("Sandbox Project"), spName),
    resolveFieldValue("Module", schema.fields.get("Module"), mName),
    resolveFieldValue("Status", schema.fields.get("Status"), legacyStatusName),
  ];
  if (multiCourse) {
    toSet.push(resolveFieldValue("Course", schema.fields.get("Course"), course.id.toUpperCase()));
  }

  const boardItem = issue.projectItems.nodes.find((n) => n.project.id === board.id);
  return { boardItem, toSet: toSet.filter(Boolean) };
}

async function processIssue(issue, board, schema, course, multiCourse, counters) {
  const plan = buildFieldValuePlan(issue, board, schema, course, multiCourse);
  console.log(`\n  #${issue.number} ${issue.title}`);

  let itemId = plan.boardItem?.id;
  if (itemId) {
    console.log(`    ok: already on board`);
  } else {
    console.log(`    + add to board`);
    if (ADD) {
      itemId = await addItemToProject(board.id, issue.id);
      await sleep(THROTTLE_MS);
    }
    counters.added++;
  }

  for (const f of plan.toSet) {
    if (f.missing) {
      console.log(`    ! ${f.field}: no matching option for "${f.missing}"`);
      counters.missingOpts++;
      continue;
    }
    console.log(`    ~ ${f.field} = ${f.optionName}`);
    if (ADD && itemId) {
      await setSingleSelect(board.id, itemId, f.fieldId, f.optionId);
      await sleep(THROTTLE_MS);
      counters.fieldsSet++;
    }
  }
}

// --- Main ---

const mode = ADD ? "ADD" : "DRY-RUN";
console.log(`=== sync-project-items (${mode}) ===`);

if (!config.board?.id) {
  console.log("No board configured in config/board.json (board.id is missing).");
  process.exit(1);
}

const board = config.board;
const schema = await fetchBoardSchema(board.id);
console.log(`\n── ${schema.title} (${board.url}) ──`);

const courseIds = board.courses || [];
const multiCourse = courseIds.length > 1;
const counters = { added: 0, fieldsSet: 0, missingOpts: 0 };

for (const courseId of courseIds) {
  const course = config.courses.find((c) => c.id === courseId);
  if (!course) {
    console.log(`  SKIP: course "${courseId}" not in config.courses`);
    continue;
  }
  const labelName = `course-${courseId}`;
  const issues = await fetchIssuesByLabel(labelName);
  console.log(`\n  course "${courseId}": ${issues.length} issue(s) labelled "${labelName}"`);
  for (const issue of issues) {
    await processIssue(issue, board, schema, course, multiCourse, counters);
  }
}

console.log(
  `\n  Summary: +${counters.added} added, ~${counters.fieldsSet} field values set, ${counters.missingOpts} unresolved`
);

if (!ADD) {
  console.log("\nDry-run only. Re-run with --add to apply.\n");
}
