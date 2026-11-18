import { test, expect } from "@playwright/test"
import { collect, problems } from "./helpers/collect"

// Blocs shared les plus risqués (média/embeds/répéteurs riches) → captures ciblées (preuves).
const RISKY = ["free_section", "overlay_card", "image_text", "stack_cards", "free_grid", "image_mosaic", "big_statement", "compare_two", "steps_horizontal", "timeline", "pricing", "video_local", "audio_player", "spotify_embed", "video", "google_maps_embed", "album_block", "discography", "product_catalog", "image", "before_after"]

test("tous les blocs shared rendent sans erreur console/hydratation (harness)", async ({ page }, testInfo) => {
  const c = collect(page)
  const resp = await page.goto("/e2e-harness/blocks", { waitUntil: "domcontentloaded" })
  expect(resp?.status(), "statut HTTP harness").toBeLessThan(400)
  await expect(page.locator("[data-harness-end]")).toBeVisible({ timeout: 45_000 })

  // Le compte attendu est celui que le banc ANNONCE (SHARED_RENDERER_BLOCKS),
  // pas un chiffre figé : écrit 87 en août, il valait 146 en novembre — les
  // migrations vers le moteur commun l'ont fait grandir, et le test échouait
  // sur un succès. Ce qu'il garde : chaque bloc annoncé est rendu, aucun
  // n'est sans adaptateur, aucune erreur de console.
  const annonce = Number((await page.locator("[data-harness-ready]").textContent())?.match(/\d+/)?.[0])
  expect(annonce, "le banc annonce son nombre de blocs").toBeGreaterThan(100)
  const count = await page.locator("[data-block]").count()
  expect(count, "nombre de blocs rendus").toBe(annonce)
  expect(await page.getByText("NO ADAPTER").count(), "adapters manquants").toBe(0)

  await page.waitForLoadState("networkidle").catch(() => {})

  // Captures ciblées desktop+mobile (selon le projet) — preuves, PAS un gate pixel (fonts/iframes
  // tierces non déterministes ⇒ pas de toHaveScreenshot ici).
  for (const t of RISKY) {
    const el = page.locator(`[data-block="${t}"]`)
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded()
      await testInfo.attach(`block-${t}`, { body: await el.screenshot(), contentType: "image/png" })
    }
  }

  expect(problems(c), "erreurs navigateur (même origine):\n" + problems(c).join("\n")).toEqual([])
})
