# Roadmap

This page gives you the full picture — every module, milestones, time estimates, and a week-by-week schedule.

**Total estimated time: ~17 hours across 8 milestones (including prerequisites).**

---

## Module 0. Prerequisites (~4h)

**Milestone 0. Prerequisites** ~4h
- Pipeline tool selected and accessible (e.g. GitHub Actions, Jenkins, GitLab CI/CD)
- Artifact repository set up (e.g. GitHub Packages, Docker Hub, ECR)
- Application dockerized with Dockerfile and docker-compose.yml
- Application builds and runs locally using Docker

---

## Module 1. Introduction (~1h)

**Milestone 1. Setup** ~1h
- Project set up using the Greeter template

---

## Module 2. Commit Stage (~3h)

**Milestone 1. Commit Stage** ~3h
- Commit Stage workflow with compile, build, and push steps
- Correct triggers (push, PR, manual)
- Each component has its own Commit Stage
- Artifact published with latest version tag

---

## Module 3. Acceptance Stage (~5h)

**Milestone 1. Acceptance Stage** ~2h
- Acceptance Stage workflow completes successfully
- RC version created; all component artifacts tagged

**Milestone 2. Smoke Tests** ~1h
- At least one smoke test verifying the system is reachable after deployment
- Acceptance Stage detects a failing smoke test

**Milestone 3. E2E Tests** ~2h
- At least 3 E2E tests (external system, CRUD, business logic)
- Acceptance Stage detects a failing E2E test

---

## Module 4. QA Stage (~2h)

**Milestone 1. QA Stage** ~2h
- QA Stage workflow completes; release marked as QA deployed
- QA Signoff workflow completes; release marked as QA approved

---

## Module 5. Production Stage (~2h)

**Milestone 1. Production Stage** ~2h
- Production Stage workflow completes
- Release tagged and marked as Latest in GitHub Releases
- Artifact has final version tag

---

## Module 6. Extensions — Optional

Additional pipeline capabilities: trunk-based development, configuration management, database migrations, feature flags, blue-green/canary deployments, post-deployment observability.

---

## Module 7. Adoption Guide — Reference

Meeting guides for introducing the pipeline at work — alignment and showcase meetings for each stage.

---

## Time Summary

| Module | Milestones | Hours |
|--------|:----------:|------:|
| 0. Prerequisites | 1 | 4 |
| 1. Introduction | 1 | 1 |
| 2. Commit Stage | 1 | 3 |
| 3. Acceptance Stage | 3 | 5 |
| 4. QA Stage | 1 | 2 |
| 5. Production Stage | 1 | 2 |
| **Total** | **8** | **~17** |

---

## 4-Week Schedule (~5 hours/week)

| Week | Module | Milestones | Hours |
|:----:|--------|------------|------:|
| 1 | 0. Prerequisites | Prerequisites | 4 |
| 1 | 1. Introduction | Setup | 1 |
| 2 | 2. Commit Stage | Commit Stage | 3 |
| 2 | 3. Acceptance Stage | Acceptance Stage | 2 |
| 3 | 3. Acceptance Stage | Smoke Tests + E2E Tests | 3 |
| 3 | 4. QA Stage | QA Stage | 2 |
| 4 | 5. Production Stage | Production Stage | 2 |

**Pace: ~5 hours/week for 4 weeks.**

Module 6 (Extensions) is optional and open-ended — work on it after completing the core curriculum if time permits. Module 7 (Adoption Guide) is reference material for when you introduce the pipeline at work.
