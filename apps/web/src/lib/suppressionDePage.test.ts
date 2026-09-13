// La suppression qui emporte les QR déjà collés — garde de classe.
//
// Relevé du 13 septembre. Ce que le produit faisait confirmer :
//
//   « Vous êtes sur le point de supprimer « X ». Cette action supprimera aussi
//     les blocs, LE QR CODE et toutes les données analytics associées. »
//
// Et ce que la base fait, depuis le schéma initial, sur `qr_codes` :
//
//     page_id uuid not null references public.pages(id) on delete cascade
//
// « le QR code », au singulier, sans un chiffre — alors qu'une page porte autant
// de QR qu'elle a de supports (le lot v83 vient d'ouvrir ce chemin), que ces
// codes sont collés sur des tables et distribués en flyers, et que `short_code`
// étant unique, aucun nouveau QR ne peut reprendre celui qu'on détruit.
//
// La classe : avant de détruire quelque chose qui existe DEHORS, le produit dit
// quoi, combien, et que ce n'est pas rattrapable — et il demande mieux qu'un
// clic.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  consequencesDeSuppression, phraseCodesImprimes, exigeConfirmationEcrite,
  confirmationAttendue, confirmationValide, nomDuSupport,
} from "./suppressionDePage"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

const support = (label: string | null, code = "abc123") => ({ label, short_code: code })

describe("ce qui disparaît est nommé et chiffré", () => {
  it("nomme les supports au lieu de dire « le QR code »", () => {
    const l = consequencesDeSuppression({ supports: [support("Vitrine"), support("Table 4")] })
    expect(l[0]).toBe("2 QR imprimables : Vitrine, Table 4")
  })

  it("au singulier quand il n'y en a qu'un", () => {
    expect(consequencesDeSuppression({ supports: [support("Vitrine")] })[0]).toBe("1 QR imprimable : Vitrine")
  })

  it("ne déborde pas quand il y en a beaucoup", () => {
    const many = ["a", "b", "c", "d", "e", "f"].map(n => support(n))
    const l = consequencesDeSuppression({ supports: many })[0]
    expect(l).toContain("6 QR imprimables")
    expect(l).toContain("et 2 de plus")
  })

  it("retombe sur le code quand le support n'a pas de nom", () => {
    expect(nomDuSupport({ label: "  ", short_code: "xk29" })).toBe("code xk29")
    expect(nomDuSupport({})).toBe("QR sans nom")
  })

  it("chiffre l'historique, et ne parle pas de ce qui n'existe pas", () => {
    const l = consequencesDeSuppression({ supports: [], scans: 1420, vues: 3800, messages: 0 })
    // `toLocaleString("fr-FR")` sépare les milliers par une espace insécable
    // étroite : on vérifie le nombre, pas le caractère exact.
    expect(l.some(x => /1\s420\sscans/.test(x)), l.join(" | ")).toBe(true)
    expect(l.some(x => x.includes("vue"))).toBe(true)
    expect(l.some(x => x.includes("message")), "0 message ne doit pas être annoncé").toBe(false)
  })

  it("une page vide n'affiche aucune ligne alarmante", () => {
    expect(consequencesDeSuppression({ supports: [], scans: 0, vues: 0, messages: 0 })).toEqual([])
  })
})

describe("la phrase qui manquait : ces codes sont dehors", () => {
  it("dit que c'est définitif et qu'il faudra réimprimer", () => {
    for (const n of [1, 3]) {
      const p = phraseCodesImprimes(n)!
      expect(p, String(n)).toContain("définitivement")
      expect(p, String(n)).toContain("réimprimer")
      expect(p, String(n)).toMatch(/collé|distribué/)
    }
    expect(phraseCodesImprimes(1)).toContain("Ce code")
    expect(phraseCodesImprimes(3)).toContain("Ces codes")
  })

  it("se tait quand il n'y a aucun support", () => {
    expect(phraseCodesImprimes(0)).toBeNull()
    expect(phraseCodesImprimes(-2)).toBeNull()
  })
})

describe("écrire le nom, quand la perte est irrattrapable", () => {
  it("exigé dès qu'un support imprimé ou un historique existe", () => {
    expect(exigeConfirmationEcrite({ supports: [support("Vitrine")] })).toBe(true)
    expect(exigeConfirmationEcrite({ supports: [], scans: 12 })).toBe(true)
  })

  it("pas exigé pour un brouillon sans rien — on n'impose pas une friction inutile", () => {
    expect(exigeConfirmationEcrite({ supports: [], scans: 0, vues: 900, messages: 0 })).toBe(false)
    expect(exigeConfirmationEcrite({ supports: [] })).toBe(false)
  })

  it("la saisie pardonne la casse et les espaces, rien d'autre", () => {
    expect(confirmationValide("  le comptoir ", "Le Comptoir")).toBe(true)
    expect(confirmationValide("Le Comptoir", "Le Comptoir")).toBe(true)
    expect(confirmationValide("Le Comptoir 2", "Le Comptoir")).toBe(false)
    expect(confirmationValide("", "Le Comptoir")).toBe(false)
  })

  it("une page sans titre reste confirmable", () => {
    expect(confirmationAttendue("   ")).toBe("SUPPRIMER")
    expect(confirmationValide("supprimer", null)).toBe(true)
  })
})

describe("l'écran de suppression a bien changé", () => {
  const dash = lire("app/dashboard/DashboardClient.tsx")

  it("plus de « le QR code » au singulier sans chiffre", () => {
    expect(dash).not.toContain("les blocs, le QR code et toutes les données analytics")
  })

  it("il lit ce qui disparaîtrait AVANT de le faire disparaître", () => {
    expect(dash).toContain('from("qr_codes").select("label, short_code")')
    expect(dash).toContain("consequencesDeSuppression(")
    expect(dash).toContain("phraseCodesImprimes(")
  })

  it("et le bouton reste bloqué tant que le nom n'est pas écrit", () => {
    expect(dash).toContain("exigeConfirmationEcrite(")
    expect(dash).toContain("confirmationValide(")
    expect(dash, "le bouton doit dépendre de la confirmation").toMatch(/disabled=\{!pret\}/)
  })

  it("la cascade qu'on annonce est bien celle du schéma", () => {
    const schema = fs.readFileSync(path.join(SRC, "../../../supabase/migrations/20260521200846_initial_schema.sql"), "utf8")
    const bloc = schema.slice(schema.indexOf("create table public.qr_codes"), schema.indexOf("create table public.scans"))
    expect(bloc, "qr_codes ne serait plus supprimé en cascade").toContain("references public.pages(id) on delete cascade")
    expect(bloc, "le code ne serait plus unique — la phrase de réimpression tomberait").toContain("short_code      text unique not null")
  })
})
