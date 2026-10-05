import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  METIER_BY_USAGE, MODELE_BY_USAGE, SECTEUR_PAR_MODELE, SECTEURS,
  safeModele, creerUrl, creerUrlModele, creerUrlSecteur,
} from "./entry"
import { PAGE_TEMPLATES } from "../dashboard/builder/page-templates"
import { VERTICAL_ORDER } from "../qr-code/verticals"

const read = (p: string) => readFileSync(join(__dirname, p), "utf8")
const CLES = PAGE_TEMPLATES.map(t => t.key)

// ═══════════════════════════════════════════════════════════════════════════════
// LE CHOIX DU VISITEUR DOIT LUI SURVIVRE (Q04, Q05).
//
// Q04 — Sur /examples/resto_bar, un visiteur regarde « Le Bistrot Parisien », puis
// clique « Utiliser ». Il atterrissait sur /creer?metier=Bar : une galerie de 48
// cartes, à lui de retrouver celle qu'il venait de choisir. Seul le RAYON voyageait.
//
// Q05 — Les pages par usage envoyaient parfois dans un rayon sans rapport :
// « QR code artisan » et « QR code garage » menaient chez les consultants alors que
// le rayon « Artisan & Services » existe ; « QR code association » n'était pas
// cartographié du tout ; hôtel et camping tombaient chez les restaurateurs.
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q04 — le modèle choisi voyage avec le visiteur", () => {
  it("« Utiliser » porte le modèle ET le rayon", () => {
    expect(creerUrlModele("resto_bar", "Bar")).toBe("/creer?modele=resto_bar&metier=Bar")
    expect(creerUrlModele("studio_coffee", "Cafe")).toBe("/creer?modele=studio_coffee&metier=Cafe")
  })

  it("sans rayon connu, le modèle suffit", () => {
    expect(creerUrlModele("asso_ong", "Inconnu")).toBe("/creer?modele=asso_ong")
    expect(creerUrlModele("asso_ong")).toBe("/creer?modele=asso_ong")
  })

  it("un identifiant irrecevable retombe sur le rayon, jamais sur une erreur", () => {
    for (const mauvais of ["", null, undefined, "MAJUSCULES", "avec-tiret", "a", "x".repeat(41), "<script>", "../../etc"]) {
      expect(creerUrlModele(mauvais as any, "Bar"), String(mauvais)).toBe("/creer?metier=Bar")
      expect(creerUrlModele(mauvais as any), String(mauvais)).toBe("/creer")
    }
  })

  it("`safeModele` ne laisse passer qu'une forme d'identifiant", () => {
    expect(safeModele("resto_bar")).toBe("resto_bar")
    expect(safeModele("  studio_gite  ")).toBe("studio_gite")
    for (const v of ["", null, undefined, "Resto", "resto-bar", "1resto", "a", "<script>"]) {
      expect(safeModele(v as any), String(v)).toBe("")
    }
  })

  it("les exemples publics mènent tous à un modèle qui existe vraiment", () => {
    for (const k of CLES) {
      expect(safeModele(k), `${k} n'a pas une forme d'identifiant transportable`).toBe(k)
      expect(SECTEUR_PAR_MODELE[k], `${k} n'a pas de rayon de repli`).toBeTruthy()
      expect(SECTEURS, `le rayon de ${k} n'existe pas`).toContain(SECTEUR_PAR_MODELE[k])
    }
    expect(CLES.length).toBeGreaterThanOrEqual(34)
  })

  it("les deux écrans d'exemples emploient ce lien, pas l'ancien", () => {
    for (const f of ["../examples/page.tsx", "../examples/[modele]/DemoModele.tsx"]) {
      const src = read(f)
      expect(src, `${f} : le modèle ne voyage pas`).toContain("creerUrlModele(")
      expect(src, `${f} : l'ancien lien par rayon est resté`).not.toContain("creerUrlSecteur(SECTEUR_PAR_MODELE")
    }
  })

  it("les anciens liens par rayon continuent de fonctionner", () => {
    expect(creerUrlSecteur("Bar")).toBe("/creer?metier=Bar")
    expect(creerUrl("restaurant")).toBe("/creer?metier=Restaurant")
    expect(creerUrl()).toBe("/creer")
  })
})

describe("Q04 — un paramètre d'URL n'ouvre aucune porte", () => {
  const galerie = read("../dashboard/templates/page.tsx")

  it("la galerie valide la FORME reçue avant d'en faire quoi que ce soit", () => {
    expect(galerie).toContain('const k = safeModele(q.get("modele"))')
  })

  it("elle vérifie l'EXISTENCE contre son propre catalogue, et se tait sinon", () => {
    expect(galerie).toContain("const t = TEMPLATES.find((x: any) => x.id === demande)")
    expect(galerie).toContain("if (!t) return")
  })

  it("elle applique le même contrôle de forfait qu'un clic sur la carte", () => {
    // La carte : `if (locked) { router.push("/upgrade?reason=template"); return }`
    // Le lien : le même refus, par le chemin habituel (`planRequis`).
    expect(galerie).toContain("if (!canUse(t.plan)) { planRequis(t.plan); return }")
  })

  it("elle attend de connaître le forfait avant d'ouvrir", () => {
    expect(galerie).toContain("if (!demande || !planConnu || demandeFaite.current) return")
    expect(galerie, "le forfait n'est jamais déclaré connu").toContain("setPlanConnu(true)")
  })

  it("le rayon reçu reste un ordre d'affichage, pas un filtre", () => {
    // Règle antérieure, à ne pas casser : filtrer sur le rayon ferait passer le
    // catalogue pour vide (« Restaurant » ne compte qu'un modèle sur 48).
    expect(galerie).not.toContain("setActiveMetier(m)")
  })
})

describe("Q05 — chaque page par usage mène là où elle promet", () => {
  it("artisan et garage vont chez les artisans, pas chez les consultants", () => {
    expect(METIER_BY_USAGE["artisan"]).toBe("Artisan")
    expect(METIER_BY_USAGE["garage"]).toBe("Artisan")
    expect(creerUrl("artisan")).toBe("/creer?metier=Artisan")
    expect(creerUrl("garage")).toBe("/creer?metier=Artisan")
  })

  it("association a désormais un rayon — il existait, il n'était pas relié", () => {
    expect(METIER_BY_USAGE["association"]).toBe("Association")
    expect(creerUrl("association")).toBe("/creer?metier=Association")
  })

  it("hôtel et camping ouvrent le gîte, et non la carte d'un restaurant", () => {
    expect(MODELE_BY_USAGE["hotel"]).toBe("studio_gite")
    expect(MODELE_BY_USAGE["camping"]).toBe("studio_gite")
    expect(creerUrl("hotel")).toBe("/creer?modele=studio_gite&metier=Immobilier")
    expect(creerUrl("camping")).toBe("/creer?modele=studio_gite&metier=Immobilier")
  })

  it("le modèle désigné par un usage existe dans la bibliothèque", () => {
    for (const [usage, cle] of Object.entries(MODELE_BY_USAGE)) {
      expect(CLES, `${usage} désigne « ${cle} », qui n'existe pas`).toContain(cle)
      expect(VERTICAL_ORDER, `${usage} n'a pas de page`).toContain(usage as any)
    }
  })

  it("le rayon accompagne toujours le modèle : il reste de quoi atterrir", () => {
    for (const usage of Object.keys(MODELE_BY_USAGE)) {
      expect(METIER_BY_USAGE[usage], `${usage} porte un modèle sans rayon de repli`).toBeTruthy()
    }
  })

  it("le parrainage et le lien saisi survivent au modèle", () => {
    expect(creerUrl("hotel", "parrain1")).toBe("/creer?modele=studio_gite&metier=Immobilier&ref=parrain1")
    expect(creerUrl("hotel", null, "https://monhotel.fr/"))
      .toBe("/creer?modele=studio_gite&metier=Immobilier&lien=https%3A%2F%2Fmonhotel.fr%2F")
  })

  it("le Wi-Fi garde sa destination dédiée — on n'y touche pas", () => {
    // Constat de l'audit : cette page-là menait déjà au bon endroit.
    expect(METIER_BY_USAGE["wifi"]).toBeUndefined()
    expect(MODELE_BY_USAGE["wifi"]).toBeUndefined()
    expect(read("../qr-code/[usage]/page.tsx")).toContain("const essaiHref = creerUrl(v.slug)")
  })

  it("les usages transversaux restent sans modèle imposé", () => {
    // Avis Google, WhatsApp, SMS, PDF, paiement : rien n'y dit le métier. Un
    // modèle choisi à leur place serait une invention, pas une aide.
    for (const u of ["avis-google", "whatsapp", "sms", "pdf", "paiement"]) {
      expect(MODELE_BY_USAGE[u], `${u} ne devrait imposer aucun modèle`).toBeUndefined()
      expect(creerUrl(u)).toBe("/creer")
    }
  })
})
