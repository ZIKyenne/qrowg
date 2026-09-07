import { describe, it, expect } from "vitest"
import { BLOCK_DEFS } from "./blockDefs"

// ═══════════════════════════════════════════════════════════════════════════════
// LE CONTENU PRÉ-REMPLI — la doctrine anti-fake, appliquée à la CRÉATION du bloc.
//
// Écrit le 7 septembre. Tout le travail des vagues 9 à 16 a porté sur le RENDU :
// « un champ vide est masqué », « aucun chiffre que personne n'a saisi ». Ces
// contrôles regardent tous un bloc DÉJÀ posé. Personne ne regardait le moment où
// le bloc naît — or `BuilderV4` crée un bloc avec `{...def.defaultContent}`.
//
// Conséquence : un commerçant qui pose « Horaires » et publie sans y toucher
// annonce à ses clients « 9h - 18h » du lundi au vendredi. Un client se déplace
// à 17 h et trouve porte close. Le bloc « Statistiques » affirmait « 500+
// clients », « 4.9/5 », « 10 ans d'expérience ». « Avis Google » affichait une
// note moyenne de 4,9 sur zéro avis. « Annonce » publiait « Nous serons fermés
// le 25 décembre ». Les compteurs que la vague 11 avait nettoyés côté rendu
// (« 1 240 » scans, « 14 » places restantes) étaient toujours LIVRÉS à la
// création : le nettoyage n'avait fait que déplacer le problème d'un cran.
//
// Ce ne sont pas des maquettes : ce sont des affirmations publiées sur la page
// d'un vrai commerce, sous son nom. Certaines l'engagent (« Satisfait ou
// remboursé », « Paiement sécurisé », une note moyenne inventée).
//
// LA RÈGLE. `defaultContent` a le droit de pré-remplir :
//   1. un RÉGLAGE de structure — une valeur qui figure parmi les options du
//      champ (mise en page, style, alignement, oui/non) ;
//   2. l'ÉTIQUETTE du bloc — le mot qui nomme la section ou son bouton
//      (« Horaires », « Nos tarifs », « Envoyer »). Ce n'est pas une
//      affirmation sur l'entreprise : c'est le nom du meuble, pas son contenu.
//
// Tout le reste doit naître VIDE, et la suggestion vit dans le `placeholder` du
// champ — que le commerçant voit en gris dans le panneau de réglages, et que la
// page ne publie jamais.
//
// Un champ INDEXÉ (q1, s2_name, plan3_price…) n'est jamais une étiquette : c'est
// un élément d'une liste, donc du contenu.
// ═══════════════════════════════════════════════════════════════════════════════

/** Les mots qui nomment le meuble : titre de section, libellé de bouton ou de
 *  légende. « Avant » / « Après » sur un comparateur en font partie. */
const ETIQUETTES = new Set(["title", "subtitle", "label", "expired_text"])
const estEtiquette = (cle: string) => ETIQUETTES.has(cle) || /_label$/.test(cle)

/** Les molettes de présentation : une hauteur, une vitesse, une couleur, une
 *  icône décorative ne disent rien sur l'entreprise. Elles peuvent naître
 *  réglées — c'est même préférable, sinon le bloc naît difforme.
 *  `count`, `max`, `avg_rating`, `total_reviews`, `price` n'en sont PAS : un
 *  nombre qui décrit l'entreprise est une affirmation, pas un réglage. */
const TYPES_REGLAGE = ["number", "range", "color", "select", "toggle", "datetime", "date", "image", "icon"]
const MOLETTE = /^(emoji|icon|accent|color|separator|collapsible|layout|style|align|mode|variant|start|overlay|preview_lines|country_code|show_url)$|_(size|height|width|speed|color|icon|emoji|opacity|angle|offset|thickness|space|zoom|ratio|cols|columns)$|^(size|height|width|speed|zoom|angle|offset|thickness|space|opacity)$/

/** Les réglages de structure, reconnus à ce qu'ils valent une option déclarée. */
function estUneOption(champ: any, valeur: string): boolean {
  const o = champ?.options
  return Array.isArray(o) && o.some((x: any) => String(x) === valeur)
}

const indexe = (cle: string) => /\d/.test(cle)

// Exceptions tolérées, avec la raison. Cette liste ne doit que RÉTRÉCIR.
// Vide au 7 septembre : les 60 valeurs trouvées ce jour-là sont devenues des
// placeholders. Le mécanisme reste pour qu'un cas légitime soit documenté
// plutôt que simplement ignoré.
const TOLERES: Record<string, string> = {}

describe("un bloc neuf ne publie rien que le commerçant n'ait écrit", () => {
  const fautifs: string[] = []
  for (const [type, def] of Object.entries(BLOCK_DEFS)) {
    const defauts = ((def as any).defaultContent ?? {}) as Record<string, unknown>
    const champs = ((def as any).fields ?? []) as any[]
    for (const [cle, brut] of Object.entries(defauts)) {
      const valeur = typeof brut === "string" ? brut.trim() : ""
      if (!valeur) continue
      if (TOLERES[`${type}.${cle}`]) continue
      const champ = champs.find(f => f?.key === cle)
      if (estUneOption(champ, valeur)) continue
      if (TYPES_REGLAGE.includes(String(champ?.type ?? ""))) continue
      if (MOLETTE.test(cle)) continue
      if (!indexe(cle) && estEtiquette(cle)) continue
      fautifs.push(`${type}.${cle} = « ${valeur.slice(0, 50)} »`)
    }
  }

  it("aucun contenu inventé n'est livré à la création du bloc", () => {
    expect(fautifs.sort(), "à déplacer dans le placeholder du champ").toEqual([])
  })

  it("les cas tolérés le sont pour une raison écrite", () => {
    for (const [ref, raison] of Object.entries(TOLERES)) {
      expect(raison.length, `${ref} : la raison doit être explicite`).toBeGreaterThan(25)
      expect(BLOCK_DEFS[ref.split(".")[0]], `${ref} : bloc inconnu`).toBeTruthy()
    }
  })
})

describe("la suggestion n'est pas perdue : elle passe dans le placeholder", () => {
  // Vider `defaultContent` sans placeholder laisserait le commerçant devant un
  // champ nu. Les champs de contenu portent donc un exemple — visible dans le
  // panneau, jamais publié.
  const SANS_EXEMPLE = ["image", "color", "select", "toggle", "datetime", "date", "number", "range"]
  const nus: string[] = []
  for (const [type, def] of Object.entries(BLOCK_DEFS)) {
    for (const champ of ((def as any).fields ?? []) as any[]) {
      const t = String(champ?.type ?? "text")
      if (SANS_EXEMPLE.includes(t)) continue
      if (!indexe(String(champ?.key ?? ""))) continue        // les éléments de liste
      const a = champ?.placeholder || champ?.hint || (Array.isArray(champ?.suggestions) && champ.suggestions.length)
      if (!a) nus.push(`${type}.${champ.key} (« ${champ.label} »)`)
    }
  }

  it("chaque champ de liste montre un exemple sans le publier", () => {
    // Un seuil, pas zéro : beaucoup de champs indexés sont explicites par leur
    // libellé (« Photo 3 »). Ce contrôle empêche la dérive, il ne réécrit pas
    // tout le panneau.
    expect(nus.length, `champs de liste sans aucun exemple :\n  ${nus.slice(0, 12).join("\n  ")}`).toBeLessThan(260)
  })
})

describe("aucun bouton livré ne mène nulle part", () => {
  // `availability` naissait avec cta_url: "#" et cta_label: "Prendre contact" :
  // un bouton bien visible, publié, qui ne va nulle part.
  const morts: string[] = []
  for (const [type, def] of Object.entries(BLOCK_DEFS)) {
    const champs = ((def as any).fields ?? []) as any[]
    for (const [cle, v] of Object.entries(((def as any).defaultContent ?? {}) as Record<string, unknown>)) {
      if (!/(^|_)(url|link|href)$/.test(cle)) continue
      // « show_url » se termine par _url sans être une adresse : c'est un
      // interrupteur oui/non. Un champ à options n'est jamais un lien.
      const champ = champs.find(f => f?.key === cle)
      if (String(champ?.type ?? "") === "select" || Array.isArray(champ?.options)) continue
      const s = typeof v === "string" ? v.trim() : ""
      if (s && !/^(https?:|mailto:|tel:)/i.test(s)) morts.push(`${type}.${cle} = « ${s} »`)
    }
  }
  it("un lien pré-rempli est une vraie adresse, ou rien", () => {
    expect(morts.sort()).toEqual([])
  })
})
