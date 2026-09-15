import { mkdir, copyFile, cp, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
await mkdir(output, { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "console.css",
  "script.js",
  "player-state.js",
  "power-state.js",
]) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await cp(path.join(root, "assets"), path.join(output, "assets"), {
  recursive: true,
});
const html = await readFile(path.join(output, "index.html"), "utf8");
if (!html.includes("J0es1ick") || !html.includes('id="projects"'))
  throw new Error("Incomplete portfolio output");
console.log("Static portfolio built in dist/");
