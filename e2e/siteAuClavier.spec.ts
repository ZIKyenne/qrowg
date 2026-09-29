import { test, expect, type Page } from "@playwright/test"

// siteAuClavier — lot v199.
//
// ── Ce que cette garde tient ───────────────────────────────────────────────
//
// Le site entier, parcouru à la touche Tab, sur les 54 pages du sitemap :
// chaque commande atteinte montre un anneau de focus, porte un nom, n'est pas
// masquée aux technologies d'assistance, et le focus ne se bloque nulle part.
// Plus le lien d'évitement, et la langue du document.
//
// ── Les quatre sondes fausses qu'il a fallu écarter ────────────────────────
//
// Ce lot a commencé par **129 commandes sans anneau de focus**, **2 champs sans
// nom** et **46 débordements**. Aucun n'existait. Les trois venaient de la
// sonde, et chacun est écrit ici parce qu'ils sont faciles à refaire.
//
//   1. **Le contour est TRANSITIONNÉ.** Lu dans l'instant qui suit la touche,
//      `outline-width` vaut encore `0px` : on lit l'animation, pas le résultat.
//      La sonde annonçait 129 commandes sans anneau alors que toutes en ont un.
//      Elle attend maintenant que la transition se pose.
//
//   2. **`.labels` n'appartient pas qu'aux `<input>`.** La condition de sortie
//      testait `e instanceof HTMLInputElement` : un `<textarea>` parfaitement
//      étiqueté était donc compté comme sans nom.
//
//   3. **Un pot de miel anti-robot n'est pas une commande.** Le champ caché du
//      formulaire de contact porte `tabindex="-1"` et vit sous un
//      `aria-hidden="true"` : il est hors du parcours, et le compter revient à
//      exiger un nom pour quelque chose que personne n'atteindra jamais.
//
//   4. **`inert` ne touche pas à `tabindex`.** La barre d'appel collante du
//      téléphone, une fois corrigée AVEC LE BON OUTIL, restait signalée : la
//      sonde ne regardait que `tabindex` et `aria-hidden`. Elle accusait donc
//      la correction.
//
//   5. **L'overlay du serveur de développement n'est pas le produit.** Next
//      injecte un élément `<nextjs-portal>` — le bandeau « N Issues » — sur
//      CHAQUE page servie par `next dev`. Il prend une tabulation, et son hôte
//      n'a ni contour ni ombre : la garde le signalait donc sur les 44 pages du
//      site, et 44 lignes rouges noyaient tout ce qu'elle aurait pu dire de
//      vrai. Mesuré le 29 septembre, page par page : `nextjs-portal` existe 1
//      fois par page en développement, **0 fois sur un build de production**.
//      Ce n'est pas du code qui part chez le visiteur ; la garde l'ignore.
//
// Une sonde fausse est pire qu'une sonde absente : elle fait corriger ce qui va
// bien, et elle apprend à ne plus la lire. C'est la leçon du lot v187, celle du
// lot v190 — et celle des vingt gardes d'architecture réparées au lot v205.

/** Le contour de focus est transitionné : on le laisse se poser avant de lire. */
const POSE_MS = 150
/** Bornage du parcours : au-delà, on a vu tout ce qui distingue une page. */
const MAX_TAB = 40

async function routesPubliques(page: Page): Promise<string[]> {
  const rep = await page.request.get("/sitemap.xml")
  expect(rep.status(), "sitemap injoignable").toBe(200)
  const urls = [...(await rep.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  expect(urls.length, "sitemap vide — la garde ne verrait rien").toBeGreaterThan(20)
  return urls.map(u => { try { return new URL(u).pathname } catch { return u } })
}

/** Le relevé statique : ce qui se lit sans appuyer sur une touche. */
async function statique(page: Page) {
  return page.evaluate(() => {
    const o = { sansNom: [] as string[], tabindexPositif: [] as string[], ariaCacheFocusable: [] as string[], lang: document.documentElement.lang || "", evitement: false, lus: 0 }
    const nom = (e: Element) =>
      (e.getAttribute("aria-label") || "").trim() ||
      (e.getAttribute("title") || "").trim() ||
      (e.textContent || "").trim() ||
      (e.querySelector("img[alt]")?.getAttribute("alt") || "").trim() ||
      (e.getAttribute("aria-labelledby") ? (document.getElementById(e.getAttribute("aria-labelledby")!)?.textContent || "").trim() : "")

    for (const e of document.querySelectorAll('a[href],button,[role="button"],summary,input,select,textarea')) {
      const b = e.getBoundingClientRect()
      const st = getComputedStyle(e)
      if (st.display === "none" || st.visibility === "hidden") continue
      if (b.width === 0 && b.height === 0) continue
      o.lus++
      // Sonde fausse nº 3 : hors du parcours et masqué aux technologies
      // d'assistance — un pot de miel anti-robot, pas une commande.
      // Sonde fausse nº 4 : `inert` retire un sous-arbre du parcours au clavier
      // ET de l'arbre d'accessibilité, sans toucher à `tabindex`. Une sonde qui
      // ne regarde que `tabindex` et `aria-hidden` signale donc comme fautif ce
      // qui vient justement d'être corrigé avec le bon outil.
      // Sonde fausse nº 5 : l'overlay de `next dev`, absent de la production.
      if (e.closest("nextjs-portal")) { o.lus--; continue }
      const horsParcours = e.getAttribute("tabindex") === "-1" || e.closest("[inert]") || e.closest("[aria-hidden='true']")
      // Sonde fausse nº 2 : `.labels` existe aussi sur textarea et select.
      const etiquete = "labels" in e && (e as HTMLInputElement).labels && (e as HTMLInputElement).labels!.length > 0
      if (!horsParcours && !nom(e) && !etiquete) {
        o.sansNom.push(`${e.tagName.toLowerCase()}${e.className ? "." + String(e.className).split(" ")[0] : ""}`)
      }
      const ti = e.getAttribute("tabindex")
      if (ti && +ti > 0) o.tabindexPositif.push(`${e.tagName.toLowerCase()} tabindex=${ti}`)
      if (e.closest("[aria-hidden='true']") && !e.closest("[inert]") && ti !== "-1" && !e.hasAttribute("disabled")) {
        o.ariaCacheFocusable.push(`${e.tagName.toLowerCase()} « ${nom(e).slice(0, 24)} » focalisable sous aria-hidden`)
      }
    }
    const cible = document.querySelector("#contenu")
    const lien = document.querySelector('a[href="#contenu"]')
    o.evitement = !!(lien && cible && cible.tagName === "MAIN")
    return o
  })
}

/** Le relevé au clavier : on appuie vraiment sur Tab. */
async function auClavier(page: Page, maxTab: number, pose: number) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  const sansAnneau: string[] = []
  let atteints = 0, precedent = ""
  for (let i = 0; i < maxTab; i++) {
    await page.keyboard.press("Tab")
    // Sonde fausse nº 1 : le contour est transitionné.
    await page.waitForTimeout(pose)
    const f = await page.evaluate(() => {
      const e = document.activeElement
      if (!e || e === document.body) return null
      const s = getComputedStyle(e)
      const anneau =
        (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) ||
        (s.boxShadow !== "none" && s.boxShadow !== "")
      const cle = e.tagName.toLowerCase() + "|" + (e.className ? String(e.className).split(" ")[0] : "") + "|" + (e.textContent || "").trim().slice(0, 18)
      // Sonde fausse nº 5 : l'overlay du serveur de développement.
      const overlay = e.tagName.toLowerCase() === "nextjs-portal" || !!e.closest("nextjs-portal")
      return { cle, anneau, overlay, tag: e.tagName.toLowerCase(), nom: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 28) }
    })
    if (!f) break
    if (f.cle === precedent) break            // le focus ne bouge plus
    precedent = f.cle
    // L'overlay de `next dev` prend une tabulation, mais il n'existe pas en
    // production : il n'est ni compté ni jugé. On continue le parcours.
    if (f.overlay) continue
    atteints++
    if (!f.anneau) sansAnneau.push(`${f.tag} « ${f.nom} » sans anneau de focus`)
  }
  return { sansAnneau: [...new Set(sansAnneau)], atteints }
}

test.describe("le site se parcourt au clavier", () => {
  test.use({ reducedMotion: "reduce" })

  test("chaque commande du site public se voit et se nomme", async ({ page }) => {
    test.setTimeout(30 * 60 * 1000)
    const routes = await routesPubliques(page)
    const fautes: string[] = []
    let pages = 0, lus = 0, atteints = 0

    for (const r of routes) {
      const rep = await page.goto(r, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null)
      if (!rep || rep.status() !== 200) { fautes.push(`${r} — HTTP ${rep ? rep.status() : "injoignable"}`); continue }
      await page.waitForLoadState("networkidle").catch(() => {})
      await page.waitForTimeout(200)
      pages++

      const s = await statique(page)
      lus += s.lus
      for (const v of [...new Set(s.sansNom)]) fautes.push(`${r} — ${v} sans nom accessible`)
      for (const v of [...new Set(s.tabindexPositif)]) fautes.push(`${r} — ${v} (un tabindex positif casse l'ordre naturel)`)
      for (const v of [...new Set(s.ariaCacheFocusable)]) fautes.push(`${r} — ${v}`)
      if (!/^fr/.test(s.lang)) fautes.push(`${r} — la langue du document est « ${s.lang} »`)
      if (!s.evitement) fautes.push(`${r} — aucun lien d'évitement vers <main id="contenu">`)

      const k = await auClavier(page, MAX_TAB, POSE_MS)
      atteints += k.atteints
      for (const v of k.sansAnneau) fautes.push(`${r} — ${v}`)
      if (k.atteints === 0) fautes.push(`${r} — aucune commande atteinte au clavier`)
    }

    // Une sonde devenue aveugle est silencieuse, pas rouge.
    expect(pages, "plus aucune page atteinte").toBeGreaterThan(40)
    expect(lus, "plus aucune commande lue").toBeGreaterThan(500)
    expect(atteints, "plus aucune commande atteinte au clavier").toBeGreaterThan(300)
    expect(fautes, `${pages} pages, ${lus} commandes lues, ${atteints} atteintes au clavier :\n` + fautes.join("\n")).toEqual([])
  })

  test("le lien d'évitement mène vraiment au contenu", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.keyboard.press("Tab")
    // Le lien glisse depuis le haut : la transition dure 150 ms, on lui laisse
    // largement de quoi se poser plutôt que de lire au bord du délai.
    await page.waitForTimeout(400)
    const premier = await page.evaluate(() => {
      const e = document.activeElement as HTMLElement
      return { href: e?.getAttribute("href"), texte: (e?.textContent || "").trim(), visible: e?.getBoundingClientRect().top ?? -999 }
    })
    expect(premier.href, "le lien d'évitement n'est pas la première tabulation").toBe("#contenu")
    expect(premier.visible, "il doit se montrer quand on le focalise").toBeGreaterThanOrEqual(0)
    await page.keyboard.press("Enter")
    await page.waitForTimeout(250)
    const apres = await page.evaluate(() => document.activeElement?.tagName)
    expect(apres, "après Entrée, le focus doit être dans le contenu principal").toBe("MAIN")
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  test("une commande sans anneau serait vue", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      const b = document.createElement("button")
      b.id = "sonde-sans-anneau"
      b.textContent = "Sans anneau"
      b.style.cssText = "position:fixed;top:0;left:0;z-index:99999;outline:none!important;box-shadow:none!important"
      document.body.prepend(b)
      b.focus()
    })
    await page.waitForTimeout(POSE_MS)
    const vu = await page.evaluate(() => {
      const e = document.getElementById("sonde-sans-anneau")!
      const s = getComputedStyle(e)
      return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow !== "none" && s.boxShadow !== "")
    })
    expect(vu, "la sonde doit voir qu'il n'y a pas d'anneau").toBe(false)
  })

  test("un contour transitionné n'est PAS pris pour une absence d'anneau", async ({ page }) => {
    // La sonde fausse nº 1, prouvée. Sans l'attente, ce test verrait 0 px.
    await page.goto("/")
    const sansAttendre = await page.evaluate(() => {
      const b = document.createElement("button")
      b.id = "sonde-transition"
      b.textContent = "Avec transition"
      b.style.cssText = "position:fixed;top:40px;left:0;z-index:99999;outline:2px solid gold;outline-width:0;transition:outline-width .2s"
      document.body.prepend(b)
      b.getBoundingClientRect()
      b.style.outlineWidth = "2px"
      return parseFloat(getComputedStyle(b).outlineWidth)
    })
    await page.waitForTimeout(400)
    const apresAttente = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.getElementById("sonde-transition")!).outlineWidth))
    expect(sansAttendre, "lu tout de suite, le contour vaut encore 0").toBeLessThan(2)
    expect(apresAttente, "la transition posée, il vaut sa vraie valeur").toBeGreaterThanOrEqual(2)
  })

  test("`inert` retire vraiment du parcours au clavier", async ({ page }) => {
    // La sonde fausse nº 4, prouvée par la mesure et non par la confiance :
    // on essaie VRAIMENT de poser le focus sur un lien d'un sous-arbre inerte.
    await page.goto("/")
    const r = await page.evaluate(() => {
      const box = document.createElement("div")
      box.setAttribute("inert", "")
      const a = document.createElement("a")
      a.href = "/x"; a.textContent = "Inerte"; a.id = "sonde-inerte"
      box.appendChild(a); document.body.prepend(box)
      a.focus()
      const inerte = document.activeElement !== a
      box.removeAttribute("inert")
      a.focus()
      const actif = document.activeElement === a
      box.remove()
      return { inerte, actif }
    })
    expect(r.inerte, "un lien sous [inert] ne doit pas pouvoir recevoir le focus").toBe(true)
    expect(r.actif, "…et le même lien, une fois `inert` retiré, doit le recevoir").toBe(true)
  })

  test("un champ étiqueté par un <label> n'est PAS compté sans nom", async ({ page }) => {
    // La sonde fausse nº 2 : `.labels` existe aussi sur textarea et select.
    await page.goto("/contact")
    const r = await page.evaluate(() => {
      const t = document.querySelector("textarea")
      if (!t) return { trouve: false, etiquetes: 0 }
      return { trouve: true, etiquetes: t.labels ? t.labels.length : 0 }
    })
    expect(r.trouve, "le formulaire de contact doit avoir un textarea").toBe(true)
    expect(r.etiquetes, "il est étiqueté par un <label for>").toBeGreaterThan(0)
  })
})
