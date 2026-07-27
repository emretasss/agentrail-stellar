import { cp, mkdir, writeFile } from "node:fs/promises";

await mkdir("dist/server", { recursive: true });
await mkdir("dist/public", { recursive: true });

await cp("dist/assets", "dist/public/assets", { recursive: true });
await cp("dist/index.html", "dist/public/index.html");
await cp("public/agentrail-mark.svg", "dist/public/agentrail-mark.svg");

await writeFile(
  "dist/server/index.js",
  `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") return response;
    const accept = request.headers.get("accept") || "";
    if (!accept.includes("text/html")) return response;
    return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
  },
};
`,
);
