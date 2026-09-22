// Le miroir regarde le même cadre que ce qu'il reflète — garde de classe.
//
// `blockEmptyState.ts` promet, dans ses premières lignes, une ÉQUIVALENCE :
//
//     « Les clés de champs ci-dessous sont IDENTIQUES à celles filtrées côté
//       public → `hasPublishableContent === false` ⟺ le bloc rend `null` en
//       ligne. »
//
// C'est la promesse qui fait tout le travail du fichier : l'éditeur affiche un
// état vide — « Invisible en ligne tant qu'il est vide » — exactement quand la
// page ne publiera rien.
//
// **Elle était fausse pour sept blocs.** Pas sur les clés : sur le CADRE. Le
// détecteur balayait cinquante emplacements pour tout le monde —
//
//     function anyIndexed(c, keyAt, max = 50)
//
// — pendant que le rendu public de ces sept-là s'arrête bien avant :
//
//     testimonials  3      merch         3      lineup        4
//     avatar_row    6      engagements   6      grid_section  6
//     logo_marquee 10
//
// Une page portant un `name4` sur un bloc d'avis — écrite avant que le lot v148
// ne ferme le plafond du panneau, quand il en proposait cinquante — était donc
// jugée **publiable** par l'éditeur et **ne publiait rien**. Le commerçant
// voyait un bloc plein d'un côté, rien en ligne de l'autre, et pas un mot pour
// l'expliquer. C'est le pire des deux mondes : ni l'état vide qui dit quoi
// faire, ni la page qui montre le contenu.
//
// **Une huitième trouvaille, qui n'en était pas une.** J'ai d'abord cru que
// `event_access` oubliait ses transports : son rendu ne disparaît que si les
// TROIS manquent — plan, adresse ET transports — et le détecteur semblait n'en
// regarder que deux. C'est le contre-test qui m'a détrompé : la mutation « on
// retire les transports du détecteur » n'a **rien** cassé, parce qu'une seconde
// ligne, plus bas, les énumérait déjà à la main :
//
//     || hasMeaningfulText(c.transport1_label) || … || c.transport3_label
//
// Le compte était donc juste — mais par coïncidence : rien ne liait ce trois-là
// au trois du rendu. C'est ce qui est réparé, et c'est tout ce qui l'était.
//
// La classe : **le miroir regarde le même cadre.** Le détecteur lit
// `plafondDesLignes(type)`, comme le rendu, et il regarde tout ce que le rendu
// regarde.
//
// Ce que ce fichier vérifie n'est pas la forme du code mais l'ÉQUIVALENCE
// elle-même : il remplit un emplacement, demande au détecteur, demande au
// rendu, et exige qu'ils disent la même chose.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { hasPublishableContent, EMPTY_STATE_BLOCK_TYPES } from "./blockEmptyState"
import { BLOCK_DEFS } from "./blockDefs"
import { PLAFOND_DES_LIGNES, PLAFOND_PAR_DEFAUT, plafondDesLignes } from "./shared-renderer/models/plafondDesLignes"
import { merchViewModel } from "./shared-renderer/models/merch"
import { testimonialsViewModel } from "./shared-renderer/models/testimonials"
import { lineupViewModel } from "./shared-renderer/models/lineup"
import { engagementsViewModel } from "./shared-renderer/models/engagements"
import { grille } from "./shared-renderer/models/structurePage"
import { rowAvatars } from "./shared-renderer/blocks/avatar_row"
import { marqueeLogos } from "./shared-renderer/blocks/logo_marquee"
import { lignesParcours } from "./shared-renderer/models/presentationEtEncadres"
import { acces } from "./shared-renderer/models/evenement"

const lire = (p: string) => fs.readFileSync(path.join(__dirname, p), "utf8")

/**
 * Les neuf blocs du relevé, avec de quoi interroger les DEUX côtés : la clé qui
 * compte pour le détecteur, et ce que le rendu public en tire réellement.
 */
import { pricingViewModel } from "./shared-renderer/models/pricing"
const LES_DEUX_COTES: { type: string; cle: (i: number) => string; rendu: (c: Record<string, string>) => number }[] = [
  // Lot v166 : `pricing` a reçu son détecteur, et son plafond est serré (trois
  // offres). Il s'interroge bien emplacement par emplacement — il entre donc
  // dans la table, plutôt que dans la liste des exceptions.
  { type: "pricing", cle: i => `title${i}`, rendu: c => pricingViewModel(c).plans.length },
  { type: "testimonials", cle: i => `name${i}`, rendu: c => testimonialsViewModel(c).items.length },
  { type: "merch", cle: i => `name${i}`, rendu: c => merchViewModel(c).items.length },
  { type: "lineup", cle: i => `a${i}_name`, rendu: c => lineupViewModel(c).items.length },
  { type: "engagements", cle: i => `e${i}`, rendu: c => engagementsViewModel(c).items.length },
  { type: "grid_section", cle: i => `c${i}_title`, rendu: c => grille(c)?.cartes.length ?? 0 },
  { type: "avatar_row", cle: i => `name${i}`, rendu: c => rowAvatars(c).length },
  { type: "logo_marquee", cle: i => `name${i}`, rendu: c => marqueeLogos(c).length },
  { type: "journey", cle: i => `line_${i}`, rendu: c => lignesParcours(c).length },
  // `event_access` compte ses transports, mais publie aussi sur une simple
  // adresse : son rendu ne disparaît que si les trois manquent.
  { type: "event_access", cle: i => `transport${i}_label`, rendu: c => acces(c)?.transports.length ?? 0 },
]

describe("l'équivalence que le fichier promet", () => {
  it("un emplacement AU-DELÀ du plafond ne publie rien — et l'éditeur le dit", () => {
    const fautifs: string[] = []
    for (const { type, cle, rendu } of LES_DEUX_COTES) {
      const trop = plafondDesLignes(type) + 1
      const c = { [cle(trop)]: "Écrit avant le lot v148" }
      const publiable = hasPublishableContent(type, c)
      const rendus = rendu(c)
      if (rendus !== 0) fautifs.push(`${type} : le rendu montre ${rendus} ligne(s) au-delà de son plafond`)
      if (publiable) fautifs.push(`${type} : l'éditeur le croit publiable, la page ne rend rien`)
    }
    expect(fautifs, "le détecteur doit lire plafondDesLignes(type)").toEqual([])
  })

  it("…et un emplacement DANS le cadre publie — sinon l'équivalence serait vide", () => {
    for (const { type, cle, rendu } of LES_DEUX_COTES) {
      const c = { [cle(1)]: "Marie D." }
      expect(hasPublishableContent(type, c), `${type} : premier emplacement`).toBe(true)
      expect(rendu(c), `${type} : le rendu en montre une`).toBeGreaterThan(0)
      // Et le dernier emplacement du cadre compte autant que le premier.
      const dernier = { [cle(plafondDesLignes(type))]: "Marie D." }
      expect(hasPublishableContent(type, dernier), `${type} : dernier emplacement`).toBe(true)
      expect(rendu(dernier), `${type} : le rendu le voit aussi`).toBeGreaterThan(0)
    }
  })

  it("un plafond serré reste celui que le bloc déclare", () => {
    // Le tableau des plafonds sert aux DEUX côtés : il ne peut donc pas prouver
    // sa propre valeur. L'oracle indépendant, c'est la DÉCLARATION du bloc —
    // les emplacements écrits dans `BLOCK_DEFS`. Pour les sept blocs que le lot
    // v150 a mis en boucle, le plafond vaut exactement ce qu'ils déclarent :
    // c'est la promesse « aucune capacité ajoutée, aucune retirée ».
    const declares = (type: string, prefixe: (i: number) => string) => {
      const cles = new Set(((BLOCK_DEFS as Record<string, { fields?: { key: string }[] }>)[type]?.fields ?? []).map(f => f.key))
      let n = 0
      for (let i = 1; i <= 60; i++) if (cles.has(prefixe(i))) n = i
      return n
    }
    for (const [type, cle] of [["pricing", (i: number) => `title${i}`], ["gift_card", (i: number) => `amount${i}`],
      ["merch", (i: number) => `name${i}`], ["offer_comparison", (i: number) => `plan${i}_name`],
      ["event_access", (i: number) => `transport${i}_label`], ["journey", (i: number) => `line_${i}`],
      ["grid_section", (i: number) => `c${i}_title`]] as const)
      expect(plafondDesLignes(type), `${type} déclare ses emplacements`).toBe(declares(type, cle))

    // Et pour TOUS les autres, l'invariant plus faible mais général : un
    // plafond ne descend jamais sous ce que le bloc déclare, sinon des champs
    // déclarés deviendraient inatteignables. Au-DESSUS, ce n'est pas un défaut
    // — le rendu lit le plafond, donc les deux restent d'accord ; c'est une
    // décision de produit, et elle se prend ailleurs qu'ici.
    const PREFIXES: Record<string, (i: number) => string> = {
      testimonials: i => `name${i}`, lineup: i => `a${i}_name`, engagements: i => `e${i}`,
      avatar_row: i => `name${i}`, logo_marquee: i => `name${i}`, checklist: i => `i${i}`,
      columns_text: i => `c${i}_title`, compare_two: i => `r${i}_left`, definition_list: i => `r${i}_label`,
      anchor_nav: i => `i${i}_label`, steps_horizontal: i => `s${i}_title`, free_grid: i => `c${i}_title`,
      stack_cards: i => `c${i}_title`, icon_row: i => `i${i}_label`, faq: i => `q${i}`,
      image_mosaic: i => `img${i}`, numbered_list: i => `i${i}_title`, progress_bars: i => `b${i}_label`,
    }
    for (const [type, cle] of Object.entries(PREFIXES)) {
      const d = declares(type, cle)
      expect(d, `${type} : le préfixe doit exister, sinon le test ne prouve rien`).toBeGreaterThan(0)
      expect(plafondDesLignes(type), `${type} : plafond sous sa déclaration`).toBeGreaterThanOrEqual(d)
    }
  })

  it("un bloc vide reste vide des deux côtés", () => {
    for (const { type, rendu } of LES_DEUX_COTES) {
      if (type === "event_access") continue // il publie aussi sur une adresse seule
      expect(hasPublishableContent(type, {}), type).toBe(false)
      expect(rendu({}), type).toBe(0)
    }
  })
})

describe("garde de classe : le détecteur ne balaie plus un cadre à lui", () => {
  it("aucun balayage indexé ne pose son propre plafond", () => {
    const src = lire("blockEmptyState.ts")
    expect(src, "le cadre vient du rendu").toContain("for (let i = 1; i <= plafondDesLignes(type); i++)")
    expect(src, "plus de nombre posé ici").not.toMatch(/function anyIndexed\([^)]*max\s*=\s*\d+/)
    // Chaque appel nomme son bloc : sans cela, il n'y a pas de cadre à lire.
    const appels = [...src.matchAll(/anyIndexed\(c, ("?)([a-z0-9_]*)\1?,/g)]
    // Dix-huit depuis le lot v154 : dix-sept détecteurs sont devenus des appels
    // au modèle, qui balaie lui-même avec le même plafond.
    expect(appels.length, "des détecteurs à emplacements répétés").toBeGreaterThan(15)
    for (const a of appels) expect(a[1], `anyIndexed sans type : ${a[0]}`).toBe('"')
  })

  it("chaque type nommé dans un balayage est un vrai bloc du catalogue", () => {
    const src = lire("blockEmptyState.ts")
    const types = [...src.matchAll(/anyIndexed\(c, "([a-z0-9_]+)"/g)].map(m => m[1])
    const inconnus = types.filter(t => !(t in BLOCK_DEFS))
    expect(inconnus, "un détecteur qui nomme un bloc inexistant lirait le plafond par défaut").toEqual([])
    // …et il nomme bien SON bloc, pas un autre.
    for (const m of src.matchAll(/^\s*([a-z0-9_]+):\s+c => .*?anyIndexed\(c, "([a-z0-9_]+)"/gm))
      expect(m[2], `le détecteur de ${m[1]}`).toBe(m[1])
  })

  it("le balayage voit bien les détecteurs — sinon il ne prouve rien", () => {
    expect(EMPTY_STATE_BLOCK_TYPES.length, "des blocs qui disparaissent en ligne s'ils sont vides").toBeGreaterThan(40)
    // Les neuf du relevé sont ceux dont le plafond est sous le défaut.
    const serres = EMPTY_STATE_BLOCK_TYPES.filter(t => plafondDesLignes(t) < PLAFOND_PAR_DEFAUT)
    // Réancré au lot v166 : douze détecteurs sont arrivés, et cinq d'entre eux
    // ont un plafond serré. Épingler la liste, c'était épingler un moment ; ce
    // qui compte est que chaque bloc de cette liste ait VRAIMENT un plafond sous
    // le défaut, et qu'ils soient nombreux — pas lesquels exactement.
    for (const t of serres) expect(plafondDesLignes(t), t).toBeLessThan(PLAFOND_PAR_DEFAUT)
    for (const t of ["avatar_row", "engagements", "event_access", "gift_card", "grid_section",
                     "journey", "lineup", "logo_marquee", "menu_tabs", "merch", "testimonials"])
      expect(serres, `${t} était déjà serré au relevé`).toContain(t)
    // `gift_card` est arrivé au lot v152 et n'est pas interrogé emplacement par
    // emplacement : sa règle de publication n'est PAS par emplacement — la page
    // demande un titre ou le PREMIER montant, pas n'importe lequel. C'est le
    // balayage exécuté du lot v152 qui le couvre, champ par champ.
    // `gift_card` et `menu_tabs` ne sont pas interrogés emplacement par
    // emplacement : leur règle de publication n'est PAS par emplacement (un
    // titre, une catégorie, ou le PREMIER montant suffisent). C'est le balayage
    // exécuté du lot v152 qui les couvre, champ par champ.
    expect(LES_DEUX_COTES.map(x => x.type).sort(), "les autres sont interrogés des deux côtés")
      .toEqual(serres.filter(t => t !== "gift_card" && t !== "menu_tabs").sort())
    // Le reste garde le défaut, et c'est bien ce que leur rendu applique.
    expect(PLAFOND_DES_LIGNES["values"], "un bloc au plafond de droit commun").toBeUndefined()
    expect(plafondDesLignes("values")).toBe(PLAFOND_PAR_DEFAUT)
  })
})
