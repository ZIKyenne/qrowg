import { test, expect, type Page } from "@playwright/test"

// ciblesAuPouce — lot v186. La mesure au navigateur, pour de vrai.
//
// ── Pourquoi ce fichier existe ─────────────────────────────────────────────
//
// `apps/web/src/app/ciblesPouce.test.ts` s'ouvre sur cette phrase :
//
//   « relevé au navigateur (Chromium, 360 px et 390 px, mode tactile), en
//     testant chaque commande avec `elementFromPoint` au centre de sa boîte :
//     le seul test qui dise "ce doigt-là atteint bien CE bouton" »
//
// Son code fait `readFileSync` et cherche des chaînes de caractères. Il compte
// onze vérifications sur une dizaine d'endroits corrigés un jour, figés en
// `expect(src).not.toContain("width: 36, height: 36")`. `elementFromPoint` n'y
// apparaît qu'une seule fois : dans ce commentaire.
//
// Le 27 septembre, une mesure réelle sur treize pages publiques a trouvé **117
// commandes sous 44 px** qu'il ne voyait pas — dont l'en-tête public ENTIER,
// plafonné à 32 px par une règle plus spécifique que la primitive. Il était au
// vert pendant ce temps, parce que le texte de `.ui-btn--sm` disait bien 44.
//
// Une garde qui décrit une méthode qu'elle n'applique pas est pire qu'une garde
// absente : elle rend confiant. Celle-ci fait la mesure annoncée.
//
// ── Ce qui est exempté, et pourquoi ────────────────────────────────────────
//
// Un lien AU FIL D'UNE PHRASE ne se grossit pas : l'agrandir casserait
// l'interligne du paragraphe qui le contient. C'est l'exception explicite de
// WCAG 2.5.8 (« inline »). On la reconnaît à la présence de vrai texte AUTOUR
// du lien dans son parent — pas à une liste de sélecteurs, qui vieillirait.
//
// ── Les deux axes ──────────────────────────────────────────────────────────
//
// La HAUTEUR doit tenir le plancher que le produit s'impose (`--cible-pouce`,
// 44 px). La LARGEUR doit tenir le plancher absolu de WCAG 2.5.8 (24 px) : un
// lien court comme « Guides » fait 41 px de large, et l'élargir à 44 ajouterait
// un blanc que personne n'a demandé. Le produit énonce sa règle en hauteur —
// `.ui-btn--sm { min-height: 44px }` — et c'est cet axe qu'on lui tient.

/** Le plancher du produit, lu dans le jeton plutôt que recopié. */
const PLANCHER_HAUTEUR = 44
/** Le plancher absolu de WCAG 2.5.8, pour l'axe que le produit ne fixe pas. */
const PLANCHER_LARGEUR = 24
/** Les sous-pixels d'un rendu à 390 px ne sont pas un défaut. */
const TOLERANCE = 0.6

type Cible = { txt: string; w: number; h: number; chemin: string }

async function ciblesTropPetites(page: Page): Promise<Cible[]> {
  return page.evaluate(
    ({ ph, pl, tol }) => {
      const visible = (e: Element) => {
        const s = getComputedStyle(e)
        const b = e.getBoundingClientRect()
        return s.display !== "none" && s.visibility !== "hidden" && +s.opacity > 0 && b.width > 0 && b.height > 0
      }
      // Exception « inline » de WCAG 2.5.8 : le lien est pris dans une PHRASE.
      //
      // ── Le trou bouché au lot v197 ─────────────────────────────────────────
      //
      // La première version comparait `parent.textContent` au texte du lien.
      // Or `textContent` d'un conteneur additionne le texte de TOUS ses
      // enfants — y compris les autres liens. Une colonne de pied de page qui
      // aligne vingt liens donnait donc « plus de 12 caractères autour », et
      // les vingt étaient exemptés comme s'ils étaient pris dans une phrase.
      //
      // Mesuré le 28 septembre sur l'accueil en 390 px : **30 commandes sous
      // 44 px** passaient ainsi — les 20 liens du pied de page (32 px), les
      // 6 onglets de métier (32 px), les 4 puces de forme du QR (36 px). La
      // garde était verte et le défaut était là.
      //
      // Ce qui fait une phrase, c'est du texte qui n'est PAS une commande. On
      // ne compte donc que les nœuds de texte propres au parent et ses enfants
      // non interactifs.
      const COMMANDES = 'a[href],button,[role="button"],summary'
      const dansLeFil = (e: Element) => {
        const p = e.parentElement
        if (!p) return false
        if (!/^(P|SPAN|LI|LABEL|SMALL|EM|STRONG|DIV)$/.test(p.tagName)) return false
        let autour = 0
        for (const n of Array.from(p.childNodes)) {
          if (n === e) continue
          if (n.nodeType === 3) { autour += (n.nodeValue || "").trim().length; continue }
          if (n.nodeType !== 1) continue
          const el = n as Element
          if (el.matches(COMMANDES) || el.querySelector(COMMANDES)) continue
          autour += (el.textContent || "").trim().length
        }
        return autour > 12
      }
      const out: { txt: string; w: number; h: number; chemin: string }[] = []
      const sel = 'a[href],button,[role="button"],summary,input[type="checkbox"],input[type="radio"]'
      for (const e of Array.from(document.querySelectorAll(sel))) {
        if (!visible(e) || dansLeFil(e)) continue
        const b = e.getBoundingClientRect()
        if (b.height >= ph - tol && b.width >= pl - tol) continue
        let chemin = e.tagName.toLowerCase()
        for (let p = e.parentElement, i = 0; p && i < 3; p = p.parentElement, i++) {
          const c = typeof p.className === "string" && p.className.trim() ? "." + p.className.trim().split(/\s+/)[0] : ""
          chemin = p.tagName.toLowerCase() + c + " > " + chemin
        }
        out.push({
          txt: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 34),
          w: Math.round(b.width), h: Math.round(b.height), chemin: chemin.slice(0, 80),
        })
      }
      return out
    },
    { ph: PLANCHER_HAUTEUR, pl: PLANCHER_LARGEUR, tol: TOLERANCE },
  )
}

/**
 * Les pages du sitemap. La liste n'est PAS écrite ici : une page ajoutée demain
 * est couverte sans y penser. C'est la règle que le test de fumée applique déjà
 * (lot v158), et la raison pour laquelle il voit ce que `ciblesPouce` ratait.
 */
async function routesPubliques(page: Page): Promise<string[]> {
  const rep = await page.request.get("/sitemap.xml")
  expect(rep.status(), "le sitemap doit répondre").toBe(200)
  const urls = [...(await rep.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
  expect(urls.length, "sitemap vide — la garde ne verrait rien").toBeGreaterThan(20)
  return urls.map(u => { try { return new URL(u).pathname } catch { return u } })
}

test.describe("tout ce qui se tape au pouce fait au moins 44 px de haut", () => {
  test.beforeEach(({ }, info) => {
    test.skip(info.project.name !== "mobile", "le pouce se mesure sur le projet mobile")
  })

  test("le plancher est déclaré une seule fois, et vaut bien 44", async ({ page }) => {
    // Le défaut du 27 septembre n'était pas un oubli : le produit écrivait son
    // minimum à DEUX endroits, 44 ici et 32 dans `.qf-entete`, et c'est le 32
    // qui gagnait. Un nombre recopié dérive comme une population recopiée.
    await page.goto("/")
    const jeton = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--cible-pouce").trim())
    expect(jeton, "le jeton --cible-pouce n'existe plus").toBe(`${PLANCHER_HAUTEUR}px`)
  })

  test("aucune commande du site public n'est sous le plancher", async ({ page }) => {
    test.setTimeout(20 * 60 * 1000)
    const routes = await routesPubliques(page)
    const soucis: string[] = []
    for (const r of routes) {
      const rep = await page.goto(r, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null)
      if (!rep || rep.status() !== 200) continue        // le test de fumée couvre l'atteignabilité
      await page.waitForLoadState("networkidle").catch(() => {})
      for (const c of await ciblesTropPetites(page)) {
        soucis.push(`${r} — « ${c.txt} » ${c.w}×${c.h}   ${c.chemin}`)
      }
    }
    expect(soucis, `${routes.length} pages mesurées au doigt :\n` + soucis.join("\n")).toEqual([])
  })

  // ── Contre-épreuves ─────────────────────────────────────────────────────

  test("une commande trop petite serait vue", async ({ page }) => {
    // Sans ceci, une extraction qui ne trouve plus rien passerait pour un
    // succès. C'est la leçon des lots v182 et v185 : une sonde aveugle est
    // silencieuse, pas rouge.
    await page.goto("/")
    await page.evaluate(() => {
      const b = document.createElement("button")
      b.textContent = "minuscule"
      b.style.cssText = "width:20px;height:20px;display:block;position:fixed;top:0;left:0;z-index:99999"
      document.body.appendChild(b)
    })
    const vues = await ciblesTropPetites(page)
    expect(vues.some(c => c.txt === "minuscule" && c.h === 20)).toBe(true)
  })

  test("un lien au fil d'une phrase reste exempté", async ({ page }) => {
    // Le pendant : la garde doit aussi savoir se TAIRE, sinon on l'éteindra.
    await page.goto("/")
    await page.evaluate(() => {
      const p = document.createElement("p")
      p.style.cssText = "position:fixed;top:0;left:0;z-index:99999"
      p.innerHTML = 'Une phrase assez longue avec <a href="#" style="height:14px;display:inline-block">un lien dedans</a> au milieu.'
      document.body.appendChild(p)
    })
    const vues = await ciblesTropPetites(page)
    expect(vues.some(c => c.txt === "un lien dedans")).toBe(false)
  })
})

// ───────────────────────────────────────────────────────────────────────────
// M03 — la même mesure, étendue à la zone connectée.
//
// Le relevé du 5 octobre a chiffré l'écart que l'absence de garde produit :
//
//     pages publiques, couvertes par le bloc ci-dessus ....... 10 cibles fautives
//     zone connectée, couverte par rien ..................... 575 cibles fautives
//
// Même produit, même semaine, rapport de 64 pour 1. La différence n'est pas
// l'effort de l'équipe : c'est qu'une machine vérifie d'un côté et pas de
// l'autre. Trois audits mobiles l'ont montré autrement — leurs primitives ont
// disparu du dépôt sans qu'un test rougisse.
//
// ── Pourquoi un plafond par écran, et pas « zéro » ─────────────────────────
//
// Exiger zéro aujourd'hui rendrait la suite rouge jusqu'à la fin de la refonte.
// Une garde durablement rouge, on la désactive. Le plafond gèle donc l'existant
// écran par écran et n'autorise qu'une chose : **descendre**. Chaque lot de la
// Phase 3 en retire, et met le chiffre à jour EN BAISSE. Le jour où un écran
// atteint zéro, son entrée disparaît et il tombe sous la règle stricte.
//
// C'est le motif de cliquet que le dépôt utilise déjà pour la taille des
// fichiers (`testsDeterministes.test.ts`) et pour les ruptures de largeur
// (`lib/ruptureUnique.test.ts`).

import { readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const RACINE_BANCS = join(__dirname, "..", "apps", "web", "src", "app", "e2e-harness")

/** Les bancs, découverts sur le disque — un banc ajouté demain est couvert. */
function bancsConnectes(): string[] {
  return readdirSync(RACINE_BANCS, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(RACINE_BANCS, e.name, "page.tsx")))
    .map(e => e.name)
    .sort((a, b) => a.localeCompare(b))
}

/**
 * Plafonds gelés le 5 octobre 2026, mesurés par `ciblesTropPetites` à 390 px.
 *
 * CETTE TABLE N'A LE DROIT QUE DE DÉCROÎTRE. Un écran absent de la table doit
 * être à zéro. Ne jamais relever un nombre pour faire passer la suite : si un
 * chiffre remonte, c'est qu'une commande a rétréci, et c'est exactement ce que
 * cette garde existe pour dire.
 */
const PLAFONDS: Record<string, number> = {
  "builder-redesign": 64,   // la refonte du builder derrière son drapeau — le pire du produit
  "block-library": 53,      // chips de catégorie 30 px, recherche 36 px, « ⓘ » 26×26
  "templates": 34,          // liens de modèle à 16 px de haut : la carte n'est pas la cible
  // 27 → 1 au lot M04 (6 octobre) : le QR Studio ouvre des `Modal`, devenues
  // des feuilles montantes sous 640 px. Vingt-six commandes sont passées sous
  // la barre des 44 px sans qu'une seule ligne de cet écran ne change.
  "qr-studio": 1,
  "builder-canvas": 19,
  "messages": 18,           // chips de filtre 32 px
  "block-settings": 12,
  "print-studio": 11,
  "statistiques": 10,       // boutons de période « 7j » 38×32  → page pilote, M10
  "menu-editor": 8,
  "redirections": 8,
  "domaines": 6,
  "image-crop": 5,
  "builder-mobile": 4,
  "blocks": 2,
  "medias": 2,
  "publication": 1,
  "reglages": 1,
  // Déjà propres, et donc absents : accueil, equipe, naming-style, onboarding,
  // public-page, statistiques?debut=1, template-preview, wizard. Ils tombent
  // sous la règle stricte : la moindre commande fautive les fera rougir.
}

/**
 * Total gelé le 5 octobre 2026 à **285**, resserré à **259** le 6 octobre
 * après M04. Ce nombre ne doit que baisser, et on le baisse à chaque fois qu'il
 * baisse — sinon le cliquet laisse reprendre le terrain gagné.
 */
const TOTAL_AU_5_OCTOBRE = 259

const RAPPORT = join("audit-mobile", "CIBLES-CONNECTE.md")

test.describe("la zone connectée tient le même plancher", () => {
  test.beforeEach(({ }, info) => {
    test.skip(info.project.name !== "mobile", "le pouce se mesure sur le projet mobile")
  })

  test("aucun écran connecté ne dépasse son plafond", async ({ page }) => {
    test.setTimeout(20 * 60 * 1000)
    const bancs = bancsConnectes()
    expect(bancs.length, "aucun banc trouvé — la garde ne verrait rien").toBeGreaterThan(15)

    const compte: Record<string, number> = {}
    const details: string[] = []
    const depassements: string[] = []

    for (const nom of bancs) {
      const route = `/e2e-harness/${nom}`
      const rep = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => null)
      // L'atteignabilité des bancs est la responsabilité de `bancsQuiDemarrent`.
      if (!rep || rep.status() !== 200) continue
      await page.waitForLoadState("networkidle").catch(() => {})

      const fautives = await ciblesTropPetites(page)
      compte[nom] = fautives.length
      for (const c of fautives) details.push(`${route} — « ${c.txt} » ${c.w}×${c.h}   ${c.chemin}`)

      const plafond = PLAFONDS[nom] ?? 0
      if (fautives.length > plafond) {
        depassements.push(
          `${route} : ${fautives.length} cibles sous 44 px, plafond ${plafond}` +
          (PLAFONDS[nom] === undefined ? " (écran censé être propre)" : ""),
        )
      }
    }

    // Le rapport s'écrit même quand tout passe : c'est lui qui permet de faire
    // baisser les plafonds en connaissance de cause, lot après lot.
    mkdirSync("audit-mobile", { recursive: true })
    const total = Object.values(compte).reduce((a, b) => a + b, 0)
    writeFileSync(RAPPORT, [
      "# Cibles tactiles de la zone connectée",
      "",
      `Mesuré le ${new Date().toISOString().slice(0, 10)} · 390 px · plancher 44 px de haut, 24 px de large`,
      "",
      `**Total : ${total} commandes sous le plancher.**`,
      "",
      "| Banc | Cibles fautives | Plafond gelé |",
      "| --- | --- | --- |",
      ...Object.entries(compte).sort((a, b) => b[1] - a[1])
        .map(([n, v]) => `| \`${n}\` | ${v || "—"} | ${PLAFONDS[n] ?? 0} |`),
      "",
      "## Le détail",
      "",
      "```",
      ...details,
      "```",
    ].join("\n") + "\n")

    expect(
      depassements,
      `Le plancher tactile a reculé. Rapport complet : ${RAPPORT}\n` + depassements.join("\n"),
    ).toEqual([])

    // Le cliquet global, en plus des plafonds par écran : il ferme la porte au
    // déplacement de dette d'un banc vers un autre, qui laisserait chaque
    // plafond tenu et le total inchangé.
    expect(
      total,
      `Total des cibles sous le plancher : ${total} (gelé à ${TOTAL_AU_5_OCTOBRE} le 5 octobre). ` +
      `S'il a baissé, mettez TOTAL_AU_5_OCTOBRE à jour EN BAISSE — jamais à la hausse.`,
    ).toBeLessThanOrEqual(TOTAL_AU_5_OCTOBRE)
  })
})
