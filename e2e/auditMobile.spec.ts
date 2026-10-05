import { test, expect, type Page } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// auditMobile — l'instrumentation, avant la refonte.
//
// ── Pourquoi ce fichier existe ─────────────────────────────────────────────
//
// Trois audits mobiles ont eu lieu dans ce produit (13, 14 et 15 juillet 2026).
// Chacun a été lu, traité, puis consigné. Et le 5 octobre, en cherchant les
// primitives qu'ils avaient produites — `components/mobile/BottomSheet.tsx`,
// `MobileDock.tsx`, `designTokens.ts`, `BigSlider.tsx` — aucune n'existe plus.
// Le `PrintStudio.tsx` qu'ils ont rendu utilisable au doigt n'existe plus non
// plus : une refonte l'a remplacé par `print-studio/PrintStudioClient.tsx`.
//
// Un audit dont le résultat disparaît sans que personne ne s'en aperçoive n'est
// pas un audit, c'est une dépense. La différence entre les trois précédents et
// celui-ci doit être qu'il LAISSE UNE MESURE, reproductible par une commande,
// que la prochaine refonte fera bouger visiblement.
//
// Ce fichier ne juge donc pas le goût. Il compte ce qui se compte :
//
//   · débordement horizontal      (le symptôme le plus sûr d'un desktop compressé)
//   · commandes sous 44 px        (le plancher que le produit s'impose déjà)
//   · textes sous 13 px           (le plancher de l'audit de juillet)
//   · défilements imbriqués       (la cause nº1 d'un scroll qui « accroche »)
//   · éléments fixés en bas sans réserve de safe-area
//   · commandes trop proches      (le doigt fait 8 mm, pas 2 px)
//
// ── Ce qu'il ne mesure PAS, et qu'il ne faut pas lui demander ──────────────
//
// Le ressenti. La fluidité d'un glissement, la justesse d'une transition, le
// confort d'une position au pouce : un navigateur sans pouce n'en sait rien.
// Ces points-là restent du rôle de l'utilisateur, sur un vrai téléphone.
// Chromium en mode tactile ne reproduit ni l'inertie iOS, ni la barre d'URL de
// Safari qui mange la hauteur, ni le clavier natif.
//
// ── Comment s'en servir ────────────────────────────────────────────────────
//
//   npx playwright test e2e/auditMobile.spec.ts --project=mobile
//
// Rapport écrit dans `audit-mobile/` : un JSON par vue + une synthèse Markdown
// + les captures. Le JSON est fait pour être comparé d'une passe à l'autre.

type Souci = { quoi: string; ou: string; detail: string }
type Releve = {
  route: string
  largeur: number
  hauteur: number
  statut: number
  debordement: number
  coupables: string[]
  ciblesBasses: number
  pireCible: string
  textesPetits: number
  textesMinuscules: number
  textesCourts: number
  corpsTropPetit: number
  defilementsImbriques: number
  fixesSansSafeArea: number
  voisinsTropProches: number
  soucis: Souci[]
}

// ── Les vues auditées ──────────────────────────────────────────────────────
//
// Publiques : ce que voit quelqu'un qui arrive de Google. Bancs d'essai : les
// écrans connectés, qui n'ont pas de base de données accessible depuis cet
// environnement (le projet Supabase de `.env.local` ne répond plus) et que les
// harnais `/e2e-harness/*` montent avec un jeu de démonstration.
const VUES_PUBLIQUES = [
  "/", "/creer", "/qr-code", "/qr-code/restaurant", "/qr-code/avis-google",
  "/guides", "/guides/qr-code-dynamique-vs-statique", "/examples", "/features",
  "/upgrade", "/generateur-qr-code", "/outils/taille-qr-code",
  "/outils/testeur-qr-code", "/contact", "/auth/login", "/auth/signup",
]

const VUES_CONNECTEES = [
  "/e2e-harness/accueil", "/e2e-harness/statistiques", "/e2e-harness/statistiques?debut=1",
  "/e2e-harness/qr-studio", "/e2e-harness/print-studio", "/e2e-harness/templates",
  "/e2e-harness/builder-mobile", "/e2e-harness/block-library", "/e2e-harness/block-settings",
  "/e2e-harness/medias", "/e2e-harness/messages", "/e2e-harness/reglages",
  "/e2e-harness/domaines", "/e2e-harness/redirections", "/e2e-harness/equipe",
  "/e2e-harness/onboarding", "/e2e-harness/publication", "/e2e-harness/wizard",
]

// 320 = le plus petit encore en circulation (iPhone SE 1re gén., et le pire cas
// de tout débordement). 390 = l'iPhone de référence. 430 = le plus grand.
const LARGEURS = [
  { w: 320, h: 568, nom: "320-petit" },
  { w: 390, h: 844, nom: "390-reference" },
  { w: 430, h: 932, nom: "430-grand" },
]

const DOSSIER = "audit-mobile"

/** Le relevé, exécuté DANS la page. Tout est mesuré, rien n'est deviné. */
async function mesurer(page: Page): Promise<Omit<Releve, "route" | "largeur" | "hauteur" | "statut">> {
  return page.evaluate(() => {
    const PLANCHER_HAUTEUR = 44   // `--cible-pouce`, la règle que le produit s'impose
    const PLANCHER_LARGEUR = 24   // WCAG 2.5.8, plancher absolu
    const PLANCHER_TEXTE = 13     // minimum retenu par l'audit mobile de juillet
    const soucis: { quoi: string; ou: string; detail: string }[] = []

    const nommer = (e: Element): string => {
      const el = e as HTMLElement
      const t = el.tagName.toLowerCase()
      const id = el.id ? `#${el.id}` : ""
      const cl = typeof el.className === "string" && el.className
        ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
        : ""
      const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28)
      return `${t}${id}${cl}${txt ? ` «${txt}»` : ""}`
    }

    const visible = (el: Element): boolean => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return false
      const s = getComputedStyle(el)
      return s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0"
    }

    // ── 1. Débordement horizontal ──────────────────────────────────────────
    const vw = document.documentElement.clientWidth
    const debordement = Math.max(0, document.documentElement.scrollWidth - vw)
    const coupables: string[] = []
    if (debordement > 1) {
      for (const el of Array.from(document.querySelectorAll("*"))) {
        if (!visible(el)) continue
        const r = el.getBoundingClientRect()
        // On ne retient que l'élément qui dépasse SANS qu'un parent dépasse déjà :
        // sinon on remonte toute la chaîne d'ancêtres pour un seul vrai coupable.
        if (r.right <= vw + 1 && r.left >= -1) continue
        const p = el.parentElement
        if (p) {
          const pr = p.getBoundingClientRect()
          if (pr.right > vw + 1 || pr.left < -1) continue
        }
        coupables.push(`${nommer(el)} → ${Math.round(r.right - vw)}px hors champ`)
        if (coupables.length >= 6) break
      }
    }

    // ── 2. Cibles tactiles ─────────────────────────────────────────────────
    // L'exception « inline » de WCAG 2.5.8 : un lien au fil d'une phrase ne se
    // grossit pas, sa hauteur est celle de l'interligne. On la reconnaît à du
    // vrai texte autour de lui dans son parent.
    const auFilDuTexte = (el: Element): boolean => {
      const p = el.parentElement
      if (!p) return false
      const autour = (p.textContent || "").replace((el.textContent || ""), "").trim()
      return autour.length > 12
    }
    const SELECTEUR = 'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, summary, [role="tab"], [role="switch"], [role="menuitem"], [tabindex]:not([tabindex="-1"])'
    const commandes = Array.from(document.querySelectorAll(SELECTEUR)).filter(visible)
    let ciblesBasses = 0
    let pire = { nom: "—", h: 999 }
    const boites: { nom: string; r: DOMRect }[] = []
    for (const el of commandes) {
      const r = el.getBoundingClientRect()
      boites.push({ nom: nommer(el), r })
      if (el.tagName === "A" && auFilDuTexte(el)) continue
      const tropCourt = r.height < PLANCHER_HAUTEUR
      const tropEtroit = r.width < PLANCHER_LARGEUR
      if (tropCourt || tropEtroit) {
        ciblesBasses++
        if (r.height < pire.h) pire = { nom: `${nommer(el)} — ${Math.round(r.width)}×${Math.round(r.height)}`, h: r.height }
        if (ciblesBasses <= 8) soucis.push({ quoi: "cible", ou: nommer(el), detail: `${Math.round(r.width)}×${Math.round(r.height)}px` })
      }
    }

    // ── 3. Textes trop petits ──────────────────────────────────────────────
    //
    // Première version de cette mesure : « tout texte sous 13 px ». Elle a
    // rendu 2 408 occurrences, dont — en les regardant — les numéros d'étape
    // « 01 », « 02 » de l'accueil à 11 px et les étiquettes de navigation.
    // L'échelle typographique du produit AUTORISE 11–12 px pour une étiquette,
    // un badge ou un libellé de nav. Compter ces cas comme des fautes aurait
    // produit un chiffre alarmant et faux — l'exact symétrique d'un chiffre
    // complaisant.
    //
    // Deux compteurs, donc, et seul le premier est une faute :
    //   · textesMinuscules (< 11 px) : illisible dans tous les rôles ;
    //   · textesCourts (11–12,9 px)  : à juger selon le rôle — acceptable pour
    //     une étiquette, une faute pour du corps de texte. Une machine ne sait
    //     pas distinguer les deux ; on retient ici le seul signal objectif,
    //     la LONGUEUR : au-delà de 60 caractères, ce n'est plus une étiquette.
    let textesMinuscules = 0
    let textesCourts = 0
    let corpsTropPetit = 0
    for (const el of Array.from(document.querySelectorAll("p, span, a, li, td, th, label, div, small, button, h1, h2, h3, h4, h5, h6"))) {
      if (!visible(el)) continue
      // Seulement les éléments qui portent EUX-MÊMES du texte, pas les conteneurs.
      const propre = Array.from(el.childNodes).some(n => n.nodeType === 3 && (n.textContent || "").trim().length > 1)
      if (!propre) continue
      const px = parseFloat(getComputedStyle(el).fontSize)
      if (!px || px >= PLANCHER_TEXTE) continue
      const longueur = (el.textContent || "").trim().length
      if (px < 11) {
        textesMinuscules++
        if (textesMinuscules <= 5) soucis.push({ quoi: "texte-minuscule", ou: nommer(el), detail: `${px.toFixed(1)}px` })
      } else {
        textesCourts++
        if (longueur > 60) {
          corpsTropPetit++
          if (corpsTropPetit <= 5) soucis.push({ quoi: "corps-trop-petit", ou: nommer(el), detail: `${px.toFixed(1)}px sur ${longueur} caractères` })
        }
      }
    }
    const textesPetits = textesMinuscules + textesCourts

    // ── 4. Défilements imbriqués ───────────────────────────────────────────
    const defilant = (el: Element): boolean => {
      const s = getComputedStyle(el)
      const o = s.overflowY + " " + s.overflowX
      if (!/auto|scroll/.test(o)) return false
      return el.scrollHeight > el.clientHeight + 4 || el.scrollWidth > el.clientWidth + 4
    }
    let defilementsImbriques = 0
    for (const el of Array.from(document.querySelectorAll("*"))) {
      if (!visible(el) || !defilant(el)) continue
      let p = el.parentElement
      while (p && p !== document.body && p !== document.documentElement) {
        if (defilant(p)) {
          defilementsImbriques++
          if (defilementsImbriques <= 4) soucis.push({ quoi: "scroll-imbrique", ou: nommer(el), detail: `dans ${nommer(p)}` })
          break
        }
        p = p.parentElement
      }
    }

    // ── 5. Éléments fixés en bas sans réserve de safe-area ─────────────────
    // Chromium sans encoche ne révèle pas l'encoche. Ce qu'on peut établir :
    // un élément collé à `bottom: 0` qui n'a AUCUN rembourrage bas sera coupé
    // par la barre de gestes iOS. C'est un indice, pas une preuve de rendu iOS.
    let fixesSansSafeArea = 0
    for (const el of Array.from(document.querySelectorAll("*"))) {
      if (!visible(el)) continue
      const s = getComputedStyle(el)
      if (s.position !== "fixed" && s.position !== "sticky") continue
      const r = el.getBoundingClientRect()
      const colleEnBas = Math.abs(r.bottom - window.innerHeight) < 2
      if (!colleEnBas) continue
      const pb = parseFloat(s.paddingBottom) || 0
      const mb = parseFloat(s.marginBottom) || 0
      if (pb + mb < 8) {
        fixesSansSafeArea++
        soucis.push({ quoi: "safe-area", ou: nommer(el), detail: `collé en bas, rembourrage ${pb + mb}px` })
      }
    }

    // ── 6. Commandes trop proches ──────────────────────────────────────────
    let voisinsTropProches = 0
    for (let i = 0; i < boites.length; i++) {
      for (let j = i + 1; j < boites.length; j++) {
        const a = boites[i].r, b = boites[j].r
        const dx = Math.max(0, Math.max(a.left - b.right, b.left - a.right))
        const dy = Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom))
        if (dx === 0 && dy === 0) continue          // imbriqués, pas voisins
        if (dx < 8 && dy < 8 && (dx > 0 || dy > 0)) {
          voisinsTropProches++
          if (voisinsTropProches <= 3) soucis.push({ quoi: "voisinage", ou: boites[i].nom, detail: `à ${Math.round(Math.max(dx, dy))}px de ${boites[j].nom}` })
        }
      }
    }

    return {
      debordement, coupables, ciblesBasses, pireCible: pire.nom,
      textesPetits, textesMinuscules, textesCourts, corpsTropPetit,
      defilementsImbriques, fixesSansSafeArea, voisinsTropProches, soucis,
    }
  })
}

const releves: Releve[] = []

test.describe("audit mobile — relevé instrumenté", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 })

  for (const { w, h, nom } of LARGEURS) {
    for (const route of [...VUES_PUBLIQUES, ...VUES_CONNECTEES]) {
      test(`${nom} · ${route}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h })
        const rep = await page.goto(route, { waitUntil: "domcontentloaded" })
        const statut = rep?.status() ?? 0
        // Un harnais gaté ou une route absente se note, elle ne fait pas échouer
        // le relevé : c'est une information sur l'environnement, pas un défaut.
        if (statut >= 400) {
          releves.push({ route, largeur: w, hauteur: h, statut, debordement: 0, coupables: [], ciblesBasses: 0, pireCible: "—", textesPetits: 0, textesMinuscules: 0, textesCourts: 0, corpsTropPetit: 0, defilementsImbriques: 0, fixesSansSafeArea: 0, voisinsTropProches: 0, soucis: [] })
          return
        }
        await page.waitForTimeout(900) // laisser l'hydratation poser la mise en page
        const m = await mesurer(page)
        releves.push({ route, largeur: w, hauteur: h, statut, ...m })

        const fichier = route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accueil"
        mkdirSync(join(DOSSIER, nom), { recursive: true })
        await page.screenshot({ path: join(DOSSIER, nom, `${fichier}.png`), fullPage: false })
      })
    }
  }

  test.afterAll(() => {
    mkdirSync(DOSSIER, { recursive: true })
    writeFileSync(join(DOSSIER, "releve.json"), JSON.stringify(releves, null, 2))

    const pire = [...releves].sort((a, b) =>
      (b.debordement > 1 ? 1000 : 0) + b.ciblesBasses - ((a.debordement > 1 ? 1000 : 0) + a.ciblesBasses))
    const lignes = [
      "# Relevé mobile instrumenté",
      "",
      `Mesuré le ${new Date().toISOString().slice(0, 10)} · Chromium tactile · ${releves.length} vues`,
      "",
      "| Vue | Largeur | Débordement | Cibles < 44 | Texte < 11px | Corps < 13px | Scroll imbriqué | Safe-area | Voisins < 8px |",
      "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
      ...pire.map(r => `| \`${r.route}\` | ${r.largeur} | ${r.debordement > 1 ? `**${r.debordement}px**` : "—"} | ${r.ciblesBasses || "—"} | ${r.textesMinuscules || "—"} | ${r.corpsTropPetit || "—"} | ${r.defilementsImbriques || "—"} | ${r.fixesSansSafeArea || "—"} | ${r.voisinsTropProches || "—"} |`),
      "",
      "## Ce que ce relevé ne dit pas",
      "",
      "Chromium en mode tactile ne reproduit ni l'inertie de défilement d'iOS, ni la",
      "barre d'URL de Safari qui mange la hauteur, ni le clavier natif, ni l'encoche.",
      "Les colonnes « safe-area » sont des indices, pas une mesure sur iPhone.",
    ]
    writeFileSync(join(DOSSIER, "RELEVE.md"), lignes.join("\n") + "\n")
    // Le relevé est une mesure, pas une garde : il ne fait pas échouer la suite.
    // La garde des cibles tactiles existe déjà et c'est `ciblesAuPouce.spec.ts`.
    expect(releves.length).toBeGreaterThan(0)
  })
})
