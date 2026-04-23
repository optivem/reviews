#!/usr/bin/env node

/**
 * Sync course structure: scan sandbox-project.md files in each module
 * and update config/courses/*.json with module metadata (number, label,
 * name). Does NOT touch URLs.
 *
 * Modules without a sandbox-project.md are excluded from the config.
 *
 * Usage: node scripts/sync-course-structure.mjs [courses-root]
 *   courses-root defaults to ../courses (relative to hub repo root)
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const coursesRoot = resolve(process.argv[2] || join(ROOT, "..", "courses"));

const COURSES = [
  { id: "pipeline", configFile: "01-pipeline.json", coursePath: join(coursesRoot, "01-pipeline", "accelerator", "course") },
  { id: "atdd", configFile: "02-atdd.json", coursePath: join(coursesRoot, "02-atdd", "accelerator", "course") },
];

function readModuleTitle(moduleDir) {
  const indexPath = join(moduleDir, "_index.md");
  if (!existsSync(indexPath)) return null;
  const content = readFileSync(indexPath, "utf-8").trim();
  const match = content.match(/^#\s*\d+\.\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

function scanModules(coursePath) {
  const dirs = readdirSync(coursePath)
    .filter(d => /^\d{2}-/.test(d) && !d.includes("DRAFT") && !d.includes("guide") && statSync(join(coursePath, d)).isDirectory())
    .sort();

  return dirs.map(dir => {
    const moduleDir = join(coursePath, dir);
    const name = readModuleTitle(moduleDir);
    if (!name) return null;

    const sandboxFile = readdirSync(moduleDir)
      .find(f => f.includes("sandbox-project") && f.endsWith(".md"));
    if (!sandboxFile) return null;

    return {
      number: dir.slice(0, 2),
      label: dir,
      name,
    };
  }).filter(Boolean);
}

const configDir = join(ROOT, "config", "courses");

for (const { id: courseId, configFile, coursePath } of COURSES) {
  const configPath = join(configDir, configFile);

  if (!existsSync(configPath)) {
    console.log(`Skipping ${courseId}: no config file at ${configPath}`);
    continue;
  }
  if (!existsSync(coursePath)) {
    console.log(`Skipping ${courseId}: course path not found at ${coursePath}`);
    continue;
  }

  const course = JSON.parse(readFileSync(configPath, "utf-8"));
  const scanned = scanModules(coursePath);

  const existingUrls = new Map();
  for (const m of course.modules || []) {
    existingUrls.set(m.number, m.url || "");
  }

  course.modules = scanned.map(m => ({
    number: m.number,
    label: m.label,
    name: m.name,
    url: existingUrls.get(m.number) || "",
  }));

  writeFileSync(configPath, JSON.stringify(course, null, 2) + "\n");

  console.log(`${courseId}: ${course.modules.length} modules`);
}
