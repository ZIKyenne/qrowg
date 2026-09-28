import { test, expect, type Page } from "@playwright/test"

// policeDesTitres — lot v195.
//
// ── Pourquoi cette garde vit au navigateur ─────────────────────────────────
//
// La garde jumelle, `policeDeTitre.test.ts`, lit la source : elle tient le
// jeton, l'alias, les graisses. Elle ne peut pas dire ce qui S'AFFICHE.
//
// Et c'est là que ce lot a failli s'arrêter trop tôt. Après avoir remplacé les
// 37 « Fraunces » écrits à la main, la mesure au navigateur a donné ceci :
//
//     52 titres sur 71 rendaient encore la police du CORPS.
//
// Parce que les pages SEO — /qr-code, /guides, /security, /outils, /upgrade,
// les deux générateurs — posent `fontFamily: 'DM Sans'` sur leur div racine et
// laissent leurs titres en hériter. Elles n'avaient JAMAIS demandé de police de
// titre, ni avant le lot ni après : elles ne nommaient pas « Fraunces », donc
// le relevé de la source ne les voyait pas.
//
// C'est, une fois de plus, la même cause : un relevé qui suit ce qui est ÉCRIT
// rate ce qui est HÉRITÉ. Seul le navigateur connaît la valeur calculée.
//
// ── La règle ───────────────────────────────────────────────────────────────
//
// Tout <h1> porte la police de titre. Tout <h2> rendu à SEUIL px ou plus aussi.
//
// En dessous, un <h2> n'est pas un titre mais une ÉTIQUETTE : les 34 vignettes
// de /examples (15 px) et les 8 cartes de /security (17 px). Une serif à cette
// taille, sur une ligne d'une largeur de carte, se lit moins bien qu'une
// grotesque — poser la police de titre partout serait aussi mécanique que ne la
// poser nulle part.

/** Le seuil au-dessus duquel un <h2> est un titre de section et non une étiquette. */
const SEUIL = 20

async function poser(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)
}

/** La population des pages : lue dans le sitemap du produit, jamais écrite ici. */
async function routesPubliques(page: Page): Promise<string[]> {
  const rep = await page.request.get("/sitemap.xml")
  expect(rep.status(), "sitemap injoignable").toBe(200)
  const urls = [...(await rep.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  expect(urls.length, "sitemap vide — la garde ne verrait rien").toBeGreaterThan(20)
  return urls.map(u => { try { return new URL(u).pathname } catch { return u } })
}

type Titre = {
  balise: string; texte: string; famille: string; pile: string
  taille: number; poids: string; horsPolice: string
}

async function titres(page: Page): Promise<Titre[]> {
  return page.evaluate(() => {
    const out: Titre[] = []
    for (const h of document.querySelectorAll("h1, h2")) {
      const t = (h.textContent || "").trim()
      if (!t) continue
      const s = getComputedStyle(h)
      const famille = s.fontFamily.split(",")[0].replace(/["']/g, "").trim()
      out.push({
        balise: h.tagName,
        texte: t.replace(/\s+/g, " ").slice(0, 48),
        famille,
        pile: s.fontFamily,
        taille: parseFloat(s.fontSize),
        poids: s.fontWeight,
        // Quels caractères de ce titre la famille ne dessine PAS.
        //
        // Première version : `document.fonts.check(police, texte)`. Fausse. Sur
        // un caractère qu'aucune @font-face déclarée ne couvre, `check` répond
        // TRUE — la spec considère que les polices système prendront le relais.
        // La sonde annonçait donc « tout est couvert » précisément dans le cas
        // qu'elle prétendait attraper. C'est la sonde fausse du lot v187 :
        // pire qu'une sonde absente, parce qu'elle rassure.
        //
        // La mesure honnête compare, caractère par caractère, la largeur rendue
        // par la famille à celle rendue par une famille INEXISTANTE (donc par
        // la police système). Identiques : ce caractère est parti en repli.
        horsPolice: (() => {
          const c = document.createElement("canvas").getContext("2d")!
          const manquants: string[] = []
          for (const ch of new Set(t.replace(/\s/g, ""))) {
            c.font = `${s.fontWeight} 200px "${famille}"`
            const a = c.measureText(ch).width
            c.font = `${s.fontWeight} 200px "QRowgAucunePoliceDeCeNom"`
            const b = c.measureText(ch).width
            if (a === b) manquants.push(ch)
          }
          return manquants.join("")
        })(),
      })
    }
    return out
  }) as Promise<Titre[]>
}

async function familleDeTitre(page: Page): Promise<string> {
  return page.evaluate(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--police-titre")
    return v.split(",")[0].replace(/["']/g, "").trim()
  })
}

async function familleDuCorps(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.body).fontFamily.split(",")[0].replace(/["']/g, "").trim())
}

test.describe("les titres du produit portent la police des titres", () => {
  test.use({ reducedMotion: "reduce" })

  test("le jeton existe, et sa police n'est pas celle du corps", async ({ page }) => {
    await page.goto("/")
    await poser(page)
    const titre = await familleDeTitre(page)
    const corps = await familleDuCorps(page)
    expect(titre, "le jeton --police-titre a disparu").toBeTruthy()
    expect(titre, `la police des titres (${titre}) est celle du corps : le produit n'a plus qu'un seul dessin`).not.toBe(corps)

    // Deux noms ne suffisent pas : deux @font-face peuvent porter des noms
    // différents et pointer vers le MÊME fichier. C'était exactement le cas
    // avant ce lot ('Fraunces' → inter-latin.woff2). On mesure donc le dessin.
    const memeDessin = await page.evaluate(async ([a, b]) => {
      await document.fonts.load(`700 100px "${a}"`)
      await document.fonts.load(`700 100px "${b}"`)
      const c = document.createElement("canvas").getContext("2d")!
      const mot = "Changez ce que montre votre QR code."
      c.font = `700 100px "${a}"`; const la = c.measureText(mot).width
      c.font = `700 100px "${b}"`; const lb = c.measureText(mot).width
      return Math.abs(la - lb) < 0.5
    }, [titre, corps])
    expect(memeDessin, `« ${titre} » et « ${corps} » rendent exactement la même chose : l'un est un alias de l'autre`).toBe(false)
  })

  test("chaque titre du site public porte la police des titres", async ({ page }) => {
    test.setTimeout(25 * 60 * 1000)
    const routes = await routesPubliques(page)
    const fautes: string[] = []
    let vus = 0, soumis = 0, h2Soumis = 0, h2Ignores = 0

    await page.goto("/")
    const attendue = await familleDeTitre(page)

    for (const r of routes) {
      const rep = await page.goto(r, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null)
      if (!rep || rep.status() !== 200) continue
      await poser(page)
      for (const t of await titres(page)) {
        vus++
        if (t.balise === "H2" && t.taille < SEUIL) { h2Ignores++; continue }   // étiquette de carte
        soumis++
        if (t.balise === "H2") h2Soumis++
        if (t.famille !== attendue) {
          fautes.push(`${r} — ${t.balise} ${Math.round(t.taille)}px rend « ${t.famille} » — « ${t.texte} »`)
        } else if (t.horsPolice) {
          // La famille est demandée mais un caractère manque : celui-là part
          // dans la police système, et le défaut ne se voit que sur ce mot.
          fautes.push(`${r} — ${t.balise} « ${t.texte} » : ${t.famille} ne dessine pas « ${t.horsPolice} »`)
        }
      }
    }

    // Une sonde devenue aveugle est silencieuse, pas rouge.
    //
    // Le premier jet ne comptait que le TOTAL soumis. Une mutation portant le
    // seuil à 999 est passée au vert : tous les <h2> étaient écartés, mais les
    // 54 <h1> suffisaient à tenir le compte au-dessus du plancher. La garde ne
    // vérifiait plus une seule section et ne disait rien. On compte donc les
    // deux populations séparément, et on les compare l'une à l'autre plutôt
    // qu'à un nombre écrit à la main.
    expect(vus, "plus aucun titre lu sur le site").toBeGreaterThan(50)
    expect(soumis, "plus aucun titre ne passe le seuil : la garde ne vérifie plus rien").toBeGreaterThan(20)
    expect(h2Soumis, "plus aucun <h2> ne passe le seuil : les titres de section ne sont plus vérifiés").toBeGreaterThan(50)
    expect(
      h2Soumis,
      `le seuil écarte plus de <h2> qu'il n'en vérifie (${h2Ignores} écartés, ${h2Soumis} vérifiés) : il n'ordonne plus rien`,
    ).toBeGreaterThan(h2Ignores)
    expect(fautes, `${routes.length} pages, ${vus} titres lus, ${soumis} soumis à la règle :\n` + fautes.join("\n")).toEqual([])
  })

  test("aucune graisse de titre n'est ramenée en silence", async ({ page }) => {
    // Une police qui plafonne à 700 ramène un 800 sans rien dire : le nombre
    // écrit ne décrit plus ce qui s'affiche. On compare le dessin demandé au
    // dessin obtenu, plutôt que de recopier le plafond.
    await page.goto("/")
    await poser(page)
    const titre = await familleDeTitre(page)
    const ecarts = await page.evaluate(async ([fam, seuil]) => {
      const out: string[] = []
      const c = document.createElement("canvas").getContext("2d")!
      for (const h of document.querySelectorAll("h1, h2")) {
        const s = getComputedStyle(h)
        if (h.tagName === "H2" && parseFloat(s.fontSize) < (seuil as number)) continue
        const p = parseInt(s.fontWeight, 10)
        if (p <= 100) continue
        await document.fonts.load(`${p} 100px "${fam}"`)
        await document.fonts.load(`${p - 100} 100px "${fam}"`)
        c.font = `${p} 100px "${fam}"`; const a = c.measureText("Hxn").width
        c.font = `${p - 100} 100px "${fam}"`; const b = c.measureText("Hxn").width
        // Deux graisses voisines qui rendent EXACTEMENT la même largeur : la
        // police plafonne, et le chiffre écrit est décoratif.
        if (Math.abs(a - b) < 0.01) out.push(`${(h.textContent || "").trim().slice(0, 40)} → ${p}`)
      }
      return out
    }, [titre, SEUIL] as [string, number])
    expect(ecarts, "une graisse demandée est ramenée en silence — écrivez celle que la police sait dessiner").toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  test("un titre remis dans la police du corps serait vu", async ({ page }) => {
    await page.goto("/")
    await poser(page)
    const attendue = await familleDeTitre(page)
    await page.evaluate(() => {
      const h = document.createElement("h2")
      h.textContent = "Titre revenu à la police du corps"
      h.style.cssText = "font-family:'Inter',sans-serif;font-size:44px;position:fixed;top:0;left:0;z-index:99999"
      document.body.appendChild(h)
    })
    const fautifs = (await titres(page)).filter(t => !(t.balise === "H2" && t.taille < SEUIL) && t.famille !== attendue)
    expect(fautifs.map(t => t.texte)).toContain("Titre revenu à la police du corps")
  })

  test("une étiquette de carte sous le seuil n'est PAS signalée", async ({ page }) => {
    // Le pendant. Sans lui, la garde interdirait un choix délibéré et finirait
    // par être contournée — c'est ce qui est arrivé à `exemplesReels` au v190.
    await page.goto("/")
    await poser(page)
    const attendue = await familleDeTitre(page)
    await page.evaluate(() => {
      const h = document.createElement("h2")
      h.textContent = "Etiquette de vignette"
      h.style.cssText = "font-family:'Inter',sans-serif;font-size:15px;position:fixed;top:0;left:0;z-index:99999"
      document.body.appendChild(h)
    })
    const fautifs = (await titres(page)).filter(t => !(t.balise === "H2" && t.taille < SEUIL) && t.famille !== attendue)
    expect(fautifs.map(t => t.texte)).not.toContain("Etiquette de vignette")
  })

  test("un caractère que la police ne dessine pas serait vu", async ({ page }) => {
    // Ce que la sonde attrape, prouvé — et la fausse piste écartée.
    //
    // `document.fonts.check(police, texte)` ne sert PAS ici : sur un caractère
    // qu'aucune @font-face ne couvre, il répond true (repli système présumé).
    // Vérifié ci-dessous, pour que personne n'y revienne.
    await page.goto("/")
    await poser(page)
    const titre = await familleDeTitre(page)
    const r = await page.evaluate(async (fam) => {
      await document.fonts.load(`700 200px "${fam}"`)
      const c = document.createElement("canvas").getContext("2d")!
      const repli = (ch: string) => {
        c.font = `700 200px "${fam}"`; const a = c.measureText(ch).width
        c.font = `700 200px "QRowgAucunePoliceDeCeNom"`; const b = c.measureText(ch).width
        return a === b
      }
      return {
        // Un idéogramme : aucune police latine ne le dessine.
        horsPolice: repli("\u6f22"),
        // Un « é » : le sous-ensemble latin de la police de titre le couvre.
        dansLaPolice: repli("\u00e9"),
        // La fausse piste.
        checkSurInconnu: document.fonts.check('400 20px "Police Qui N Existe Pas"', "\u00e9"),
      }
    }, titre)
    expect(r.horsPolice, "un caractère parti en repli doit être signalé").toBe(true)
    expect(r.dansLaPolice, `« é » doit être dessiné par ${titre} — sinon la sonde crie sur tout`).toBe(false)
    expect(r.checkSurInconnu, "fonts.check répond true sur une famille inconnue : il ne prouve rien").toBe(true)
  })
})
