import { test, expect } from "@playwright/test"

// Le parcours complet d'une proposition, contre la VRAIE base.
//
// Les tests unitaires prouvent que le générateur n'invente rien. Le banc de
// rendu prouve que la page s'affiche. Ni l'un ni l'autre ne prouve que
// l'ensemble tient : créer, stocker, servir derrière un jeton, refuser, et
// rendre la page récupérable.
//
// Ce fichier le fait de bout en bout. Il écrit dans `qrowg-dev` — jamais en
// production : la route de création est gatée 404 hors développement, et les
// trois prospects sont fictifs, sur des domaines `.test` non enregistrables.
//
// ── Ce qu'il vérifie, et pourquoi chaque point ────────────────────────────
//
// Les trois cas de REFUS comptent autant que le cas qui marche. Une URL privée
// qui ne refuse pas correctement n'est pas privée.

type Cree = { jeton: string; url: string; modele: string; faitsUtilises: string[]; aCompleter: string[] }

async function creerApercu(request: import("@playwright/test").APIRequestContext, prospect: string): Promise<Cree> {
  const rep = await request.get(`/e2e-harness/growth-creer-apercu?prospect=${prospect}&json=1`)
  expect(rep.status(), `création de l'aperçu « ${prospect} »`).toBe(200)
  return rep.json() as Promise<Cree>
}

test.describe("une proposition, de sa création à sa reprise", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 })

  test("créer, stocker, servir : l'aperçu s'ouvre et dit ce qu'il est", async ({ page, request }) => {
    const cree = await creerApercu(request, "bistrot")

    // Le jeton a la forme attendue : 43 caractères sans rien de gênant en URL.
    expect(cree.jeton).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(cree.url).toBe(`/apercu/${cree.jeton}`)
    expect(cree.modele, "le modèle vient de la bibliothèque QRowg").toBe("resto_bistrot")

    await page.setViewportSize({ width: 390, height: 844 })
    const rep = await page.goto(cree.url, { waitUntil: "domcontentloaded" })
    expect(rep?.status()).toBe(200)

    // La page est la vraie, et elle porte le nom de l'établissement.
    await expect(page.getByTestId("apercu-propose")).toBeVisible()
    await expect(page.getByText("Chez Mariette", { exact: false }).first()).toBeVisible()

    // Le bandeau, sans défiler.
    const bandeau = page.getByTestId("bandeau-non-officiel")
    await expect(bandeau).toContainText("Proposition non officielle")
    await expect(bandeau).toContainText("n'a pas approuvé cette page")
    expect((await bandeau.boundingBox())!.y, "le bandeau doit se voir d'emblée").toBeLessThan(80)

    // Les trous sont annoncés, pas comblés : la carte du bistrot a un plat
    // sans prix relevé.
    expect(cree.aCompleter.join(" ")).toContain("prix")
    await expect(bandeau).toContainText("À compléter")

    // Et aucune valeur de démonstration du modèle n'est à l'écran.
    const texte = await page.locator("body").innerText()
    for (const demo of ["Le Bistrot Parisien", "Entrecôte 300g", "Foie gras poêlé", "🌟 Recommandé"]) {
      expect(texte, `« ${demo} » vient du modèle de démonstration`).not.toContain(demo)
    }
  })

  test("elle est hors de portée des moteurs", async ({ page, request }) => {
    const cree = await creerApercu(request, "bistrot")
    await page.goto(cree.url, { waitUntil: "domcontentloaded" })
    // `noindex` ET `nofollow` : ni la page, ni ce qu'elle cite.
    const robots = await page.locator('meta[name="robots"]').getAttribute("content")
    expect(robots, "la balise robots doit exister").toBeTruthy()
    expect(robots!.toLowerCase()).toContain("noindex")
    expect(robots!.toLowerCase()).toContain("nofollow")
  })

  test("les trois refus donnent la même réponse", async ({ page, request }) => {
    const cree = await creerApercu(request, "bistrot")

    // 1. Jeton mal formé — écarté avant toute requête SQL.
    const malForme = await page.goto("/apercu/pas-un-jeton", { waitUntil: "domcontentloaded" })
    // 2. Jeton bien formé mais inventé — il faut interroger la base pour le
    //    savoir, et elle ne le trouve pas.
    const invente = await page.goto(`/apercu/${"A".repeat(43)}`, { waitUntil: "domcontentloaded" })
    // 3. Un vrai jeton, mais dont on retire un caractère : voisin, et refusé.
    const voisin = await page.goto(`/apercu/${cree.jeton.slice(0, 42)}z`, { waitUntil: "domcontentloaded" })

    for (const [nom, rep] of [["mal formé", malForme], ["inventé", invente], ["voisin", voisin]] as const) {
      expect(rep?.status(), `jeton ${nom} : doit être refusé`).toBe(404)
    }
    // La MÊME réponse pour les trois : distinguer « expiré » de « inexistant »
    // apprendrait à un balayeur quels jetons sont valides.
    expect(new Set([malForme?.status(), invente?.status(), voisin?.status()]).size,
      "les trois refus doivent être indiscernables").toBe(1)
  })

  test("« je le personnalise » ouvre l'éditeur avec la page", async ({ page, request }) => {
    const cree = await creerApercu(request, "bistrot")
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(cree.url, { waitUntil: "domcontentloaded" })

    const bouton = page.getByTestId("reprendre-le-modele")
    await expect(bouton).toBeVisible()

    // Le clic se réessaie : en `next dev`, le HTML arrive avant React, et un
    // bouton visible n'a pas encore son gestionnaire.
    await expect(async () => {
      await bouton.click()
      await expect(page).toHaveURL(/\/dashboard\/builder\?draft=1/, { timeout: 2000 })
    }).toPass({ timeout: 30_000 })

    // Le brouillon a bien été écrit, au format que l'éditeur sait relire.
    const brouillon = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem("qrowg_draft_v1") ?? "null") } catch { return null }
    })
    expect(brouillon, "le brouillon doit exister").not.toBeNull()
    expect(brouillon.pageName).toBe("Chez Mariette")
    expect(brouillon.templateKey).toBe("resto_bistrot")
    expect(Array.isArray(brouillon.blocks) && brouillon.blocks.length).toBeGreaterThan(3)
  })

  test("un établissement pauvre reste honnête", async ({ page, request }) => {
    // Le Comptoir Express n'a ni horaires, ni carte, ni réservation relevés.
    const cree = await creerApercu(request, "rapide")
    expect(cree.aCompleter.length, "les manques doivent être annoncés").toBeGreaterThan(0)

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(cree.url, { waitUntil: "domcontentloaded" })
    const texte = await page.locator("body").innerText()
    expect(texte).toContain("Le Comptoir Express")
    // L'adresse est LISIBLE, pas seulement dans une carte qui peut être bloquée.
    expect(texte).toContain("Reims")
    await expect(page.getByTestId("bandeau-non-officiel")).toContainText("À compléter")
  })
})
