// 本機預覽：用和 Apps Script 一樣的方式組合頁面（展開 include），後端換成 dev/mock.js。
//   node apps-script/study/dev/server.mjs
//   首頁     http://localhost:8100/
//   受試者頁 http://localhost:8100/participant?p=P01
//   施測者頁 http://localhost:8100/staff
// 要用 localhost（不要用 127.0.0.1），YouTube 才不會擋音樂影片。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "..");
const PORT = Number(process.env.PORT) || 8100;

function render(name) {
  let html = fs.readFileSync(path.join(appDir, name + ".html"), "utf8");
  html = html.replace(/<\?!=\s*include\('([\w-]+)'\);?\s*\?>/g, (_, f) => fs.readFileSync(path.join(appDir, f + ".html"), "utf8"));
  html = html.replace(/<\?=\s*baseUrl\s*\?>/g, "");   // 本機沒有部署網址，首頁會改用 /participant 和 /staff
  return html.replace("<head>", '<head>\n<script src="/dev/mock.js"></script>');
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname === "/participant" || url.pathname === "/staff") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(render(url.pathname.slice(1)));
    }
    if (url.pathname === "/dev/mock.js") {
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(fs.readFileSync(path.join(here, "mock.js")));
    }
    if (url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(render("home"));
    }
    res.writeHead(404); res.end("not found");
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }); res.end(String(e.stack || e));
  }
}).listen(PORT, () => console.log("http://localhost:" + PORT));
