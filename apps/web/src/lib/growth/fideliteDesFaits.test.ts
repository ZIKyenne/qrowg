import { describe, it, expect } from "vitest"
import { PAGE_TEMPLATES } from "@/app/dashboard/builder/page-templates"
import { BLOCK_DEFS } from "@/app/dashboard/builder/blockDefs"
import { genererPageRestaurant, modelePour } from "./generateurRestaurant"
import {
  type ProfilRestaurant, profilVide, sourcer, assezRichePourUnePage,
  champsAffichables, champsAVerifier, affichable,
} from "./profilEtablissement"

// fideliteDesFaits — la garde du moteur de croissance.
//
// ── Ce qu'elle existe pour empêcher ────────────────────────────────────────
//
// Les modèles de page de QRowg contiennent du contenu de démonstration
// réaliste : « Le Bistrot Parisien », « Entrecôte 300g — 32€ », « Foie gras
// poêlé — 18€ ». Dans la galerie, c'est ce qui rend un modèle compréhensible.
// Dans une proposition envoyée à un restaurateur, ce serait une carte inventée
// publiée sous son enseigne.
//
// Ce fichier vérifie qu'aucune de ces valeurs ne peut traverser le générateur,
// et il le vérifie en les RELISANT dans les modèles plutôt qu'en recopiant une
// liste : le jour où quelqu'un ajoute « Magret de canard 26€ » au modèle
// bistrot, la garde le saura sans qu'on la mette à jour.

const SOURCE = {
  source: "https://exemple-restaurant.test/contact",
  observeLe: "2026-11-04T10:00:00.000Z",
  certitude: "confirme" as const,
}

function profilDeTest(): ProfilRestaurant {
  const p = profilVide("prospect-test-1")
  p.nom = sourcer("Chez Mariette", SOURCE)
  p.ville = sourcer("Châlons-en-Champagne", SOURCE)
  p.adresse = sourcer("12 rue de Marne, 51000 Châlons-en-Champagne", SOURCE)
  p.horaires = sourcer([
    { jour: "tue", heures: "12h–14h / 19h–22h" },
    { jour: "wed", heures: "12h–14h / 19h–22h" },
    { jour: "sat", heures: "19h–22h30" },
  ], SOURCE)
  return p
}

/** Toutes les valeurs de démonstration des trois modèles restaurant. */
function valeursDeDemonstration(): string[] {
  const out: string[] = []
  for (const cle of ["resto_bistrot", "resto_fastfood", "resto_bar"]) {
    const t = PAGE_TEMPLATES.find(x => x.key === cle)
    if (!t) continue
    for (const b of t.blocks) {
      for (const [k, v] of Object.entries(b.content as Record<string, unknown>)) {
        // Les clés de présentation sont autorisées à passer : un intitulé de
        // section n'affirme rien sur l'établissement.
        if (k === "category") continue   // seule clé de présentation permise
        // Une valeur IDENTIQUE au contenu neutre du bloc n'est pas une démo :
        // « Horaires » est le titre que le produit met par défaut à ce bloc
        // pour tout le monde. L'exclure ici évite d'accuser le générateur de
        // recopier une démo alors qu'il recopie un défaut du produit.
        const neutre = (BLOCK_DEFS[b.type]?.defaultContent ?? {}) as Record<string, unknown>
        if (neutre[k] === v) continue
        if (typeof v === "string" && v.trim().length > 2) out.push(v)
      }
    }
  }
  return [...new Set(out)]
}

/** Toutes les chaînes écrites dans la page générée. */
function textesDe(page: NonNullable<ReturnType<typeof genererPageRestaurant>>): string[] {
  const out: string[] = []
  for (const b of page.blocs) {
    for (const v of Object.values(b.content)) if (typeof v === "string" && v.trim()) out.push(v)
  }
  return out
}

describe("le générateur n'invente rien", () => {
  it("aucune valeur de démonstration des modèles ne se retrouve dans la page", () => {
    // LE test de ce fichier. « Entrecôte 300g » et « 32€ » appartiennent à une
    // vitrine, pas à Chez Mariette.
    const page = genererPageRestaurant(profilDeTest())!
    expect(page).not.toBeNull()
    const demos = valeursDeDemonstration()
    expect(demos.length, "le relevé des démos doit voir quelque chose").toBeGreaterThan(20)

    const textes = textesDe(page)
    const fuites = textes.filter(t => demos.includes(t))
    expect(fuites, `valeurs de démonstration passées dans la page :\n${fuites.join("\n")}`).toEqual([])
  })

  it("chaque texte de la page vient du profil, ou d'une clé de présentation", () => {
    const profil = profilDeTest()
    const page = genererPageRestaurant(profil)!
    const duProfil = [
      "Chez Mariette", "Châlons-en-Champagne",
      "12 rue de Marne, 51000 Châlons-en-Champagne",
      "12h–14h / 19h–22h", "19h–22h30",
    ]
    const presentation = new Set<string>()
    for (const b of PAGE_TEMPLATES.find(t => t.key === page.modeleSource)!.blocks)
      for (const [k, v] of Object.entries(b.content as Record<string, unknown>))
        if (typeof v === "string" && k === "category") presentation.add(v)
    // Les valeurs neutres de `defaultContent` sont également permises.
    for (const b of page.blocs)
      for (const v of Object.values(BLOCK_DEFS[b.type]?.defaultContent ?? {}))
        if (typeof v === "string" && v.trim()) presentation.add(v)

    const inconnus = textesDe(page).filter(t => !duProfil.includes(t) && !presentation.has(t) && t !== "Jour par jour" && t !== "Notre carte")
    expect(inconnus, `textes sans origine :\n${inconnus.join("\n")}`).toEqual([])
  })

  it("un plat sans prix relevé ne reçoit pas de prix", () => {
    const p = profilDeTest()
    p.plats = sourcer([{ nom: "Suprême de volaille", prix: null, description: null }], SOURCE)
    const page = genererPageRestaurant(p)!
    const menu = page.blocs.find(b => b.type === "menu_section")!
    expect(menu.content.item1_name).toBe("Suprême de volaille")
    expect(menu.content.item1_price, "un prix inventé est pire qu'un prix absent").toBe("")
    expect(page.aCompleter).toContain("les prix manquants de la carte")
  })

  it("aucun avis n'est écrit à la place d'un client", () => {
    const page = genererPageRestaurant(profilDeTest())!
    const avis = page.blocs.find(b => b.type === "testimonials")
    if (!avis) return
    for (const [k, v] of Object.entries(avis.content)) {
      if (/^(name|text|stars)\d+$/.test(k)) expect(v, `${k} doit rester vide`).toBe("")
    }
  })

  it("aucun badge de distinction n'est décerné", () => {
    // Le modèle bistrot porte « 🌟 Recommandé ». Par qui ?
    const page = genererPageRestaurant(profilDeTest())!
    const profil = page.blocs.find(b => b.type === "profile")!
    expect(profil.content.badge).toBe("")
  })
})

describe("le générateur n'utilise que de vrais blocs", () => {
  it("chaque type de bloc généré existe dans BLOCK_DEFS", () => {
    for (const genre of ["bistrot", "rapide", "bar"] as const) {
      const p = profilDeTest()
      p.genre = sourcer(genre, SOURCE)
      const page = genererPageRestaurant(p)!
      for (const b of page.blocs) {
        expect(BLOCK_DEFS[b.type], `type de bloc inconnu : ${b.type}`).toBeDefined()
      }
    }
  })

  it("chaque clé de contenu écrite existe dans le bloc correspondant", () => {
    // Une clé inventée ne planterait pas : elle serait silencieusement ignorée
    // au rendu. C'est le pire cas — la page paraît générée et le fait manque.
    const p = profilDeTest()
    p.plats = sourcer([{ nom: "Tarte fine", prix: "9€", description: "aux pommes" }], SOURCE)
    p.reservation = sourcer("https://exemple-restaurant.test/reserver", SOURCE)
    const page = genererPageRestaurant(p)!
    for (const b of page.blocs) {
      const def = BLOCK_DEFS[b.type]
      const connues = new Set([
        ...Object.keys(def.defaultContent ?? {}),
        ...(def.fields ?? []).map(f => f.key),
      ])
      // Les répéteurs numérotent leurs clés (`item1_name`, `row2_hours`) : on
      // compare donc sur la forme dénumérotée.
      const inconnues = Object.keys(b.content).filter(k => {
        if (connues.has(k)) return false
        const denombre = k.replace(/\d+/g, "N")
        return ![...connues].some(c => c.replace(/\d+/g, "N") === denombre)
      })
      expect(inconnues, `${b.type} : clés inconnues ${inconnues.join(", ")}`).toEqual([])
    }
  })

  it("le modèle de départ est bien un modèle de la bibliothèque", () => {
    const page = genererPageRestaurant(profilDeTest())!
    expect(PAGE_TEMPLATES.some(t => t.key === page.modeleSource)).toBe(true)
  })
})

describe("le seuil de richesse", () => {
  it("un profil sans nom ne produit pas de page", () => {
    const p = profilVide("x")
    p.ville = sourcer("Reims", SOURCE)
    p.adresse = sourcer("1 rue de Vesle", SOURCE)
    p.telephone = sourcer("03 26 00 00 00", SOURCE)
    expect(assezRichePourUnePage(p)).toBe(false)
    expect(genererPageRestaurant(p)).toBeNull()
  })

  it("un nom seul ne suffit pas : ce serait un modèle vierge à son enseigne", () => {
    const p = profilVide("x")
    p.nom = sourcer("Chez Mariette", SOURCE)
    expect(assezRichePourUnePage(p)).toBe(false)
    expect(genererPageRestaurant(p)).toBeNull()
  })

  it("trois faits affichables suffisent", () => {
    expect(assezRichePourUnePage(profilDeTest())).toBe(true)
    expect(genererPageRestaurant(profilDeTest())).not.toBeNull()
  })
})

describe("la certitude compte", () => {
  it("un champ « à vérifier » n'est pas affiché comme un fait", () => {
    const p = profilDeTest()
    p.telephone = sourcer("03 26 11 22 33", { ...SOURCE, certitude: "a_verifier" })
    expect(affichable(p.telephone)).toBe(false)
    expect(champsAVerifier(p)).toContain("telephone")
    expect(champsAffichables(p)).not.toContain("telephone")
  })

  it("« probable » est affichable, « a_verifier » ne l'est pas", () => {
    const p = profilVide("x")
    p.nom = sourcer("A", { ...SOURCE, certitude: "probable" })
    expect(affichable(p.nom)).toBe(true)
    p.nom = sourcer("A", { ...SOURCE, certitude: "a_verifier" })
    expect(affichable(p.nom)).toBe(false)
  })
})

describe("le choix du modèle", () => {
  it("suit le genre relevé", () => {
    expect(modelePour("rapide")).toBe("resto_fastfood")
    expect(modelePour("bar")).toBe("resto_bar")
    expect(modelePour("bistrot")).toBe("resto_bistrot")
  })

  it("sans genre connu, prend le plus neutre — pas le plus vendeur", () => {
    expect(modelePour(null)).toBe("resto_bistrot")
  })
})

describe("ce qui reste à compléter est dit, pas caché", () => {
  it("un profil sans horaires ni carte l'annonce", () => {
    const p = profilVide("x")
    p.nom = sourcer("Chez Mariette", SOURCE)
    p.ville = sourcer("Reims", SOURCE)        // ne compte pas : jamais affichée
    p.adresse = sourcer("1 rue de Vesle", SOURCE)
    p.telephone = sourcer("03 26 00 00 00", SOURCE)
    const page = genererPageRestaurant(p)!
    expect(page.aCompleter).toContain("vos horaires")
    expect(page.aCompleter).toContain("votre carte")
  })

  it("les faits utilisés sont traçables", () => {
    const page = genererPageRestaurant(profilDeTest())!
    expect(page.faitsUtilises).toContain("nom")
    expect(page.faitsUtilises).toContain("adresse")
    expect(page.faitsUtilises).toContain("horaires")
  })
})
