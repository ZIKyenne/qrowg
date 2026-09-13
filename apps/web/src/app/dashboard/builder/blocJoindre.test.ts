import { describe, it, expect } from "vitest"
import { peutJoindre, positionDuBouton, avecMoyenDeJoindre, BLOC_APPEL, type BlocSimple } from "./blocJoindre"
import { hasPublishableContent } from "./blockEmptyState"

describe("une page doit permettre de joindre le commerce", () => {
  it("un modèle qui n'offre rien est complété", () => {
    const avant = [{ type: "profile" }, { type: "menu_section" }, { type: "social_links" }]
    expect(peutJoindre(avant)).toBe(false)
    const apres = avecMoyenDeJoindre(avant)
    expect(peutJoindre(apres)).toBe(true)
    expect(apres).toHaveLength(4)
  })
  it("un modèle qui en offre déjà un n'est pas touché", () => {
    for (const t of ["multi_contact", "contact_form", "quick_contact", "whatsapp_button"]) {
      const b = [{ type: "profile" }, { type: t }]
      expect(avecMoyenDeJoindre(b), t).toEqual(b)
    }
  })
  it("le bouton se place après l'identité, pas avant : on sait chez qui on est", () => {
    expect(positionDuBouton([{ type: "profile" }, { type: "menu_section" }])).toBe(1)
    expect(positionDuBouton([{ type: "overlay_card" }, { type: "marquee_text" }])).toBe(1)
    expect(positionDuBouton([{ type: "profile" }, { type: "bio" }, { type: "pricing" }])).toBe(2)
    expect(positionDuBouton([{ type: "menu_section" }])).toBe(0)
    const b = avecMoyenDeJoindre([{ type: "profile" }, { type: "menu_section" }])
    expect(b[1].type).toBe("call_button")
  })
})

describe("on donne la place, jamais le numéro", () => {
  it("le bouton arrive sans téléphone — donc annoncé vide, pas publié tel quel", () => {
    expect(BLOC_APPEL.content!.phone).toBe("")
    expect(hasPublishableContent("call_button", BLOC_APPEL.content!)).toBe(false)
  })
  it("il porte quand même son libellé : c'est une place nommée", () => {
    expect(BLOC_APPEL.content!.label).toBe("Appeler")
  })
  it("chaque modèle reçoit SA copie du contenu, pas une référence partagée", () => {
    const a = avecMoyenDeJoindre([{ type: "profile" } as BlocSimple])
    const b = avecMoyenDeJoindre([{ type: "profile" } as BlocSimple])
    ;(a[1].content as any).phone = "+33 1 00 00 00 00"
    expect((b[1].content as any).phone).toBe("")
    expect(BLOC_APPEL.content!.phone).toBe("")
  })
})
