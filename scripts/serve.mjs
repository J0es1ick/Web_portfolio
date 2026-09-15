import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicFiles = new Set([
  "index.html",
  "styles.css",
  "console.css",
  "script.js",
  "player-state.js",
  "power-state.js",
]);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    if (
      !publicFiles.has(relative) &&
      !/^assets\/[a-zA-Z0-9_.-]+$/.test(relative)
    ) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const contents = await readFile(path.join(root, relative));
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(relative)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : contents);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(4173, "127.0.0.1", () =>
  console.log("Local: http://127.0.0.1:4173"),
);
