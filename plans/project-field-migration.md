# Project 18 Field-Based Migration — Remaining Work

Follow-up work after migrating `optivem/hub` Project 18 from label-based to field-based structure. Fields `Course`, `Sandbox Project`, `Module`, `Status` exist and are populated on all 45 current items.

Processing rule: remove each item from this file as it is executed; delete the file when empty; delete the `plans/` directory when empty.

---

## Phase 1 — UI cleanup (manual, Project 18 web UI)

- [ ] Reorder fields (Settings → Fields drag-and-drop): `Course → Sandbox Project → Module → Status`
- [ ] Create per-project views (one per student project, 8 total):
  - [ ] `BDOK` — filter `Sandbox Project = "BDOK — Budget OK"`, group by `Course`, sort by `Module` asc
  - [ ] `CCRS` — same pattern
  - [ ] `CTF` — same pattern
  - [ ] `ESLA` — same pattern
  - [ ] `FRS` — same pattern
  - [ ] `GHBL` — same pattern
  - [ ] `PWRH` — same pattern
  - [ ] `VGFN` — same pattern
- [ ] Optional: create coach-facing views
  - [ ] `Review Queue` — filter `Status = In Review`, sort by created asc
  - [ ] `Per-Course Progress` — table grouped by `Course`, then `Sandbox Project`, sort by `Module`

---

## Phase 2 — Auto-populate fields on new issues

Currently `.github/workflows/auto-on-created.yml` applies `project-*`, `course-*`, `module-*` labels to new issues but does not set the corresponding project fields. Result: new tickets land with labels only; fields stay blank until `sync-project-items.mjs` is re-run manually.

- [ ] Extend `auto-on-created.yml` to set the three fields after adding the issue to the project
  - Option A: inline GraphQL in the workflow using `gh api graphql`
  - Option B: extract a new composite action `.github/actions/set-project-fields` (inputs: `issue-node-id`, `course-id`, `project-key`, `module-num`; action looks up the field/option IDs at runtime and sets each via `updateProjectV2ItemFieldValue`)
  - Recommendation: Option B, mirrors the existing `set-project-status` action pattern
- [ ] Update `set-project-status` workflow callers if the new composite action handles Status too (probably out of scope — keep separate)
- [ ] Verify on a test issue end-to-end: create issue from template → labels applied → fields populated

APPROVED

---

## Phase 3 — Deferred / optional

- [ ] Prune old label families (destructive — requires explicit approval)
  - Labels to delete: `project-*` (8), `course-*` (2), `module-*` (~15)
  - Precondition: Phase 2 in place for at least one review cycle, no workflow still relying on these labels
  - Use `sync-labels.mjs --delete` (safety check: only deletes labels with zero issues attached)
- [ ] Discussions setup on `optivem/hub`
  - Categories: `Pipeline Q&A` (Q&A), `ATDD Q&A` (Q&A), `Announcements` (Announcement), `General` (Open-ended)
  - Align with the parked hub-privacy plan (activates 2026-07-02 per memory)
- [ ] Parent issues per (sandbox × course) with modules as sub-issues
  - Originally proposed for per-project rollups
  - Probably unnecessary once the 8 per-project views exist — revisit only if native view filtering proves insufficient


WAIT

---

## Phase 4 — Bookkeeping

- [ ] Minor: replace `fs`/`path` imports in `scripts/load-config.{mjs,cjs}` with `node:fs`/`node:path` (pre-existing linter warnings)
- [ ] Minor: consider adding `sync-project` / `sync-project-items` to `scripts/sync.mjs` orchestrator as dry-run-only steps (mirrors how `sync-labels` is included). Value is low since both are run directly when schema changes.

APPROVED

---

## Reference — completed in this migration

For audit trail only (do not re-do):
- Renamed config: `statusOptionIds` (was `statusOptions`), `Sandbox Project` (was `Student Project`)
- Consolidated `config/board.json` as the single board config; removed `config/boards/`
- Created and then deleted temporary per-course boards (GitHub Projects 24 and 25)
- Added `Course`, `Sandbox Project`, `Module` fields to Project 18 with correct options
- Populated field values on all 45 existing items, Status copied from current values
- `sync-project.mjs` and `sync-project-items.mjs` added; both default to dry-run with explicit `--add` flag
- `sync-labels.mjs` split from single `--apply` into granular `--add` / `--update` / `--delete`
- `set-project-status` action updated to read option IDs from `config.board.statusOptionIds`
