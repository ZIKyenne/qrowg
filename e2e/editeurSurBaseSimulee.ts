import { expect, type Page } from "@playwright/test"
import { baseSimulee, type Tables } from "./baseSimulee"

// Le décor commun des tests de l'éditeur joués contre la base simulée (v390-391) :
// une page existante de deux blocs, et l'éditeur ouvert dessus, guide passé.

export const PAGE = "11111111-1111-4111-8111-111111111111"
const bloc = (n: number, type: string, content: Record<string, unknown>) => ({
  id: `22222222-2222-4222-8222-00000000000${n}`, page_id: PAGE, type, position: n,
  content: { ...content, __draft: false, __locked: false, __visible: true }, is_visible: true, styles: {},
  updated_at: "2026-10-01T00:00:00.000Z",
})
export const depart = (): Tables => ({
  pages: [{ id: PAGE, user_id: "00000000-0000-4000-8000-000000000001", title: "Le Comptoir", slug: "le-comptoir", status: "draft", theme: null, total_views: 0 }],
  blocks: [
    bloc(0, "profile", { name: "Le Comptoir", tagline: "Cuisine de saison" }),
    bloc(1, "rich_text", { text: "Premier paragraphe" }),
  ],
  qr_codes: [{ id: "q1", page_id: PAGE, short_code: "abc123", total_scans: 0 }],
  block_clicks: [],
})

export type Base = Awaited<ReturnType<typeof baseSimulee>>

/** `avant` : routes à poser APRÈS le banc (Playwright essaie la dernière route d'abord). */
export async function ouvrir(page: Page, avant?: () => Promise<unknown>) {
  const base = await baseSimulee(page, depart())
  await avant?.()
  // Le délai de sauvegarde (800 ms, DELAI_SAUVEGARDE_MS) peut être RETENU : tant que
  // `__retenirLeDelai` est vrai, un minuteur de 800 ms est noté mais jamais lancé.
  // (Figer toute l'horloge — page.clock — empêche l'éditeur de démarrer en développement.)
  await page.addInitScript(() => {
    const w = window as unknown as { __retenirLeDelai?: boolean; setTimeout: typeof setTimeout }
    const original = w.setTimeout.bind(window)
    w.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) =>
      w.__retenirLeDelai && ms === 800 ? (0 as unknown as ReturnType<typeof setTimeout>) : original(fn, ms, ...args)) as typeof setTimeout
  })
  await page.goto(`/dashboard/builder/${PAGE}`, { waitUntil: "domcontentloaded" })
  const nom = page.getByLabel("Nom de la page").first()
  await expect(nom, "la page existante est chargée, pas la démonstration").toHaveValue("Le Comptoir", { timeout: 30_000 })
  // Deux blocs : l'éditeur accueille avec son guide ; on le passe pour atteindre la coquille.
  const guide = page.getByRole("dialog", { name: "Bienvenue dans votre éditeur" })
  await guide.getByRole("button", { name: "Passer" }).click({ timeout: 5_000 }).catch(() => {})
  await expect(guide).toHaveCount(0)
  return { base, nom }
}

/** Le délai de 0,8 s ne pourra plus écrire : seul un autre chemin (départ, publication) le peut. */
export const retenirLeDelai = (page: Page) =>
  page.evaluate(() => { (window as unknown as { __retenirLeDelai: boolean }).__retenirLeDelai = true })

export const titreEnBase = (base: Base) => () => base.tables().pages[0].title as string
