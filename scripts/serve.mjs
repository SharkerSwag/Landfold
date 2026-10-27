import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../docs/", import.meta.url));
const base = "/Landfold/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/" || url.pathname === "/Landfold") {
    response.writeHead(302, { Location: base + url.search + url.hash }).end();
    return;
  }
  if (!url.pathname.startsWith(base)) {
    response.writeHead(404).end("Not found");
    return;
  }
  let pathname;
  try {
    pathname =
      decodeURIComponent(url.pathname.slice(base.length)) || "index.html";
  } catch {
    response.writeHead(400).end("Invalid path");
    return;
  }
  const target = path.resolve(root, pathname);
  if (!target.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(target);
    response.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
server.listen(Number(process.env.PORT || 4180), "127.0.0.1", () =>
  console.log("Landfold: http://127.0.0.1:" + server.address().port + base),
);
