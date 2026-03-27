# Roadmap

This page gives you the full picture — every module, milestones, time estimates, and a week-by-week schedule.

**Total estimated time: ~79 hours across 31 milestones (including prerequisites).**

---

## Module 0. Prerequisites (~8h)

**Milestone 0. Prerequisites** ~8h
- Pipeline with Acceptance Stage and automated deployment to test environment
- CRUD application with UI, API, and at least one external REST API dependency
- System clock abstraction in place
- Application runs locally via Docker Compose
- Test repository created (separate repo or folder inside application repo)

---

## Module 1. Introduction (~2h)

**Milestone 1. Setup** ~2h
- Project repository created with LICENSE, collaborators, and README
- System includes UI, API, external REST API, and system clock

---

## Module 2. Smoke Tests (~3h)

**Milestone 1. Smoke Tests** ~3h
- API smoke test, UI smoke test, and external system smoke tests

---

## Module 3. E2E Tests (~8h)

**Milestone 1. Positive and Negative Tests** ~5h
- Positive API tests (create, update, retrieve)
- Negative API tests (null/empty, invalid type, invalid range)
- Positive and negative UI tests

**Milestone 2. Parameterized and External System Tests** ~3h
- Parameterized and non-parameterized tests
- Tests showing controllable output, uncontrollable output, and uncontrollable factor

---

## Module 4. Architecture — Clients (~5h)

**Milestone 1. Smoke Tests** ~2h
- System API Client, System UI Client, and External System Clients
- All smoke tests refactored to use clients

**Milestone 2. E2E Tests** ~3h
- All E2E tests refactored to use clients — no raw HTTP or Playwright calls

---

## Module 5. Architecture — Drivers (~5h)

**Milestone 1. Smoke Tests** ~2h
- System Driver interface + API and UI implementations
- External System Driver interfaces + implementations
- Smoke tests use driver interfaces via base class + subclasses

**Milestone 2. E2E Tests** ~3h
- All E2E tests use driver interfaces — no client references in tests

---

## Module 6. Architecture — Channels (~3h)

**Milestone 1. Smoke Tests** ~1h
- ChannelType enum with API and UI; @Channel annotation
- Smoke tests collapsed to single class — no base/subclass hierarchy

**Milestone 2. E2E Tests** ~2h
- All E2E tests use @Channel — no base/subclass hierarchy
- Pipeline runs tests for each channel

---

## Module 7. Architecture — Use Case DSL (~6h)

**Milestone 1. Smoke Tests** ~3h
- UseCase, BaseUseCase, UseCaseContext, verification classes, UseCaseDsl, ShopDsl, BaseUseCaseDslTest
- External system DSLs following the same pattern
- All smoke tests use DSL style

**Milestone 2. E2E Tests** ~3h
- Use case classes for each operation with paired verification classes
- All E2E tests use DSL — no manual request construction or direct driver references

---

## Module 8. Architecture — Scenario DSL (~6h)

**Milestone 1. Smoke Tests** ~3h
- ScenarioDsl, AssumeStage, ScenarioDslImpl, BaseScenarioDslTest
- All smoke tests use scenario.assume() style

**Milestone 2. E2E Tests** ~3h
- GivenStage, WhenStage, ThenResultStage with all steps
- All E2E tests use scenario.given()...when()...then() — no Use Case DSL calls

---

## Module 9. Architecture — External Stubs (~8h)

**Milestone 1. Real HTTP** ~2h
- ExternalSystemMode enum; BaseConfigurableTest reads mode from environment
- All smoke tests pass with EXTERNAL_SYSTEM_MODE=REAL

**Milestone 2. Real Non-IO** ~3h
- ClockDriver interface + real implementation
- Clock smoke test added and passing

**Milestone 3. Stub** ~3h
- WireMock Docker services for each external system
- Stub clients and stub drivers for each external system
- All smoke tests pass in both REAL and STUB modes

---

## Module 10. Acceptance Tests (~5h)

**Milestone 1. Acceptance Tests** ~2h
- BaseAcceptanceTest with ExternalSystemMode.STUB
- Every use case has a corresponding acceptance test class

**Milestone 2. Stub-Only Scenarios** ~1.5h
- Scenarios configuring exact stub values and asserting exact outcomes

**Milestone 3. Suite Separation** ~1.5h
- Acceptance suite runs in STUB mode; E2E suite runs in REAL mode
- Both suites pass independently

---

## Module 11. External System Contract Tests (~5h)

**Milestone 1. Contract Tests** ~3h
- Base contract test with shared scenarios
- Real and stub subclasses; both modes pass

**Milestone 2. E2E Tests Cleanup** ~2h
- E2E tests covered by acceptance + contract tests deleted
- Remaining suites still pass

---

## Module 12. ATDD — Acceptance Criteria (~3h)

**Milestone 1. Acceptance Criteria** ~3h
- Three Amigos session producing concrete rules
- Gherkin scenarios with specific values for positive and negative cases

---

## Module 13. ATDD — Acceptance Tests (~6h)

**Milestone 1. RED Phase** ~2h
- Acceptance tests written before implementation
- Each phase committed separately

**Milestone 2. GREEN Phase** ~2.5h
- RED → GREEN cycle: test → DSL → driver → system
- All acceptance tests pass for both API and UI channels

**Milestone 3. Bug Fix** ~1.5h
- Bug reproduced as a failing acceptance test, fixed, test passes

---

## Module 14. ATDD — External System Contract Tests (~4h)

**Milestone 1. Contract Test — RED** ~1.5h
- Contract test passes against real, fails against stub

**Milestone 2. Contract Test — GREEN** ~1.5h
- Stub implemented; contract test passes both modes

**Milestone 3. Complete the ATDD Cycle** ~1h
- Acceptance test that triggered the subprocess now passes

---

## Module 15. Structural Changes (~2h)

**Milestone 1. UX/UI Redesign** ~2h
- UI change made; API tests unchanged
- Only UI drivers updated — no test or DSL changes
- All acceptance tests pass after driver update

---

## Module 16. Adoption Guide — Reference

Meeting guides for introducing each architectural layer at work — alignment and showcase meetings for each version.

---

## Module 17. Architecture Reference — Reference

Reference diagrams and documentation for the destination architecture.

---

## Time Summary

| Module | Milestones | Hours |
|--------|:----------:|------:|
| 0. Prerequisites | 1 | 8 |
| 1. Introduction | 1 | 2 |
| 2. Smoke Tests | 1 | 3 |
| 3. E2E Tests | 2 | 8 |
| 4. Clients | 2 | 5 |
| 5. Drivers | 2 | 5 |
| 6. Channels | 2 | 3 |
| 7. Use Case DSL | 2 | 6 |
| 8. Scenario DSL | 2 | 6 |
| 9. External Stubs | 3 | 8 |
| 10. Acceptance Tests | 3 | 5 |
| 11. Contract Tests | 2 | 5 |
| 12. Acceptance Criteria | 1 | 3 |
| 13. ATDD Tests | 3 | 6 |
| 14. Contract ATDD | 3 | 4 |
| 15. Structural Changes | 1 | 2 |
| **Total** | **31** | **~79** |

---

## 16-Week Schedule (~5 hours/week)

| Week | Module | Milestones | Hours |
|:----:|--------|------------|------:|
| 1 | 0. Prerequisites | Prerequisites | 5 |
| 2 | 0. Prerequisites | Prerequisites (continued) | 3 |
| 2 | 1. Introduction | Setup | 2 |
| 3 | 2. Smoke Tests | Smoke Tests | 3 |
| 4 | 3. E2E Tests | Positive and Negative Tests | 5 |
| 5 | 3. E2E Tests | Parameterized and External System Tests | 3 |
| 5 | 4. Clients | Smoke Tests | 2 |
| 6 | 4. Clients | E2E Tests | 3 |
| 6 | 5. Drivers | Smoke Tests | 2 |
| 7 | 5. Drivers | E2E Tests | 3 |
| 7 | 6. Channels | Smoke Tests | 1 |
| 8 | 6. Channels | E2E Tests | 2 |
| 8 | 7. Use Case DSL | Smoke Tests | 3 |
| 9 | 7. Use Case DSL | E2E Tests | 3 |
| 9 | 8. Scenario DSL | Smoke Tests (start) | 2 |
| 10 | 8. Scenario DSL | Smoke Tests (finish) + E2E Tests | 4 |
| 11 | 9. External Stubs | Real HTTP + Real Non-IO | 5 |
| 12 | 9. External Stubs | Stub | 3 |
| 12 | 10. Acceptance Tests | Acceptance Tests | 2 |
| 13 | 10. Acceptance Tests | Stub-Only Scenarios + Suite Separation | 3 |
| 13 | 11. Contract Tests | Contract Tests (start) | 2 |
| 14 | 11. Contract Tests | Contract Tests (finish) + E2E Tests Cleanup | 3 |
| 14 | 12. Acceptance Criteria | Acceptance Criteria (start) | 2 |
| 15 | 12. Acceptance Criteria | Acceptance Criteria (finish) | 1 |
| 15 | 13. ATDD Tests | RED Phase | 2 |
| 15 | 13. ATDD Tests | GREEN Phase (start) | 1 |
| 16 | 13. ATDD Tests | GREEN Phase (finish) + Bug Fix | 3 |
| 16 | 14. Contract ATDD | Contract Test RED + GREEN | 3 |

**Pace: ~5 hours/week for 16 weeks.**

Weeks 1–2 are prerequisites and setup. Weeks 3–5 build the foundation — smoke tests and E2E tests against your real system. Weeks 5–10 are the Architecture Evolution — you restructure the test code without writing new tests. The payoff arrives in week 12 when acceptance tests let you assert exact business values for the first time.

Module 14 (Complete the ATDD Cycle) and Module 15 (Structural Changes) are not included in the weekly schedule — complete them after the core curriculum at your own pace. Module 16 (Adoption Guide) and Module 17 (Architecture Reference) are reference material — use them when you introduce the approach at work.
