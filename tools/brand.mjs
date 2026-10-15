// Brand images (LinkedIn logo, wordmarks, link-preview card), rendered with Chrome from the
// original logo SVG and the live site so they match it exactly.
// usage: node tools/brand.mjs <siteUrl> <outDir> <ogImagePath>
// Uses the system Google Chrome via playwright-core (set PW_CORE to point at an existing install).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");

const [siteUrl, outDir, ogPath] = process.argv.slice(2);
const here = path.dirname(new URL(import.meta.url).pathname);
const svg = fs.readFileSync(path.join(here, "../docs/assets/deepsilicon-logo.svg"), "utf8");
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

// Square mark, centered at 60% of the canvas height. No bg = transparent.
async function mark(file, size, bg) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const sized = svg.replace("<svg ", `<svg style="height:${size * 0.6}px;width:auto" `);
  await page.setContent(
    `<body style="margin:0;height:${size}px;display:grid;place-items:center;background:${bg || "transparent"}">${sized}</body>`
  );
  await page.screenshot({ path: path.join(outDir, file), omitBackground: !bg });
  await page.close();
}

// Icon + "deepsilicon", cut from the live site header at 4x so the type is the real Work Sans.
async function wordmark(file, bg, textColor) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 });
  await page.goto(siteUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator(".header > .logo");
  await logo.evaluate((el, [bg, color]) => {
    el.style.padding = "14px 22px";
    el.style.background = bg;
    el.parentElement.style.background = bg; // no dark header slivers at fractional element edges
    el.querySelector("span").style.color = color;
  }, [bg, textColor]);
  await logo.screenshot({ path: path.join(outDir, file) });
  await page.close();
}

await mark("deepsilicon-logo-400.png", 400, "#FFFFFF");
await mark("deepsilicon-logo-400-dark.png", 400, "#141819");
await mark("deepsilicon-logo-1024-transparent.png", 1024);
await wordmark("deepsilicon-wordmark-light.png", "#FFFFFF", "#141819");
await wordmark("deepsilicon-wordmark-dark.png", "#141819", "#FFFFFF");

// Link-preview card (og:image): the top of the landing page at LinkedIn's 1200x627.
const page = await browser.newPage({ viewport: { width: 1200, height: 627 } });
await page.goto(siteUrl, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500); // hero title fades in
await page.screenshot({ path: ogPath });
await browser.close();
console.log("done");
