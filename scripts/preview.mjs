import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const port = 43_118;
const extensionRoot = fileURLToPath(new URL("../extension/", import.meta.url));

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
]);

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl || "/", `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/popup.html" : url.pathname);
  const relativePath = normalize(pathname).replace(/^[/\\]+/, "");
  const filePath = join(extensionRoot, relativePath);
  const rootPrefix = extensionRoot.endsWith(sep) ? extensionRoot : `${extensionRoot}${sep}`;

  return filePath.startsWith(rootPrefix) ? filePath : null;
}

const server = createServer(async (request, response) => {
  const filePath = resolveRequestPath(request.url);

  try {
    if (!filePath || !(await stat(filePath)).isFile()) {
      throw new Error("Not found");
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentTypes.get(extname(filePath)) || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`TabScholar preview: http://${host}:${port}`);
});

function shutDown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
