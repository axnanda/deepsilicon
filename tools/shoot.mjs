// Full-page screenshots of a site at several viewports, for side-by-side fidelity checks.
// usage: node tools/shoot.mjs <baseUrl> <outDir> [path ...]
// Uses the system Google Chrome via playwright-core (set PW_CORE to point at an existing install).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const PW_CORE = process.env.PW_CORE || "playwright-core";
const { chromium } = require(PW_CORE);

const [baseUrl, outDir, ...paths] = process.argv.slice(2);
const routes = paths.length ? paths : ["/"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
];

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("requestfailed", (r) => errors.push(`requestfailed ${r.url()}`));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  for (const route of routes) {
    await page.goto(baseUrl + route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500); // let fade-in animations finish
    const slug = route === "/" ? "home" : route.replace(/\W+/g, "_").replace(/^_|_$/g, "");
    const file = path.join(outDir, `${slug}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const dims = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      title: document.title,
    }));
    report.push({ route, viewport: vp.name, file, ...dims, errors: [...errors] });
    errors.length = 0;
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
