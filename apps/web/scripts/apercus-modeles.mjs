import { chromium, devices } from "@playwright/test"
import fs from "node:fs"
const CLES = JSON.parse(process.argv[2])
const DEST = "apps/web/public/apercus"
fs.mkdirSync(DEST, { recursive: true })
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" })
const ctx = await b.newContext({ viewport: { width: 390, height: 700 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: "reduce" })
const page = await ctx.newPage()
let tot = 0
for (const href of CLES) {
  const cle = href.split("/").pop()
  const r = await page.goto("http://localhost:3230" + href, { waitUntil: "networkidle", timeout: 45000 }).catch(()=>null)
  if (!r || r.status() !== 200) { console.log("  KO", cle, r?.status()); continue }
  // Le bandeau de demonstration (« Page de demonstration », « Utiliser ce
  // modele ») appartient a la vitrine, pas au modele. Un apercu doit montrer la
  // page, pas le cadre qui l'entoure.
  await page.evaluate(() => { document.querySelector(".demo-bandeau")?.remove() })
  await page.waitForTimeout(900)
  const f = `${DEST}/${cle}.jpg`
  await page.screenshot({ path: f, type: "jpeg", quality: 74, clip: { x: 0, y: 0, width: 390, height: 264 } })
  const ko = Math.round(fs.statSync(f).size / 1024)
  tot += ko
  console.log(`  ${cle.padEnd(22)} ${ko} Ko`)
}
console.log(`\n${CLES.length} aperçus, ${tot} Ko au total`)
await b.close()
