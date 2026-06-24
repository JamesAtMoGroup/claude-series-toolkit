// claude-series premortem 靜止圖 renderer — bundle 一次 render 全部幀
// 用法: node claude-series-qa-stills.mjs <projectRoot> <compId> <outDir> <framesFile.tsv>
//   framesFile 每行: "<frame>\t<label>"
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import path from "path";
import fs from "fs";

const [, , projectRoot, compId, outDir, framesFile] = process.argv;
if (!projectRoot || !compId || !outDir || !framesFile) {
  console.error("Usage: node claude-series-qa-stills.mjs <projectRoot> <compId> <outDir> <framesFile.tsv>");
  process.exit(1);
}

const entry = path.join(projectRoot, "src/index.ts");
const lines = fs.readFileSync(framesFile, "utf8").trim().split("\n").filter(Boolean);
fs.mkdirSync(outDir, { recursive: true });

console.log(`Bundling ${entry} ...`);
const serveUrl = await bundle({ entryPoint: entry });
console.log(`Selecting composition ${compId} ...`);
const composition = await selectComposition({ serveUrl, id: compId });

for (const line of lines) {
  const [frStr, label = ""] = line.split("\t");
  const fr = parseInt(frStr, 10);
  if (Number.isNaN(fr)) continue;
  const safe = label.replace(/[^\w一-鿿-]/g, "");
  const out = path.join(outDir, `f${String(fr).padStart(6, "0")}_${safe}.png`);
  await renderStill({ composition, serveUrl, output: out, frame: fr, scale: 0.6 });
  console.log(`  ✓ frame ${fr}  ${label}`);
}
console.log("DONE_QA_STILLS");
