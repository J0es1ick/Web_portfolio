import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SECTION_IDS,
  PROJECT_IDS,
  INITIAL_STATE,
  resolveHash,
  stepSection,
  stepProject,
  hashForState,
} from "../player-state.js";

test("all existing section and project links open the correct screen", () => {
  for (const section of SECTION_IDS)
    assert.equal(resolveHash(`#${section}`).section, section);
  for (const project of PROJECT_IDS)
    assert.deepEqual(resolveHash(`#${project}`), {
      section: "projects",
      project,
    });
  assert.deepEqual(resolveHash("#scheduler"), {
    section: "projects",
    project: "scheduler",
  });
  for (const hash of ["", "#top", "#main", "#missing", "#%invalid"])
    assert.deepEqual(resolveHash(hash), INITIAL_STATE);
});

test("section transport wraps and retains the chosen project", () => {
  const state = { section: "contact", project: "game" };
  assert.deepEqual(stepSection(state, 1), {
    section: "about",
    project: "game",
  });
  assert.deepEqual(stepSection({ ...state, section: "about" }, -1), state);
  assert.deepEqual(resolveHash("#projects", state), {
    section: "projects",
    project: "game",
  });
  assert.deepEqual(state, { section: "contact", project: "game" });
});

test("project transport wraps and direct links round-trip through history", () => {
  assert.deepEqual(
    stepProject({ section: "projects", project: "reminder" }, 1),
    { section: "projects", project: "scheduler" },
  );
  assert.deepEqual(
    stepProject({ section: "projects", project: "scheduler" }, -1),
    { section: "projects", project: "reminder" },
  );
  for (const section of SECTION_IDS) {
    for (const project of PROJECT_IDS) {
      const state = { section, project };
      assert.deepEqual(resolveHash(hashForState(state), state), state);
    }
  }
});

test("normalizing a project landing URL preserves its original selection on Back", () => {
  const landing = resolveHash("#projects");
  const initialHistoryHash = hashForState(landing);
  assert.equal(initialHistoryHash, "#scheduler");
  const next = resolveHash("#shortli", landing);
  assert.deepEqual(resolveHash(initialHistoryHash, next), landing);
});

test("every selectable section, project and repository is present in the shipped HTML", async () => {
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, "HTML IDs must be unique");
  for (const section of SECTION_IDS) {
    assert.ok(ids.includes(section));
    assert.ok(ids.includes(`key-${section}`));
    assert.ok(html.includes(`data-section="${section}"`));
  }
  for (const project of PROJECT_IDS) {
    assert.ok(ids.includes(`project-${project}`));
    assert.ok(html.includes(`data-project="${project}"`));
    assert.ok(html.includes(`data-project-detail="${project}"`));
  }
  assert.equal(
    [...html.matchAll(/\bdata-repository\b/g)].length,
    PROJECT_IDS.length,
  );
  for (const match of html.matchAll(
    /\baria-(?:controls|labelledby)="([^"]+)"/g,
  )) {
    for (const id of match[1].split(" "))
      assert.ok(ids.includes(id), `Missing accessibility target: ${id}`);
  }
});
