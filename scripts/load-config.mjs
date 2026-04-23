import { readFileSync, readdirSync } from "fs";
import { join } from "path";

export function loadConfig(rootDir) {
  const configDir = join(rootDir, "config");

  const board = JSON.parse(readFileSync(join(configDir, "board.json"), "utf-8"));
  const reviewers = JSON.parse(readFileSync(join(configDir, "reviewers.json"), "utf-8"));
  const students = JSON.parse(readFileSync(join(configDir, "students.json"), "utf-8"));
  const projects = JSON.parse(readFileSync(join(configDir, "projects.json"), "utf-8"));
  const labels = JSON.parse(readFileSync(join(configDir, "labels.json"), "utf-8"));

  const coursesDir = join(configDir, "courses");
  const courses = readdirSync(coursesDir)
    .filter(f => f.endsWith(".json"))
    .sort()
    .map(f => JSON.parse(readFileSync(join(coursesDir, f), "utf-8")));

  const boardsDir = join(configDir, "boards");
  let boards = [];
  try {
    boards = readdirSync(boardsDir)
      .filter(f => f.endsWith(".json"))
      .sort()
      .map(f => JSON.parse(readFileSync(join(boardsDir, f), "utf-8")));
  } catch (e) {
    // boards/ is optional — legacy configs don't have it yet
    if (e.code !== "ENOENT") throw e;
  }

  return {
    title: board.title,
    reviewers,
    board: board.board,
    boards,
    statuses: board.statuses,
    students,
    projects,
    courses,
    labels,
  };
}
