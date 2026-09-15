import {
  SECTION_IDS,
  PROJECT_IDS,
  resolveHash,
  stepSection,
  stepProject,
  hashForState,
} from "./player-state.js";
import { createPowerController } from "./power-state.js";

const root = document.documentElement;
const content = document.getElementById("screen-content");
const tablist = document.querySelector(".section-keys");
const tabs = [...tablist.querySelectorAll("[data-section]")];
const panels = SECTION_IDS.map((id) => document.getElementById(id));
const projectButtons = [...document.querySelectorAll("[data-project]")];
const projectDetails = [...document.querySelectorAll("[data-project-detail]")];
const selector = document.querySelector(".project-selector");
const action = document.getElementById("primary-action");
const announcement = document.getElementById("player-announcement");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionButton = document.getElementById("motion-toggle");
const powerButton = document.getElementById("power-toggle");
const player = document.querySelector(".player");
const screenUI = document.getElementById("screen-ui");
const hardware = document.querySelector(".hardware");

const metadata = {
  about: {
    title: "Обо мне",
    mode: "PROFILE",
    caption: "СОЗДАЮ СИСТЕМЫ ПОД КАПОТОМ.",
    action: "Смотреть проекты",
    href: "#projects",
    actionCaption: "PLAY / PROJECTS",
  },
  projects: {
    title: "Проекты",
    mode: "PROJECT LIBRARY",
    caption: "ОТ ИДЕИ ДО ОТКРЫТОГО КОДА.",
    action: "Открыть репозиторий",
    actionCaption: "OPEN / SOURCE CODE",
  },
  skills: {
    title: "Стек",
    mode: "TOOLBOX",
    caption: "ИНСТРУМЕНТЫ ПОД ЗАДАЧУ.",
    action: "Стек в проектах",
    href: "#projects",
    actionCaption: "PLAY / PROJECTS",
  },
  experience: {
    title: "Опыт",
    mode: "EXPERIENCE LOG",
    caption: "ТЕОРИЯ ПРОВЕРЯЕТСЯ ПРАКТИКОЙ.",
    action: "Обсудить задачу",
    href: "#contact",
    actionCaption: "NEXT / CONNECTION",
  },
  contact: {
    title: "Контакты",
    mode: "CONTACT",
    caption: "КАНАЛ ДЛЯ НОВЫХ ИДЕЙ ОТКРЫТ.",
    action: "Написать в Telegram",
    href: "https://t.me/Joes1ick",
    actionCaption: "OPEN / TELEGRAM",
  },
};

let state = resolveHash(location.hash);
let rendered = null;
let motionEnabled = true;
let screenVisible = true;
let powerState = "off";
const power = createPowerController({
  motionAllowed: () => motionEnabled && !reducedMotion.matches,
  onChange: (next) => {
    powerState = next;
    const ready = next === "on";
    if (
      !ready &&
      (screenUI.contains(document.activeElement) ||
        hardware.contains(document.activeElement))
    )
      powerButton.focus({ preventScroll: true });
    screenUI.inert = !ready;
    screenUI.setAttribute("aria-hidden", String(!ready));
    hardware.inert = !ready;
    player.dataset.power = next;
    powerButton.setAttribute(
      "aria-checked",
      String(next === "on" || next === "booting"),
    );
    powerButton.title =
      next === "on" || next === "booting"
        ? "Выключить приставку"
        : "Включить приставку";
    if (ready) {
      if (motionEnabled && !reducedMotion.matches)
        root.classList.remove("type-complete");
      render(resolveHash(location.hash, state), {
        history: false,
        announce: false,
      });
      announcement.textContent =
        "Приставка включена. " + metadata[state.section].title + ".";
    } else {
      root.classList.add("type-complete");
      announcement.textContent =
        next === "off"
          ? "Приставка выключена. Включите питание переключателем OFF / ON."
          : next === "booting"
            ? "Приставка запускается."
            : "Приставка выключается.";
    }
  },
});

document.getElementById("year").textContent = new Date().getFullYear();
tablist.setAttribute("role", "tablist");
tabs.forEach((tab) => {
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", tab.dataset.section);
});
panels.forEach((panel) => panel.setAttribute("role", "tabpanel"));
document.querySelectorAll(".enhanced-control").forEach((control) => {
  control.hidden = false;
});
projectDetails.forEach((project) =>
  project.querySelector("h3").setAttribute("tabindex", "-1"),
);

function revealFocusedControl(element) {
  if (!element || element === content || !content.contains(element)) return;
  let top = 0;
  let node = element;
  while (node && node !== content) {
    top += node.offsetTop;
    const parent = node.offsetParent;
    if (parent && parent !== content) top += parent.clientTop;
    node = parent;
  }
  if (node !== content) return;
  for (
    let parent = element.parentElement;
    parent && parent !== content;
    parent = parent.parentElement
  )
    top -= parent.scrollTop;
  const bottom = top + element.offsetHeight;
  if (top < content.scrollTop + 8) content.scrollTop = top - 8;
  else if (bottom > content.scrollTop + content.clientHeight - 8)
    content.scrollTop = bottom - content.clientHeight + 8;
}

function render(
  next,
  {
    history = true,
    announce = true,
    focusTab = false,
    focusProject = false,
    focusHeading = false,
  } = {},
) {
  if (powerState !== "on") return;
  const canonicalHash = hashForState(next);
  if (location.hash !== canonicalHash) {
    if (history) window.history.pushState(null, "", canonicalHash);
    else window.history.replaceState(null, "", canonicalHash);
  }
  const unchanged =
    rendered &&
    rendered.section === next.section &&
    rendered.project === next.project;
  if (unchanged) {
    if (focusTab)
      tabs
        .find((tab) => tab.dataset.section === next.section)
        .focus({ preventScroll: true });
    if (focusProject)
      projectButtons
        .find((button) => button.dataset.project === next.project)
        .focus({ preventScroll: true });
    return;
  }

  const previouslyFocused = document.activeElement;
  const focusedPanel = previouslyFocused?.closest(".view");
  const focusedProject = previouslyFocused?.closest("[data-project-detail]");
  const sectionChanged = rendered?.section !== next.section;
  if (rendered?.section === "about" && next.section !== "about")
    root.classList.add("type-complete");
  state = { ...next };
  const index = SECTION_IDS.indexOf(state.section);
  const meta = metadata[state.section];
  const activePanel = panels[index];
  const activeTab = tabs[index];
  const selectedProject = projectDetails.find(
    (project) => project.dataset.projectDetail === state.project,
  );
  const selectedButton = projectButtons.find(
    (button) => button.dataset.project === state.project,
  );

  panels.forEach((panel) => {
    panel.hidden = panel !== activePanel;
    panel.classList.remove("view-enter");
  });
  tabs.forEach((tab) => {
    const selected = tab === activeTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  projectDetails.forEach((project) => {
    project.hidden = project !== selectedProject;
    project.classList.remove("project-enter");
  });
  projectButtons.forEach((button) =>
    button.setAttribute("aria-pressed", String(button === selectedButton)),
  );

  const track = String(index + 1).padStart(2, "0");
  document.getElementById("screen-mode").textContent = meta.mode;
  document.getElementById("screen-track").textContent = `PAGE ${track} / 05`;
  document.getElementById("screen-number").textContent = `${track} / 05`;
  document.getElementById("screen-caption").textContent = meta.caption;
  document
    .querySelectorAll(".screen-position i")
    .forEach((segment, i) => segment.classList.toggle("active", i === index));
  document.getElementById("project-count").textContent =
    `ПРОЕКТ ${String(PROJECT_IDS.indexOf(state.project) + 1).padStart(2, "0")} / 06`;
  document.getElementById("action-label").textContent = meta.action;
  document.getElementById("action-caption").textContent = meta.actionCaption;
  const href =
    state.section === "projects"
      ? selectedProject.querySelector("[data-repository]").getAttribute("href")
      : meta.href;
  action.setAttribute("href", href);
  action.setAttribute("aria-label", `Кнопка A: ${meta.action}`);
  action.title = meta.action;
  if (href.startsWith("https:")) {
    action.setAttribute("target", "_blank");
    action.setAttribute("rel", "noopener noreferrer");
  } else {
    action.removeAttribute("target");
    action.removeAttribute("rel");
  }
  document.title = `${meta.title} — J0es1ick / Pocket Developer`;

  content.scrollTop = 0;
  if (
    state.section === "projects" &&
    selector.scrollWidth > selector.clientWidth
  ) {
    selector.scrollLeft =
      selectedButton.offsetLeft -
      selector.offsetLeft -
      (selector.clientWidth - selectedButton.offsetWidth) / 2;
  }

  if (focusHeading)
    selectedProject.querySelector("h3").focus({ preventScroll: true });
  else if (focusTab || (focusedPanel && focusedPanel !== activePanel))
    activeTab.focus({ preventScroll: true });
  else if (
    focusProject ||
    (focusedProject && focusedProject !== selectedProject)
  )
    selectedButton.focus({ preventScroll: true });
  revealFocusedControl(document.activeElement);

  if (announce) {
    const projectTitle = selectedProject.querySelector("h3").textContent;
    announcement.textContent =
      state.section === "projects"
        ? `Проекты. ${projectTitle}.`
        : `${meta.title}. Раздел ${index + 1} из 5.`;
  }
  if (motionEnabled && !reducedMotion.matches) {
    if (sectionChanged) activePanel.classList.add("view-enter");
    else if (state.section === "projects")
      selectedProject.classList.add("project-enter");
  }
  rendered = { ...state };
}

document.addEventListener("click", (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  if (powerState !== "on") {
    event.preventDefault();
    powerButton.focus({ preventScroll: true });
    return;
  }
  if (link.getAttribute("href") === "#screen-content") {
    event.preventDefault();
    content.focus();
    return;
  }
  const hash = link.getAttribute("href");
  if (![...SECTION_IDS, ...PROJECT_IDS, "top", "main"].includes(hash.slice(1)))
    return;
  event.preventDefault();
  render(resolveHash(hash, state));
});

tablist.addEventListener("keydown", (event) => {
  const tab = event.target.closest("[data-section]");
  if (!tab || event.altKey || event.ctrlKey || event.metaKey) return;
  let next;
  if (event.key === "ArrowRight")
    next = stepSection({ ...state, section: tab.dataset.section }, 1);
  else if (event.key === "ArrowLeft")
    next = stepSection({ ...state, section: tab.dataset.section }, -1);
  else if (event.key === "Home") next = { ...state, section: SECTION_IDS[0] };
  else if (event.key === "End")
    next = { ...state, section: SECTION_IDS.at(-1) };
  else if (event.key === " ") next = { ...state, section: tab.dataset.section };
  else return;
  event.preventDefault();
  render(next, { focusTab: true });
});

projectButtons.forEach((button) =>
  button.addEventListener("click", () => {
    render({ section: "projects", project: button.dataset.project });
  }),
);
selector.addEventListener("keydown", (event) => {
  const button = event.target.closest("[data-project]");
  if (!button || event.altKey || event.ctrlKey || event.metaKey) return;
  let next;
  if (["ArrowDown", "ArrowRight"].includes(event.key))
    next = stepProject({ ...state, project: button.dataset.project }, 1);
  else if (["ArrowUp", "ArrowLeft"].includes(event.key))
    next = stepProject({ ...state, project: button.dataset.project }, -1);
  else if (event.key === "Home")
    next = { section: "projects", project: PROJECT_IDS[0] };
  else if (event.key === "End")
    next = { section: "projects", project: PROJECT_IDS.at(-1) };
  else return;
  event.preventDefault();
  render(next, { focusProject: true });
});

document
  .getElementById("previous-section")
  .addEventListener("click", () => render(stepSection(state, -1)));
document
  .getElementById("next-section")
  .addEventListener("click", () => render(stepSection(state, 1)));
document
  .getElementById("select-section")
  .addEventListener("click", () => render(stepSection(state, 1)));
function scrollDisplay(direction) {
  if (powerState !== "on") return;
  content.scrollBy({
    top: direction * Math.max(100, content.clientHeight * 0.55),
    behavior: motionEnabled && !reducedMotion.matches ? "smooth" : "instant",
  });
}
document
  .getElementById("scroll-up")
  .addEventListener("click", () => scrollDisplay(-1));
document
  .getElementById("scroll-down")
  .addEventListener("click", () => scrollDisplay(1));
document.addEventListener("keydown", (event) => {
  if (powerState !== "on") return;
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  )
    return;
  if (
    event.target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
    )
  )
    return;
  const key = event.key.toLowerCase();
  const physicalKey = {
    arrowleft: "previous-section",
    arrowright: "next-section",
    arrowup: "scroll-up",
    arrowdown: "scroll-down",
    a: "primary-action",
    ф: "primary-action",
    b: "button-b",
    и: "button-b",
  }[key];
  if (physicalKey) flashControl(physicalKey);
  if (key === "arrowleft") render(stepSection(state, -1));
  else if (key === "arrowright") render(stepSection(state, 1));
  else if (key === "arrowup") scrollDisplay(-1);
  else if (key === "arrowdown") scrollDisplay(1);
  else if ((key === "a" || key === "ф") && !event.repeat) action.click();
  else if (key === "b" || key === "и") render(resolveHash("#about", state));
  else return;
  event.preventDefault();
});
document
  .getElementById("previous-project")
  .addEventListener("click", () =>
    render(stepProject(state, -1), { focusHeading: true }),
  );
document
  .getElementById("next-project")
  .addEventListener("click", () =>
    render(stepProject(state, 1), { focusHeading: true }),
  );
const restoreHistory = () =>
  render(resolveHash(location.hash, state), { history: false });
window.addEventListener("popstate", restoreHistory);
window.addEventListener("hashchange", restoreHistory);

const pressTimers = new Map();
function flashControl(id) {
  const control =
    document.getElementById(id) || document.querySelector(`.${id}`);
  if (!control) return;
  clearTimeout(pressTimers.get(control));
  control.classList.add("is-pressed");
  pressTimers.set(
    control,
    setTimeout(() => {
      control.classList.remove("is-pressed");
      pressTimers.delete(control);
    }, 150),
  );
}
powerButton.addEventListener("click", () => power.toggle());
player.addEventListener(
  "click",
  (event) => {
    if (powerState !== "on" && event.target.closest(".screen-ui, .hardware")) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);

function prepareTypewriter() {
  const target = document.querySelector("[data-typewriter]");
  const original = target.cloneNode(true);
  original
    .querySelectorAll('[aria-hidden="true"]')
    .forEach((node) => node.remove());
  const accessible = document.createElement("span");
  accessible.className = "sr-only";
  accessible.textContent = original.textContent.trim();
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  [...accessible.textContent].forEach((character, index) => {
    const letter = document.createElement("span");
    letter.className = "type-char";
    letter.textContent = character;
    letter.style.setProperty("--type-delay", `${180 + index * 70}ms`);
    visual.append(letter);
  });
  visual.append(target.querySelector(".cursor").cloneNode(true));
  target.replaceChildren(accessible, visual);
}

function syncMotion() {
  const enabled = motionEnabled && !reducedMotion.matches;
  root.classList.toggle("motion-on", enabled);
  root.classList.toggle("motion-off", !enabled);
  root.classList.toggle("motion-idle", document.hidden || !screenVisible);
  if (!enabled) root.classList.add("type-complete");
  motionButton.setAttribute("aria-pressed", String(enabled));
  motionButton.disabled = reducedMotion.matches;
  motionButton.title = reducedMotion.matches
    ? "Уменьшение движения включено в системе"
    : "Включить или выключить анимацию экрана";
  document.getElementById("motion-label").textContent = enabled
    ? "FX ON"
    : "FX OFF";
  power.syncMotion();
}
motionButton.addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  syncMotion();
});
reducedMotion.addEventListener("change", syncMotion);
document.addEventListener("visibilitychange", syncMotion);
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(([entry]) => {
    screenVisible = entry.isIntersecting;
    syncMotion();
  });
  observer.observe(document.getElementById("screen"));
}

prepareTypewriter();
syncMotion();
root.classList.add("js");
power.setPowered(true);
