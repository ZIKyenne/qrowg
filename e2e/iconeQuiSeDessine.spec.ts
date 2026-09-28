import { test, expect, type Page } from "@playwright/test"
import { ICONES } from "../apps/web/src/components/ui/Icone"

// iconeQuiSeDessine — lot v195.
//
// ── Le relevé ──────────────────────────────────────────────────────────────
//
// Le lot v188 a remplacé les 748 pictogrammes du site par un vocabulaire
// d'icônes dessinées. Les CHAMPS de données s'appellent toujours `emoji`, mais
// ils contiennent désormais un NOM de concept : « restaurant », « coiffeur ».
//
// La garde écrite alors, `pasDEmojiDecoratif`, vérifie que ces noms sont
// valides. Elle n'a jamais vérifié qu'ils sont **rendus** par `<Icone>`.
//
// Deux endroits les écrivaient donc en toutes lettres :
//
//   • les quatre pastilles flottantes du héros de l'accueil — « restaurant »,
//     « creatif », « immobilier », « bar » affichés par-dessus leur propre
//     étiquette, **en haut de la page d'accueil**, pendant six lots ;
//   • huit vignettes de `/creer`, en noir sur noir : invisibles à l'œil, lues
//     à voix haute par un lecteur d'écran.
//
// La donnée était juste. La garde était verte. Le rendu était faux.
// *Une garde qui valide une VALEUR sans regarder son EMPLOI ne prouve que la
// moitié de ce qu'elle annonce.*
//
// ── Pourquoi au navigateur, et pas sur la source ───────────────────────────
//
// La version source de cette garde a été écrite d'abord : repérer `{x.emoji}`
// rendu comme enfant JSX. Elle a levé quinze cas, dont **la plupart étaient
// légitimes** — `Tabs`, `upgrade` et l'aperçu de modèle rangent un ÉLÉMENT
// React dans un champ nommé `icon`, ce qui est parfaitement correct. Distinguer
// les deux demandait de savoir ce que contient la variable, pas son nom.
//
// Une garde qui crie sur du code sain finit par être éteinte : c'est ce qui est
// arrivé à `exemplesReels` au lot v190. Elle a donc été abandonnée au profit de
// celle-ci, qui mesure ce qui s'AFFICHE.
//
// ── Sa portée, et sa limite, écrites ───────────────────────────────────────
//
// Elle signale un texte visible dont le contenu est EXACTEMENT un nom du
// vocabulaire, et qui est le seul contenu d'un élément **étroit** — la forme
// d'une pastille d'icône. « restaurant » dans une phrase n'est pas concerné :
// c'est un mot français courant, et une garde qui l'interdirait serait absurde.
//
// Elle ne voit donc pas un nom écrit dans un large bloc de texte. C'est assumé :
// ce cas-là se voit à l'œil nu, alors qu'une pastille de 28 px ne se voit pas.

/** Au-delà, ce n'est plus une pastille d'icône mais du texte. */
const LARGEUR_PASTILLE = 64

async function poser(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)
}

async function routesPubliques(page: Page): Promise<string[]> {
  const rep = await page.request.get("/sitemap.xml")
  expect(rep.status(), "sitemap injoignable").toBe(200)
  const urls = [...(await rep.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  expect(urls.length, "sitemap vide — la garde ne verrait rien").toBeGreaterThan(20)
  return urls.map(u => { try { return new URL(u).pathname } catch { return u } })
}

type Trouve = { texte: string; largeur: number; chemin: string }

async function nomsAffiches(page: Page, vocabulaire: string[], seuil: number): Promise<Trouve[]> {
  return page.evaluate(([noms, max]) => {
    const jeu = new Set(noms as string[])
    const out: Trouve[] = []
    const chemin = (e: Element) => {
      const p: string[] = []
      for (let n: Element | null = e; n && n !== document.body; n = n.parentElement) {
        p.unshift(n.tagName.toLowerCase() + (n.className && typeof n.className === "string" ? "." + n.className.split(" ")[0] : ""))
      }
      return p.slice(-3).join(" > ")
    }
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n: Node | null
    while ((n = w.nextNode())) {
      const t = (n.nodeValue || "").trim()
      if (!t || !jeu.has(t)) continue
      const el = n.parentElement
      if (!el) continue
      // Le seul contenu de son élément : une pastille, pas un mot dans une phrase.
      if ((el.textContent || "").trim() !== t) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue          // non rendu
      if (r.width > (max as number)) continue                 // c'est du texte
      out.push({ texte: t, largeur: Math.round(r.width), chemin: chemin(el) })
    }
    return out
  }, [vocabulaire, seuil] as [string[], number]) as Promise<Trouve[]>
}

test.describe("le vocabulaire d'icônes se dessine, il ne s'écrit pas", () => {
  test.use({ reducedMotion: "reduce" })

  test("aucun nom de concept ne s'affiche en toutes lettres", async ({ page }) => {
    test.setTimeout(25 * 60 * 1000)
    const vocabulaire = Object.keys(ICONES)
    expect(vocabulaire.length, "vocabulaire vide — la garde ne chercherait rien").toBeGreaterThan(40)

    const routes = await routesPubliques(page)
    const fautes: string[] = []
    for (const r of routes) {
      const rep = await page.goto(r, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null)
      if (!rep || rep.status() !== 200) continue
      await poser(page)
      for (const f of await nomsAffiches(page, vocabulaire, LARGEUR_PASTILLE)) {
        fautes.push(`${r} — « ${f.texte} » écrit dans une pastille de ${f.largeur}px   ${f.chemin}`)
      }
    }
    expect(
      fautes,
      `${routes.length} pages mesurées :\n` + fautes.join("\n") + "\nPassez le champ à <Icone nom={…} />.",
    ).toEqual([])
  })

  // ── Contre-épreuves ──────────────────────────────────────────────────────

  test("un nom écrit dans une pastille serait vu", async ({ page }) => {
    await page.goto("/")
    await poser(page)
    await page.evaluate(() => {
      const s = document.createElement("span")
      s.textContent = "restaurant"
      s.style.cssText = "position:fixed;top:0;left:0;z-index:99999;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:15px;overflow:hidden"
      document.body.appendChild(s)
    })
    const v = await nomsAffiches(page, Object.keys(ICONES), LARGEUR_PASTILLE)
    expect(v.map(x => x.texte)).toContain("restaurant")
  })

  test("le même mot dans une phrase n'est PAS signalé", async ({ page }) => {
    // Le pendant, et il compte : « restaurant », « menu », « photo » sont des
    // mots français courants. Une garde qui les interdirait serait éteinte le
    // jour même.
    await page.goto("/")
    await poser(page)
    await page.evaluate(() => {
      const p = document.createElement("p")
      p.textContent = "restaurant"
      p.style.cssText = "position:fixed;top:60px;left:0;z-index:99999;width:400px;font-size:16px"
      document.body.appendChild(p)
      const q = document.createElement("p")
      q.textContent = "Un QR code pour votre restaurant, imprimé une seule fois."
      q.style.cssText = "position:fixed;top:100px;left:0;z-index:99999;width:400px;font-size:16px"
      document.body.appendChild(q)
    })
    const v = await nomsAffiches(page, Object.keys(ICONES), LARGEUR_PASTILLE)
    expect(v.length, "un mot dans une phrase ou un bloc large ne doit pas être signalé").toBe(0)
  })

  test("le relevé parcourt vraiment des nœuds de texte", async ({ page }) => {
    await page.goto("/")
    await poser(page)
    const n = await page.evaluate(() => {
      let k = 0
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      while (w.nextNode()) k++
      return k
    })
    expect(n, "plus aucun nœud de texte sur l'accueil").toBeGreaterThan(100)
  })
})
