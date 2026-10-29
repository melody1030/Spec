// 從 vocab-study-prototype.html 的 DATA 取出卡片內容，產生 Apps Script 用的 cards.html。
// 改了 prototype 裡的卡片（句子、字義、片段時間）之後，在 repo 根目錄執行：
//   node apps-script/study/dev/build-cards.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const src = fs.readFileSync(path.join(root, "vocab-study-prototype.html"), "utf8");

// 找到 const DATA = { … } 的範圍（略過字串和註解裡的大括號）
function grabData(s) {
  const i = s.indexOf("const DATA");
  const j = s.indexOf("{", i);
  let depth = 0, quote = null;
  for (let k = j; k < s.length; k++) {
    const c = s[k];
    if (quote) { if (c === "\\") { k++; continue; } if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "/" && s[k + 1] === "/") { k = s.indexOf("\n", k); continue; }
    if (c === "/" && s[k + 1] === "*") { k = s.indexOf("*/", k) + 1; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return (0, eval)("(" + s.slice(j, k + 1) + ")");
  }
  throw new Error("找不到 DATA");
}

const DATA = grabData(src);
const keep = ["id", "category", "clip", "targetWord", "pos", "cefr", "definitionEn", "definitionZh",
              "example", "exampleForm", "exampleZh", "sentence", "sentenceForm"];
const cards = DATA.cards.map(c => {
  const o = {};
  keep.forEach(k => { if (c[k] !== undefined && c[k] !== "") o[k] = c[k]; });
  o.source = { title: c.source.title, url: c.source.url, start: c.source.start, end: c.source.end };
  return o;
});

const out =
  "<!-- 由 dev/build-cards.mjs 從 vocab-study-prototype.html 產生，不要手動修改 -->\n<script>\n" +
  "const CATEGORIES = " + JSON.stringify(DATA.categories) + ";\n" +
  "const CARDS = [\n" + cards.map(c => "  " + JSON.stringify(c)).join(",\n") + "\n];\n</script>\n";
fs.writeFileSync(path.join(here, "..", "cards.html"), out);
console.log("cards.html：" + cards.length + " 張卡片");
