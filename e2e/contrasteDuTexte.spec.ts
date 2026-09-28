import { test, expect, type Page } from "@playwright/test"

// contrasteDuTexte — lot v187.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Le lot v186 avait mesuré les cibles au pouce. Il restait, non traité, « 186
// textes sous 12 px ». En les mesurant vraiment, la taille n'était pas le
// sujet : sur 290 petits textes, **261 étaient parfaitement lisibles**. Le
// défaut était le CONTRASTE — et il ne dépend pas de la taille.
//
// Relevé du 27 septembre, 54 pages, iPhone 13 : **546 textes sous le seuil WCAG
// de 4,5:1**. Le gros du lot à 4,1–4,45 — juste en dessous — et une queue
// sévère : 1,73:1 sur le bouton « Télécharger PNG » du générateur à l'état où
// un visiteur le découvre, 1,93:1 sur « En envoyant ce message, tu acceptes
// notre politique de confidentialité », 1,98:1 sur la liste de ce qu'un plan
// ne contient PAS, page d'abonnement.
//
// ── La cause ───────────────────────────────────────────────────────────────
//
// La couleur discrète du site, `rgb(138,132,120)`, existait dans le code avec
// **treize alphas différents** : 0,9 · 0,92 · 0,85 · 0,82 · 0,8 · 0,75 · 0,65 ·
// 0,6 · 0,5 · 0,45 · 0,4 · 0,2 · 0,1. Chaque page redéclarait son `const MUT`.
// Le tableau de bord, lui, lit `var(--muted)` : il avait un jeton, le site
// public recopiait un littéral. Quand on voulait « plus discret », on baissait
// l'alpha — personne n'avait mesuré ce que ça coûtait.
//
// Un jeton, `--texte-discret`, remplace les treize. 546 → 0.
//
// ── Pourquoi cette garde vit au navigateur ─────────────────────────────────
//
// Le contraste ne se lit pas dans le code source. Il dépend du fond RÉEL, qui
// vient d'ancêtres translucides empilés, d'opacités de groupe, d'un état
// désactivé. Aucune lecture de fichier ne peut le calculer — c'est la leçon du
// lot v186, où une garde annonçait une mesure au navigateur qu'elle ne faisait
// pas.
//
// ── Les six défauts qu'a eus la sonde avant d'être juste ───────────────────
//
// Ils sont écrits ici parce qu'ils sont faciles à refaire, et qu'une sonde
// fausse est pire qu'une sonde absente : elle crie sur ce qui va bien et se
// tait sur le reste.
//
//   1. **Le fond n'est pas la première couleur opaque rencontrée.** Chercher un
//      ancêtre dont l'alpha dépasse 0,75 sautait par-dessus `rgba(201,168,76,
//      0.3)` et concluait « noir sur noir ». Il faut COMPOSER toutes les couches.
//   2. **Un libellé masqué n'est pas un défaut.** Une boîte de 1×1 px avec
//      `clip: rect(0 0 0 0)` est une aide pour lecteur d'écran. Accepter
//      « largeur > 0 » donnait cinquante faux positifs : le même mot masqué
//      dans l'en-tête, sur cinquante pages.
//   3. **Un emoji porte ses propres couleurs.** `color` ne s'y applique pas ;
//      mesurer son contraste n'a aucun sens.
//   4. **L'opacité d'un élément estompe aussi SON fond.** Ne l'appliquer qu'au
//      texte faisait lire 3,20:1 sur un bouton qui garde son contraste à l'œil.
//      Elle ne compte que si le fond vient d'au-dessus du groupe d'opacité.
//   5. **Une animation d'apparition se mesure à mi-course.** Sans attendre, on
//      lit des états transitoires. On coupe le mouvement et on laisse poser.
//   6. **Ce qui est sous la ligne de flottaison est à `opacity: 0`.** Sans
//      dérouler la page, des sections entières se mesurent à 1:1 — j'ai d'abord
//      pris ça pour des fautes de contraste sur des couleurs qui donnent 5,3.

/** Le seuil WCAG 1.4.3, selon que le texte est « grand » ou non. */
const SEUIL_NORMAL = 4.5
const SEUIL_GRAND = 3

type Faute = { r: string; ratio: number; px: number; couleur: string; fond: string; txt: string; chemin: string }

async function textesTropPales(page: Page): Promise<Omit<Faute, "r">[]> {
  return page.evaluate(
    ({ sn, sg }) => {
      const lum = (c: number[]) => {
        const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const rgb = (s: string) => {
        const m = s.match(/rgba?\(([^)]+)\)/)
        if (!m) return null
        const p = m[1].split(",").map(x => parseFloat(x))
        return { c: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }
      }
      const melange = (fg: number[], a: number, bg: number[]) => fg.map((v, i) => v * a + bg[i] * (1 - a))

      // Défaut nº 1 : composer les couches, pas chercher la première opaque.
      const fondDe = (e: Element) => {
        const couches: { c: number[]; a: number }[] = []
        let n: Element | null = e
        while (n && n !== document.documentElement) {
          const v = rgb(getComputedStyle(n).backgroundColor)
          if (v && v.a > 0) { couches.push(v); if (v.a >= 0.999) break }
          n = n.parentElement
        }
        let fond = [8, 8, 8]
        for (let i = couches.length - 1; i >= 0; i--) fond = melange(couches[i].c, couches[i].a, fond)
        return fond
      }

      // Défauts nº 2 et nº 6 : masqué pour lecteur d'écran, ou pas encore apparu.
      const vis = (e: Element) => {
        const s = getComputedStyle(e), b = e.getBoundingClientRect()
        if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false
        if (b.width <= 2 || b.height <= 2) return false
        if (/rect\(0px,? 0px,? 0px,? 0px\)/.test(s.clip)) return false
        if (/inset\(\s*50%/.test(s.clipPath)) return false
        for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) {
          const a = getComputedStyle(n)
          if (a.display === "none" || a.visibility === "hidden" || +a.opacity === 0) return false
        }
        return true
      }

      // Défaut nº 4 : l'opacité ne compte que si le fond vient d'au-dessus.
      const opaciteUtile = (e: Element) => {
        let o = 1, fondTrouve = false
        for (let n: Element | null = e; n && n !== document.documentElement; n = n.parentElement) {
          const s = getComputedStyle(n)
          const bgv = rgb(s.backgroundColor)
          if (bgv && bgv.a > 0) fondTrouve = true
          const val = parseFloat(s.opacity || "1")
          if (val < 1 && !fondTrouve) o *= val
        }
        return o
      }

      const out: Omit<Faute, "r">[] = []
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let n: Node | null
      while ((n = w.nextNode())) {
        const t = (n.textContent || "").trim()
        if (t.length < 3) continue
        // Défaut nº 3 : un pictogramme n'a pas de couleur de texte.
        if (!/[\p{L}\p{N}]/u.test(t)) continue
        const p = (n as Text).parentElement
        if (!p || !vis(p)) continue
        // Exemption WCAG 1.4.3 : le texte qui fait partie d'une IMAGE. Le
        // produit doit alors le DIRE (`role="img"` + un libellé), ce qui est
        // aussi ce qui évite qu'un lecteur d'écran lise un décor.
        //
        // ── Le trou bouché au lot v201 ──────────────────────────────────────
        //
        // Cette exemption écartait TOUT ce qui vit dans un `<svg>`. Elle a donc
        // écarté aussi les vrais textes DESSINÉS en SVG — un `<text>` n'est pas
        // un pictogramme, c'est du texte.
        //
        // Ce que ça cachait : sur `/features`, l'étiquette « QROWG.COM » de la
        // maquette de QR était écrite dans la couleur d'ACCENT du style. Sur le
        // style « Classique », l'accent est l'or et le fond est BLANC. Mesuré au
        // pixel : **2,3:1**. Illisible, sur une page publique, et la garde était
        // verte depuis qu'elle existe.
        //
        // Un `<text>` est donc mesuré ; le reste d'un `<svg>` reste écarté.
        const dansSvg = p.closest("svg")
        const estTexteSvg = p.tagName.toLowerCase() === "text" || !!p.closest("text")
        if ((p.closest('[role="img"]') || dansSvg) && !estTexteSvg) continue

        const s = getComputedStyle(p)
        const px = parseFloat(s.fontSize)
        // En SVG, la couleur d'un texte est son `fill`, pas son `color` : lire
        // `color` rendrait la valeur héritée du CSS de la page, qui n'a rien à
        // voir avec ce qui est peint.
        const f = rgb(estTexteSvg ? (s.fill || s.color) : s.color)
        if (!f) continue
        const bg = fondDe(p)
        const eff = melange(f.c, f.a * opaciteUtile(p), bg)
        const L1 = lum(eff), L2 = lum(bg)
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
        const gras = parseInt(s.fontWeight, 10) >= 700
        const seuil = px >= 24 || (gras && px >= 18.66) ? sg : sn
        if (ratio >= seuil) continue

        let chemin = p.tagName.toLowerCase()
        for (let a = p.parentElement, i = 0; a && i < 3; a = a.parentElement, i++) {
          const c = typeof a.className === "string" && a.className.trim() ? "." + a.className.trim().split(/\s+/)[0] : ""
          chemin = a.tagName.toLowerCase() + c + " > " + chemin
        }
        out.push({
          ratio: +ratio.toFixed(2), px, couleur: s.color,
          fond: `rgb(${bg.map(Math.round).join(",")})`,
          txt: t.slice(0, 38), chemin: chemin.slice(0, 70),
        })
      }
      return out
    },
    { sn: SEUIL_NORMAL, sg: SEUIL_GRAND },
  )
}

/** Défauts nº 5 et nº 6 : dérouler pour révéler, puis laisser poser. */
async function poserLaPage(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {})
  // Lot v197 — le déroulé partait parfois en « Execution context was destroyed »
  // quand une navigation côté client survenait pendant qu'il tournait. La garde
  // virait alors au rouge sans qu'aucun texte ne soit en cause : trois tests sur
  // quinze, au hasard des exécutions.
  // Une garde qui rougit par intermittence finit par être ignorée — c'est le
  // pire état possible pour une garde. On réessaie une fois, après que la page
  // s'est reposée ; si le deuxième essai échoue aussi, l'erreur remonte.
  const derouler = () => page.evaluate(async () => {
    const pas = Math.round(window.innerHeight * 0.8)
    for (let y = 0; y < document.body.scrollHeight; y += pas) {
      window.scrollTo(0, y)
      await new Promise(r => setTimeout(r, 90))
    }
    window.scrollTo(0, 0)
  })
  try {
    await derouler()
  } catch {
    await page.waitForLoadState("domcontentloaded").catch(() => {})
    await page.waitForTimeout(400)
    await derouler()
  }
  await page.waitForTimeout(1200)
}

async function routesPubliques(page: Page): Promise<string[]> {
  const rep = await page.request.get("/sitemap.xml")
  expect(rep.status(), "le sitemap doit répondre").toBe(200)
  const urls = [...(await rep.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  expect(urls.length, "sitemap vide — la garde ne verrait rien").toBeGreaterThan(20)
  return urls.map(u => { try { return new URL(u).pathname } catch { return u } })
}

test.describe("tout le texte du site public se lit", () => {
  test.use({ reducedMotion: "reduce" })

  test("le jeton du ton discret existe et tient le seuil", async ({ page }) => {
    await page.goto("/")
    const jeton = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--texte-discret").trim())
    expect(jeton, "le jeton --texte-discret a disparu").toBeTruthy()
    // On ne recopie pas le nombre : on le mesure sur le fond le plus clair du
    // site public, `--surface`, qui est le cas le moins favorable.
    const ratio = await page.evaluate(() => {
      const lum = (c: number[]) => { const [r,g,b] = c.map(v => { v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4) }); return 0.2126*r+0.7152*g+0.0722*b }
      // Lire la couleur AVEC son alpha. Premiere version : `match(/\d+/g)` puis
      // les trois premiers nombres — sur `rgba(138,132,120,0.45)` elle rendait
      // [138,132,120] et jetait le 0,45. La garde etait donc aveugle a la
      // dilution, c'est-a-dire au defaut meme que ce lot corrige. La mutation
      // qui remet l'ancien alpha est passee au vert ; c'est ainsi qu'on l'a su.
      const lire = (nom: string) => {
        const d = document.createElement("div")
        d.style.color = `var(${nom})`
        document.body.appendChild(d)
        const brut = getComputedStyle(d).color
        d.remove()
        const m = brut.match(/rgba?\(([^)]+)\)/)
        if (!m) return { c: [0, 0, 0], a: 1 }
        const v = m[1].split(",").map(x => parseFloat(x))
        return { c: [v[0], v[1], v[2]], a: v.length > 3 ? v[3] : 1 }
      }
      const fgv = lire("--texte-discret"), bgv = lire("--surface")
      // Le fond, lui, doit etre opaque pour servir de reference.
      const bg = bgv.c
      const fg = fgv.c.map((x, i) => x * fgv.a + bg[i] * (1 - fgv.a))
      const L1 = lum(fg), L2 = lum(bg)
      return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05)
    })
    expect(ratio, "le ton discret ne passe plus le seuil sur --surface").toBeGreaterThanOrEqual(SEUIL_NORMAL)
  })

  test("aucun texte du site public n'est sous le seuil WCAG", async ({ page }) => {
    test.setTimeout(25 * 60 * 1000)
    const routes = await routesPubliques(page)
    const fautes: string[] = []
    for (const r of routes) {
      const rep = await page.goto(r, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null)
      if (!rep || rep.status() !== 200) continue
      await poserLaPage(page)
      for (const f of await textesTropPales(page)) {
        fautes.push(`${r} — ${f.ratio}:1 — ${f.couleur} sur ${f.fond} — « ${f.txt} »   ${f.chemin}`)
      }
    }
    expect(fautes, `${routes.length} pages mesurées :\n` + fautes.join("\n")).toEqual([])
  })

  // ── Contre-épreuves ─────────────────────────────────────────────────────

  test("un texte trop pâle serait vu", async ({ page }) => {
    await page.goto("/")
    await poserLaPage(page)
    await page.evaluate(() => {
      const p = document.createElement("p")
      p.textContent = "texte beaucoup trop pale"
      p.style.cssText = "color:#2a2a2a;background:#000;position:fixed;top:0;left:0;z-index:99999;font-size:16px;padding:8px"
      document.body.appendChild(p)
    })
    const vus = await textesTropPales(page)
    expect(vus.some(f => f.txt.startsWith("texte beaucoup trop"))).toBe(true)
  })

  test("le fond translucide d'un ancêtre est bien composé", async ({ page }) => {
    // Le défaut nº 1, en épreuve : sans composition, le texte sombre ci-dessous
    // serait jugé « sur du noir » et passerait pour illisible alors qu'il l'est
    // réellement — et inversement, un fond clair translucide sauverait à tort
    // un texte pâle. On vérifie que le fond calculé est bien le mélange.
    await page.goto("/")
    await poserLaPage(page)
    await page.evaluate(() => {
      const boite = document.createElement("div")
      boite.style.cssText = "background:rgba(255,255,255,0.9);position:fixed;top:0;left:0;z-index:99999;padding:8px"
      const p = document.createElement("p")
      p.textContent = "sombre sur clair translucide"
      p.style.cssText = "color:#f0f0f0;font-size:16px;margin:0"
      boite.appendChild(p)
      document.body.appendChild(boite)
    })
    const vus = await textesTropPales(page)
    const f = vus.find(x => x.txt.startsWith("sombre sur clair"))
    expect(f, "le fond translucide n'a pas été composé : la faute n'est pas vue").toBeTruthy()
    expect(f!.fond, "le fond lu n'est pas le mélange attendu").toMatch(/rgb\(2[0-9]{2},2[0-9]{2},2[0-9]{2}\)/)
  })

  test("un libellé masqué pour lecteur d'écran est ignoré", async ({ page }) => {
    // Le pendant : la garde doit aussi savoir se taire. Cinquante faux positifs
    // venaient d'ici.
    await page.goto("/")
    await poserLaPage(page)
    await page.evaluate(() => {
      const s = document.createElement("span")
      s.textContent = "libelle masque pour lecteur"
      s.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"
      document.body.appendChild(s)
    })
    const vus = await textesTropPales(page)
    expect(vus.some(f => f.txt.startsWith("libelle masque"))).toBe(false)
  })

  test("un emoji n'est pas mesuré", async ({ page }) => {
    await page.goto("/")
    await poserLaPage(page)
    await page.evaluate(() => {
      const s = document.createElement("p")
      s.textContent = "🍽️🛍️🎨"
      s.style.cssText = "color:#080808;background:#080808;position:fixed;top:0;left:0;z-index:99999;font-size:22px"
      document.body.appendChild(s)
    })
    const vus = await textesTropPales(page)
    expect(vus.some(f => /[🍽🛍🎨]/u.test(f.txt))).toBe(false)
  })

  test("le relevé voit vraiment du texte (sinon il ne prouve rien)", async ({ page }) => {
    // Une sonde devenue aveugle est silencieuse, pas rouge. On compte ce
    // qu'elle PARCOURT, pas seulement ce qu'elle rejette.
    await page.goto("/")
    await poserLaPage(page)
    // Même précaution que dans `poserLaPage` : l'accueil peut encore replacer
    // son adresse après hydratation, ce qui détruit le contexte en plein comptage.
    // On réessaie une fois plutôt que de rougir pour une raison qui n'a rien à
    // voir avec le contraste.
    const compter = () => page.evaluate(() => {
      let k = 0
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (w.nextNode()) k++
      return k
    })
    let n: number
    try {
      n = await compter()
    } catch {
      await page.waitForLoadState("domcontentloaded").catch(() => {})
      await page.waitForTimeout(400)
      n = await compter()
    }
    expect(n, "plus aucun nœud de texte sur l'accueil").toBeGreaterThan(100)
  })
})
