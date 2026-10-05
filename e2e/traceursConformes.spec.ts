import { test, expect, type Page } from "@playwright/test"

// ═══════════════════════════════════════════════════════════════════════════════
// Q14 — CE QUE LA POLITIQUE PROMET, ET CE QUE LE NAVIGATEUR FAIT.
//
// L'audit demandait d'« inventorier les données émises sur les pages publiques,
// l'éditeur et les pages publiées », et de vérifier que « la politique correspond
// au comportement réseau et au stockage observés dans un environnement de test ».
//
// La politique publiée dit, textuellement :
//   · « ni cookies publicitaires ni cookies analytiques tiers » ;
//   · « un identifiant de session temporaire (stocké en sessionStorage), effacé
//     à la fermeture de l'onglet » ;
//   · « Vercel Analytics, sans cookie ».
//
// Ce fichier mesure ces trois affirmations dans un vrai navigateur : les requêtes
// qui partent, les domaines contactés, et ce qui est écrit dans le stockage.
// ═══════════════════════════════════════════════════════════════════════════════

/** Les domaines que la politique déclare. Tout le reste est un tiers non annoncé. */
const DOMAINES_ANNONCES = [
  "localhost", "qrowg.com", "vercel.app",
  "vercel-scripts.com",   // Vercel Analytics, déclaré dans les sous-traitants
  "supabase.co",          // base de données et authentification
  "stripe.com", "js.stripe.com",
  "fonts.googleapis.com", "fonts.gstatic.com",
]

function estAnnonce(url: string): boolean {
  try {
    const h = new URL(url).hostname
    return DOMAINES_ANNONCES.some(d => h === d || h.endsWith(`.${d}`))
  } catch { return true }
}

async function observer(page: Page, chemin: string) {
  const tiers = new Set<string>()
  page.on("request", r => {
    const u = r.url()
    if (u.startsWith("data:") || u.startsWith("blob:")) return
    if (!estAnnonce(u)) tiers.add(new URL(u).hostname)
  })
  await page.goto(chemin, { waitUntil: "networkidle" })
  return tiers
}

test.describe("Q14 — les pages publiques n'appellent que ce qui est déclaré", () => {
  for (const chemin of ["/", "/creer", "/generateur-qr-code", "/privacy"]) {
    test(`${chemin} ne contacte aucun domaine non annoncé`, async ({ page }) => {
      const tiers = await observer(page, chemin)
      expect([...tiers], `domaines non déclarés dans /privacy : ${[...tiers].join(", ")}`).toEqual([])
    })
  }
})

test.describe("Q14 — aucun cookie de suivi", () => {
  test("la visite d'une page publique ne pose aucun cookie de mesure", async ({ page, context }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    const cookies = await context.cookies()
    // La politique autorise les cookies « essentiels au fonctionnement
    // (authentification, session) ». Un visiteur non connecté n'en a aucun besoin.
    const suivi = cookies.filter(c => /_ga|_gid|_fbp|_fbc|amplitude|mixpanel|hotjar|matomo|_pk_/i.test(c.name))
    expect(suivi.map(c => c.name), "un cookie de suivi a été posé").toEqual([])
  })

  test("Vercel Analytics est bien sans cookie", async ({ page, context }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    const noms = (await context.cookies()).map(c => c.name)
    expect(noms.filter(n => /^va-|vercel.*analytic/i.test(n)), "Vercel Analytics a posé un cookie").toEqual([])
  })
})

test.describe("Q14 — le stockage correspond à ce qui est annoncé", () => {
  test("l'identifiant de session vit bien en sessionStorage, pas en localStorage", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    const stockage = await page.evaluate(() => {
      const lire = (s: Storage) => { try { return Object.keys(s) } catch { return [] } }
      return { local: lire(localStorage), session: lire(sessionStorage) }
    })
    // La politique : « un identifiant de session temporaire (stocké en
    // sessionStorage), effacé à la fermeture de l'onglet ».
    const sessionEnLocal = stockage.local.filter(k => /session/i.test(k))
    expect(sessionEnLocal, "un identifiant de session survit à la fermeture de l'onglet").toEqual([])
  })

  test("rien de personnel n'est écrit dans le navigateur d'un visiteur", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    const valeurs = await page.evaluate(() => {
      const tout: string[] = []
      for (const s of [localStorage, sessionStorage]) {
        try { for (const k of Object.keys(s)) tout.push(`${k}=${s.getItem(k) ?? ""}`) } catch { /* bloqué */ }
      }
      return tout
    })
    const suspect = valeurs.filter(v => /@[a-z0-9.-]+\.[a-z]{2,}/i.test(v))
    expect(suspect, "une adresse e-mail traîne dans le stockage du navigateur").toEqual([])
  })
})
