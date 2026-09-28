import { test, expect, type Page } from "@playwright/test"

// pageQuiSeCompose — lot v198.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Les lots v185 à v197 ont mesuré l'accueil à la loupe. Cette garde porte le
// même relevé sur les **54 pages du sitemap**, dans les deux tailles d'écran,
// et le rend permanent.
//
// Ce qu'elle a trouvé en naissant :
//
//   • **41 titres à ligne orpheline** — « Une page pensée pour cet / usage »,
//     répété sur dix-huit pages d'usage. Une dernière ligne d'un mot court fait
//     un titre tombé, pas composé. `text-wrap: balance` sur h1/h2/h3.
//   • **6 paragraphes de 87 à 114 caractères par ligne** sur `/upgrade`,
//     `/generateur-qr-code-wifi` et les deux outils. La mesure confortable
//     s'arrête vers 75 : au-delà, l'œil ne retrouve pas le début de la ligne
//     suivante. Ils lisent maintenant --mesure-texte.
//
// ── La sonde qui criait à tort, et comment elle a été corrigée ─────────────
//
// Premier jet du relevé de débordement : **46 fautes** sur téléphone. Toutes
// fausses. Les tableaux de `/outils/taille-qr-code` et des guides vivent dans
// un conteneur `overflow-x: auto` — ils SONT plus larges que l'écran, et c'est
// exactement ce qu'on veut : un tableau qui défile. Le champ « pot de miel » de
// `/contact` est posé à -9999 px, délibérément.
//
// Une sonde qui compte un tableau défilant comme un débordement fait crier la
// garde sur du code sain, et une garde qui crie à tort s'éteint (lot v190).
// Elle ignore donc ce qui vit dans un ancêtre qui défile ou qui rogne, et ce
// qui est posé loin hors de l'écran. Relevé après correction : **0**.

const MESURE_MAX = 82          // caractères par ligne ; au-delà, la lecture décroche
const ORPHELINE = 0.2          // dernière ligne sous 20 % de la largeur du titre

async function poser(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {})
  const derouler = () => page.evaluate(async () => {
    const pas = Math.round(innerHeight * 0.8)
    for (let y = 0; y < document.body.scrollHeight; y += pas) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)) }
    scrollTo(0, 0)
  })
  try { await derouler() } catch { await page.waitForTimeout(400); await derouler() }
  await page.waitForTimeout(400)
}

async function routesPubliques(page: Page): Promise<string[]> {
  const rep = await page.request.get("/sitemap.xml")
  expect(rep.status(), "sitemap injoignable").toBe(200)
  const urls = [...(await rep.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  expect(urls.length, "sitemap vide — la garde ne verrait rien").toBeGreaterThan(20)
  return urls.map(u => { try { return new URL(u).pathname } catch { return u } })
}

type Releve = { debord: string[]; longue: string[]; orphelin: string[]; vide: string[]; titre: string[]; lus: number }

async function relever(page: Page, max: number, orph: number): Promise<Releve> {
  return page.evaluate(([MAX, ORPH]) => {
    const vw = innerWidth
    const o: Releve = { debord: [], longue: [], orphelin: [], vide: [], titre: [], lus: 0 }

    // Un élément qui vit dans un conteneur qui DÉFILE ou qui ROGNE n'est pas un
    // débordement : c'est un tableau ou une bande d'images, et c'est voulu.
    const abrite = (e: Element) => {
      for (let n = e.parentElement; n; n = n.parentElement) {
        const s = getComputedStyle(n)
        if (/(auto|scroll)/.test(s.overflowX) && n.scrollWidth > n.clientWidth + 1) return true
        if (s.overflow === "hidden" || s.overflowX === "hidden") return true
      }
      return false
    }

    for (const e of document.querySelectorAll("body *")) {
      const b = e.getBoundingClientRect()
      if (b.width === 0 || b.height === 0) continue
      const s = getComputedStyle(e)
      if (s.position === "fixed") continue
      if (b.left < -500) continue                     // hors-écran délibéré
      if (b.right <= vw + 1.5 && b.left >= -1.5) continue
      if (abrite(e)) continue
      o.debord.push(`${e.tagName.toLowerCase()} ${Math.round(b.left)}..${Math.round(b.right)} (écran ${vw})`)
    }

    for (const e of document.querySelectorAll("p, li")) {
      const t = (e.textContent || "").trim()
      if (t.length < 90) continue
      const b = e.getBoundingClientRect(); if (!b.width) continue
      o.lus++
      const s = getComputedStyle(e)
      const c = document.createElement("canvas").getContext("2d")!
      c.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
      const n = Math.round(b.width / (c.measureText("0").width || 8))
      if (n > (MAX as number)) o.longue.push(`${n} caractères par ligne — « ${t.slice(0, 40)}… »`)
    }

    for (const h of document.querySelectorAll("h1, h2, h3")) {
      const t = (h.textContent || "").trim()
      if (t.split(/\s+/).length < 4) continue
      o.lus++
      const rg = document.createRange(); rg.selectNodeContents(h)
      const rects = [...rg.getClientRects()].filter(z => z.width > 1)
      if (rects.length < 2) continue
      const b = h.getBoundingClientRect()
      if (rects[rects.length - 1].width < b.width * (ORPH as number)) {
        o.orphelin.push(`${h.tagName} « ${t.slice(0, 44)} »`)
      }
    }

    for (const e of document.querySelectorAll("section, article, aside")) {
      const b = e.getBoundingClientRect()
      if (b.height > 40 && b.width > 40 && !(e.textContent || "").trim()
          && !e.querySelector("img,svg,canvas,video,input,button")) {
        o.vide.push(`${e.tagName.toLowerCase()} ${Math.round(b.width)}×${Math.round(b.height)} sans contenu`)
      }
    }

    const h1 = document.querySelectorAll("h1")
    if (h1.length !== 1) o.titre.push(`${h1.length} <h1> (il en faut exactement un)`)
    const niv = [...document.querySelectorAll("h1,h2,h3,h4")].map(h => +h.tagName[1])
    for (let i = 1; i < niv.length; i++) {
      if (niv[i] - niv[i - 1] > 1) { o.titre.push(`saut de niveau h${niv[i - 1]} → h${niv[i]}`); break }
    }
    return o
  }, [max, orph] as [number, number]) as Promise<Releve>
}

test.describe("chaque page publique est composée, pas empilée", () => {
  test.use({ reducedMotion: "reduce" })

  test("aucun défaut de composition sur le site public", async ({ page }) => {
    test.setTimeout(25 * 60 * 1000)
    const routes = await routesPubliques(page)
    const fautes: string[] = []
    let lus = 0, pages = 0

    for (const r of routes) {
      const rep = await page.goto(r, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null)
      if (!rep || rep.status() !== 200) { fautes.push(`${r} — HTTP ${rep ? rep.status() : "injoignable"}`); continue }
      pages++
      await poser(page)
      const x = await relever(page, MESURE_MAX, ORPHELINE)
      lus += x.lus
      for (const k of ["debord", "longue", "orphelin", "vide", "titre"] as const) {
        for (const v of [...new Set(x[k])]) fautes.push(`${r} — ${v}`)
      }
    }

    // Une sonde devenue aveugle est silencieuse, pas rouge.
    expect(pages, "plus aucune page atteinte").toBeGreaterThan(40)
    expect(lus, "plus aucun paragraphe ni titre parcouru — l'extraction ne lit plus rien").toBeGreaterThan(400)
    expect(fautes, `${pages} pages mesurées, ${lus} blocs lus :\n` + fautes.join("\n")).toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  test("une ligne trop longue serait vue", async ({ page }) => {
    await page.goto("/")
    await poser(page)
    await page.evaluate(() => {
      const p = document.createElement("p")
      p.textContent = "Une phrase délibérément longue, posée sur une largeur que personne ne devrait lire d'un seul tenant, pour vérifier que la sonde la voit bien passer le seuil."
      p.style.cssText = "position:fixed;top:0;left:0;z-index:99999;width:1600px;font-size:16px"
      document.body.appendChild(p)
    })
    const x = await relever(page, MESURE_MAX, ORPHELINE)
    expect(x.longue.some(l => /délibérément longue/.test(l))).toBe(true)
  })

  test("un paragraphe à la bonne mesure n'est PAS signalé", async ({ page }) => {
    // Le pendant. Sans lui, un seuil mal posé ferait crier la garde partout.
    await page.goto("/")
    await poser(page)
    await page.evaluate(() => {
      const p = document.createElement("p")
      p.id = "sonde-mesure-juste"
      p.textContent = "Une phrase de longueur ordinaire, posée sur une mesure de lecture confortable, comme le reste du site."
      p.style.cssText = "position:fixed;top:80px;left:0;z-index:99999;width:520px;font-size:16px"
      document.body.appendChild(p)
    })
    const x = await relever(page, MESURE_MAX, ORPHELINE)
    expect(x.longue.some(l => /longueur ordinaire/.test(l))).toBe(false)
  })

  test("un tableau qui défile n'est PAS pris pour un débordement", async ({ page }) => {
    // C'est l'erreur qu'a faite le premier jet : 46 fautes, toutes fausses.
    await page.goto("/")
    await poser(page)
    await page.evaluate(() => {
      const box = document.createElement("div")
      box.style.cssText = "position:fixed;top:160px;left:0;z-index:99999;width:300px;overflow-x:auto"
      const t = document.createElement("div")
      t.textContent = "colonne large"
      t.style.cssText = "width:1200px;height:30px"
      box.appendChild(t); document.body.appendChild(box)
    })
    const x = await relever(page, MESURE_MAX, ORPHELINE)
    expect(x.debord.length, "un contenu dans un conteneur qui défile ne doit pas être signalé").toBe(0)
  })

  test("un titre à ligne orpheline serait vu", async ({ page }) => {
    // `text-wrap: stable` désactive l'équilibrage : le titre retombe alors dans
    // le défaut que ce lot corrige, et la sonde doit le voir. C'est la preuve
    // que la règle posée dans globals.css fait bien quelque chose.
    await page.goto("/")
    await poser(page)
    const large = await page.evaluate(() => {
      const h = document.createElement("h2")
      h.id = "sonde-orpheline"
      // Une coupure explicite : la dernière ligne fait deux lettres, quoi que
      // décide l'algorithme d'équilibrage du navigateur. On teste la SONDE,
      // pas la façon dont Chromium répartit les mots.
      // L espace apres le <br> compte : sans lui, textContent colle les deux
      // mots et la sonde ne voit plus quatre mots mais un seul.
      h.innerHTML = "Un titre de plusieurs mots ordinaires<br> ok"
      h.style.cssText = "position:fixed;top:240px;left:0;z-index:99999;width:520px;font-size:30px;line-height:1.1"
      document.body.appendChild(h)
      const rg = document.createRange(); rg.selectNodeContents(h)
      const rects = [...rg.getClientRects()].filter(z => z.width > 1)
      return { lignes: rects.length, derniere: rects.length ? rects[rects.length - 1].width : 0, boite: h.getBoundingClientRect().width }
    })
    expect(large.lignes, "le titre injecté doit tenir sur plusieurs lignes").toBeGreaterThan(1)
    expect(large.derniere / large.boite, "la dernière ligne doit bien être courte").toBeLessThan(ORPHELINE)
    const x = await relever(page, MESURE_MAX, ORPHELINE)
    expect(x.orphelin.some(l => /mots ordinaires/.test(l)), "la sonde n'a pas vu la ligne orpheline").toBe(true)
  })
})
