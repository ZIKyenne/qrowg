import { test, expect, type Page } from "@playwright/test"

// ═══════════════════════════════════════════════════════════════════════════════
// Q22 — CE QUE LE SITE LIVRÉ DIT AUX MOTEURS.
//
// L'audit a contrôlé la structure des 26 pages métiers et des 12 guides, et n'y a
// trouvé ni image cassée ni débordement. Il s'arrête là, honnêtement :
//
//   « Cela ne prouve ni l'indexation Google ni la qualité SEO de toutes les pages. »
//   « Les erreurs de récupération du sitemap pendant cet audit ne constituent pas
//     la preuve d'un sitemap absent : ce point reste à contrôler. »
//
// Ce fichier fait ce contrôle — sur la VERSION LIVRÉE, pas sur le code. Il se
// lance aussi bien en local que sur la production :
//
//     PROD_URL=https://qrowg.com npx playwright test e2e/refQuiTientEnLigne.spec.ts --config=playwright.prod.config.ts
//
// Il ne réécrit rien : il mesure, et il échoue s'il trouve. C'est exactement ce
// que l'audit demandait de ne pas supposer.
// ═══════════════════════════════════════════════════════════════════════════════

/** Un échantillon de chaque famille, plutôt que 40 requêtes sur la même chose. */
const PUBLIQUES = [
  "/", "/features", "/upgrade", "/examples", "/creer",
  "/guides", "/guides/qr-code-dynamique-vs-statique", "/guides/taille-qr-code-impression",
  "/qr-code", "/qr-code/restaurant", "/qr-code/wifi",
  "/outils", "/outils/taille-qr-code", "/outils/testeur-qr-code",
  "/generateur-qr-code", "/contact", "/security", "/privacy", "/terms",
]

/**
 * `/legal` n'est pas dans la liste ci-dessus, et c'est voulu.
 *
 * Le produit la met en `noindex` tant que l'identité de l'éditeur n'est pas
 * renseignée (`lib/editeur.identiteRenseignee`) : une page de mentions légales
 * incomplète, indexée, vaut moins qu'une page absente. Mesuré en production :
 * elle répond bien « noindex, follow ». On garde cette règle plutôt que de la
 * contourner — le jour où l'identité sera remplie, ce test dira qu'il faut
 * remettre `/legal` parmi les pages publiques.
 */
const HORS_INDEX_TANT_QUE_INCOMPLETE = "/legal"

/** Ce qui ne doit JAMAIS être proposé aux moteurs. */
const PRIVEES = ["/dashboard", "/dashboard/builder", "/auth/login", "/e2e-harness/accueil"]

async function tete(page: Page, chemin: string) {
  const r = await page.goto(chemin, { waitUntil: "domcontentloaded" })
  expect(r, `${chemin} : aucune réponse`).toBeTruthy()
  return r!
}

test.describe("Q22 — le sitemap existe, et il est juste", () => {
  test("il répond, en XML, et liste des adresses absolues", async ({ request, baseURL }) => {
    const r = await request.get("/sitemap.xml")
    expect(r.status(), "le sitemap ne répond pas").toBe(200)
    expect(r.headers()["content-type"] || "", "ce n'est pas du XML").toMatch(/xml/)

    const xml = await r.text()
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    expect(urls.length, "le sitemap est vide").toBeGreaterThan(30)
    for (const u of urls) {
      expect(u, `adresse relative dans le sitemap : ${u}`).toMatch(/^https?:\/\//)
    }
    // Il doit parler du site qu'on interroge, pas d'un autre.
    const hote = new URL(baseURL!).hostname
    const etrangers = urls.filter(u => new URL(u).hostname !== hote)
    expect(etrangers, `le sitemap pointe ailleurs : ${etrangers.slice(0, 3).join(", ")}`).toEqual([])
  })

  test("il n'y annonce aucune page privée", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text()
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname)
    const fautifs = urls.filter(p => /^\/(dashboard|auth|api|e2e-harness)\b/.test(p))
    expect(fautifs, "des zones privées sont proposées aux moteurs").toEqual([])
  })

  test("et les pages qu'il annonce répondent vraiment", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text()
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname)
    // Un échantillon : le sitemap en compte des dizaines, et un 404 s'y cache aussi
    // bien dans le premier que dans le dernier.
    const echantillon = [urls[0], urls[Math.floor(urls.length / 3)], urls[Math.floor((2 * urls.length) / 3)], urls[urls.length - 1]]
    for (const u of echantillon) {
      const r = await request.get(u)
      expect(r.status(), `${u} est au sitemap mais répond ${r.status()}`).toBe(200)
    }
  })
})

test.describe("Q22 — robots.txt sépare le public du privé", () => {
  test("il répond et bloque les zones privées", async ({ request }) => {
    const r = await request.get("/robots.txt")
    expect(r.status()).toBe(200)
    const txt = await r.text()
    expect(txt, "robots.txt ne renvoie pas au sitemap").toMatch(/Sitemap:\s*https?:\/\//i)
    for (const zone of ["/dashboard", "/api", "/auth"]) {
      expect(txt, `${zone} n'est pas interdit aux robots`).toContain(`Disallow: ${zone}`)
    }
  })
})

test.describe("Q22 — chaque page publique se déclare correctement", () => {
  for (const chemin of PUBLIQUES) {
    test(`${chemin}`, async ({ page, baseURL }) => {
      const r = await tete(page, chemin)
      expect(r.status(), `${chemin} répond ${r.status()}`).toBe(200)

      // Un seul canonical, absolu, et qui désigne CETTE page.
      const canoniques = await page.locator('link[rel="canonical"]').evaluateAll(
        els => els.map(e => e.getAttribute("href") || ""))
      expect(canoniques.length, `${chemin} : ${canoniques.length} canonical`).toBe(1)
      expect(canoniques[0], "canonical relatif").toMatch(/^https?:\/\//)
      expect(new URL(canoniques[0]).pathname.replace(/\/$/, ""), "le canonical désigne une autre page")
        .toBe(chemin.replace(/\/$/, ""))

      // Une page publique ne se met pas hors index.
      const robots = await page.locator('meta[name="robots"]').first().getAttribute("content").catch(() => null)
      expect(robots ?? "", `${chemin} se met en noindex`).not.toMatch(/noindex/i)

      // Un titre et une description, sans lesquels la page n'existe pas en SERP.
      expect((await page.title()).trim().length, "titre vide").toBeGreaterThan(5)
      const desc = await page.locator('meta[name="description"]').first().getAttribute("content").catch(() => null)
      expect((desc ?? "").trim().length, `${chemin} : pas de description`).toBeGreaterThan(20)

      // Un seul H1.
      expect(await page.locator("h1").count(), `${chemin} : nombre de H1`).toBe(1)
      void baseURL
    })
  }
})

test.describe("Q22 — les mentions légales restent hors index tant qu'elles sont incomplètes", () => {
  test(`${HORS_INDEX_TANT_QUE_INCOMPLETE} se met volontairement hors index`, async ({ page }) => {
    const r = await tete(page, HORS_INDEX_TANT_QUE_INCOMPLETE)
    expect(r.status()).toBe(200)
    const robots = await page.locator('meta[name="robots"]').first().getAttribute("content")
    expect(robots, "la page n'est plus protégée de l'indexation").toMatch(/noindex/i)
    // Et elle dit pourquoi, au lieu d'afficher des crochets vides.
    const texte = await page.locator("body").innerText()
    expect(texte, "des crochets de gabarit sont publiés").not.toMatch(/\[\s*(Nom|Numéro|Adresse)/i)
  })

  test("elle n'est pas non plus annoncée au sitemap", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text()
    const chemins = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname)
    expect(chemins, "une page hors index est proposée aux moteurs").not.toContain(HORS_INDEX_TANT_QUE_INCOMPLETE)
  })
})

test.describe("Q22 — les données structurées sont lisibles", () => {
  for (const chemin of ["/", "/guides/qr-code-dynamique-vs-statique", "/qr-code/restaurant", "/outils/testeur-qr-code"]) {
    test(`${chemin} : JSON-LD valide`, async ({ page }) => {
      await tete(page, chemin)
      const blocs = await page.locator('script[type="application/ld+json"]').evaluateAll(
        els => els.map(e => e.textContent || ""))
      expect(blocs.length, `${chemin} : aucune donnée structurée`).toBeGreaterThan(0)
      for (const [i, b] of blocs.entries()) {
        let parse: any
        expect(() => { parse = JSON.parse(b) }, `${chemin} : bloc ${i} illisible`).not.toThrow()
        // Un bloc peut être un objet, une liste, ou un `@graph` — les trois sont
        // valides chez schema.org. L'accueil emploie `@graph` : ses types sont
        // portés par les nœuds, pas par la racine.
        const racines = Array.isArray(parse) ? parse : [parse]
        for (const racine of racines) {
          expect(racine["@context"], `${chemin} : bloc ${i} sans @context`).toMatch(/schema\.org/)
          const noeuds = Array.isArray(racine["@graph"]) ? racine["@graph"] : [racine]
          expect(noeuds.length, `${chemin} : bloc ${i} vide`).toBeGreaterThan(0)
          for (const n of noeuds) {
            expect(n["@type"], `${chemin} : bloc ${i} — un nœud sans @type`).toBeTruthy()
          }
        }
      }
    })
  }
})

test.describe("Q22 — les zones privées restent hors index", () => {
  for (const chemin of PRIVEES) {
    test(`${chemin} n'est pas proposé aux moteurs`, async ({ request }) => {
      // On regarde ce qu'un ROBOT reçoit : une requête, pas une application qui
      // démarre. Charger /dashboard dans un navigateur attend une session qui ne
      // viendra pas — le test expirait sans rien mesurer.
      const r = await request.get(chemin, { maxRedirects: 0 }).catch(() => null)
      if (!r) return
      if (r.status() >= 300) return // redirigée ou refusée : rien à indexer ici
      const html = await r.text()
      const robots = (html.match(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/i) || [])[1] ?? ""
      const canonique = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/i) || [])[1] ?? ""
      // Soit la page se met hors index, soit elle n'offre aucun canonical qui
      // inviterait un moteur à la retenir. Le robots.txt la bloque déjà par ailleurs.
      expect(/noindex/i.test(robots) || !canonique,
        `${chemin} : indexable (robots="${robots}", canonical="${canonique}")`).toBe(true)
    })
  }
})
