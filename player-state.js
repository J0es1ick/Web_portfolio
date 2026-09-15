export const SECTION_IDS = Object.freeze([
  "about",
  "projects",
  "skills",
  "experience",
  "contact",
]);
export const PROJECT_IDS = Object.freeze([
  "scheduler",
  "shortli",
  "game",
  "balancer",
  "resplitter",
  "reminder",
]);
export const INITIAL_STATE = Object.freeze({
  section: "about",
  project: "scheduler",
});

export function resolveHash(hash, previous = INITIAL_STATE) {
  let id;
  try {
    id = decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return { ...INITIAL_STATE };
  }
  const project = PROJECT_IDS.includes(previous.project)
    ? previous.project
    : INITIAL_STATE.project;
  if (PROJECT_IDS.includes(id)) return { section: "projects", project: id };
  if (SECTION_IDS.includes(id)) return { section: id, project };
  return { ...INITIAL_STATE };
}

function cycle(values, current, direction) {
  const index = Math.max(0, values.indexOf(current));
  return values[
    (((index + direction) % values.length) + values.length) % values.length
  ];
}

export function stepSection(state, direction) {
  return { ...state, section: cycle(SECTION_IDS, state.section, direction) };
}

export function stepProject(state, direction) {
  return {
    section: "projects",
    project: cycle(PROJECT_IDS, state.project, direction),
  };
}

export function hashForState(state) {
  return `#${state.section === "projects" ? state.project : state.section}`;
}
