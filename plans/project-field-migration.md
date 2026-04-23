# Project 18 Field-Based Migration — Remaining Work

Follow-up work after migrating `optivem/hub` Project 18 from label-based to field-based structure. Fields `Course`, `Sandbox Project`, `Module`, `Status` exist and are populated on all 45 current items.

Processing rule: remove each item from this file as it is executed; delete the file when empty; delete the `plans/` directory when empty.
---

## Phase 2 — Auto-populate fields on new issues

- [ ] Verify on a test issue end-to-end: create issue from template → labels applied → fields populated (Course/Sandbox Project/Module set on the board item)

Composite action `.github/actions/set-project-fields` and the wiring in `auto-on-created.yml` are in place. This item is the live-fire verification.

APPPROVED

---

## Phase 3 — Deferred / optional

- [ ] Discussions setup on `optivem/hub`
  - Categories: `Pipeline Q&A` (Q&A), `ATDD Q&A` (Q&A), `Announcements` (Announcement), `General` (Open-ended)
  - Align with the parked hub-privacy plan (activates 2026-07-02 per memory)
- [ ] Parent issues per (sandbox × course) with modules as sub-issues
  - Originally proposed for per-project rollups
  - Probably unnecessary once the 8 per-project views exist — revisit only if native view filtering proves insufficient


WAIT

---

## Reference — completed in this migration

For audit trail only (do not re-do):
- Renamed config: `statusOptionIds` (was `statusOptions`), `Sandbox Project` (was `Student Project`)
- Consolidated `config/board.json` as the single board config; removed `config/boards/`
- Created and then deleted temporary per-course boards (GitHub Projects 24 and 25)
- Added `Course`, `Sandbox Project`, `Module` fields to Project 18 with correct options
- Populated field values on all 45 existing items, Status copied from current values
- `sync-project.mjs` added (default dry-run, explicit `--add` to apply)
- `set-project-status` action updated to read option IDs from `config.board.statusOptionIds`
- Composite action `.github/actions/set-project-fields` created; wired into `auto-on-created.yml` to auto-populate Course, Sandbox Project, Module on new issues
- `scripts/load-config.{mjs,cjs}` switched to `node:fs`/`node:path` prefixes
- `scripts/sync.mjs` orchestrator extended with `project-schema` dry-run step
- `scripts/generate-dashboard.mjs` rewritten to read fields instead of labels
- `actions/check-duplicate` and `actions/check-prerequisites` rewritten to query the project board
- Labels fully eliminated from the codebase:
  - `auto-on-created.yml` no longer writes any labels (project-/course-/module-/closed-*)
  - `auto-on-edited.yml` label anti-tampering dropped (no longer triggers on labeled/unlabeled events)
  - `sync-labels.mjs`, `sync-labels.yml` workflow, `add-labels`/`add-label`/`remove-label` actions, `config/labels.json`, `sync-project-items.mjs` all deleted as orphaned
  - 33 custom labels deleted org-wide (8 project-*, 2 course-*, 20 module-*, 3 closed-*); only GitHub default labels remain unused
