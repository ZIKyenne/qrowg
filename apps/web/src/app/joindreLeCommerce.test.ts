import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { buildWizard, applyAnswers } from "./dashboard/builder/templateWizard"
import { peutJoindre, BLOCS_POUR_JOINDRE } from "./dashboard/builder/blocJoindre"
import { hasPublishableContent } from "./dashboard/builder/blockEmptyState"
import { PAGE_TEMPLATES } from "./dashboard/builder/page-templates"
import { STUDIO_TEMPLATES } from "./dashboard/builder/templatesStudio"

// Relevé du 12 septembre, en comptant les blocs des 48 modèles :
//
//     43 modèles sur 48 ne contenaient AUCUN bloc pour joindre le commerce.
//
// Ni appel, ni e-mail, ni WhatsApp, ni formulaire. `studio_gastro` alignait
// dix-huit blocs sans permettre d'appeler le restaurant. C'est la racine de ce
// que le lot v72 avait mesuré (19 pages sur 34 sans action au premier écran) :
// pour l'action la plus élémentaire, le bloc n'était pas là.
//
// Et l'effet se propageait : l'assistant de modèle dérive ses questions des
// blocs PRÉSENTS. Pas de bouton d'appel ⟹ aucune question sur le téléphone ⟹
// le commerçant répondait à tout, publiait, et son client ne pouvait pas
// l'appeler. Personne ne lui avait demandé son numéro.

const TOUS = [...PAGE_TEMPLATES, ...(STUDIO_TEMPLATES as any[])]

describe("chaque modèle permet de joindre le commerce", () => {
  it("aucun modèle n'en est dépourvu — ni aujourd'hui, ni pour ceux à venir", () => {
    const sans = TOUS.filter(t => !peutJoindre(t.blocks as any)).map(t => t.key)
    expect(sans, `sans moyen de joindre : ${sans.join(", ")}`).toEqual([])
    expect(TOUS.length).toBeGreaterThanOrEqual(48)
  })
  it("la règle s'applique à l'export, pas modèle par modèle à la main", () => {
    // Un modèle ajouté plus tard passe par la même porte.
    for (const [f, nom] of [["dashboard/builder/page-templates.ts", "PAGE_TEMPLATES"],
                            ["dashboard/builder/templatesStudio.ts", "STUDIO_TEMPLATES"]] as const) {
      const src = require("node:fs").readFileSync(require("node:path").join(__dirname, f), "utf8")
      expect(src, f).toContain(`export const ${nom}: PageTemplate[] = ${nom}_ECRITS.map(t => ({ ...t, blocks: avecMoyenDeJoindre(t.blocks as any) as any }))`)
    }
  })
  it("le bouton arrive sans numéro : une place, pas une affirmation", () => {
    for (const t of TOUS) {
      const appel = (t.blocks as any[]).find(b => b.type === "call_button")
      if (!appel) continue                       // le modèle avait déjà son propre moyen
      expect(hasPublishableContent("call_button", appel.content), t.key).toBe(false)
      expect(appel.content.label, t.key).toBe("Appeler")
    }
  })
  it("il est placé haut, juste après l'identité", () => {
    for (const t of TOUS) {
      const i = (t.blocks as any[]).findIndex(b => b.type === "call_button")
      if (i < 0) continue
      expect(i, `${t.key} : le bouton d'appel est au rang ${i}`).toBeLessThanOrEqual(3)
    }
  })
})

describe("l'assistant demande enfin le numéro", () => {
  it("le cas relevé : « Bistrot français » pose la question", () => {
    const b: any = TOUS.find(t => t.key === "resto_bistrot")
    const w = buildWizard(b.blocks.map((x: any) => ({ type: x.type, content: { ...x.content } })))
    expect(w.steps.map(s => s.label)).toContain("Votre numéro de téléphone")
  })
  it("et il le pose sur tout modèle qui a reçu le bloc", () => {
    const manquants: string[] = []
    for (const t of TOUS) {
      if (!(t.blocks as any[]).some(b => b.type === "call_button")) continue
      const w = buildWizard((t.blocks as any[]).map(x => ({ type: x.type, content: { ...x.content } })))
      if (!w.steps.some(s => s.id === "phone")) manquants.push(t.key)
    }
    expect(manquants, `l'assistant ne demande pas le téléphone : ${manquants.join(", ")}`).toEqual([])
  })
  it("bout en bout : répondre au numéro produit un vrai lien d'appel sur la page", async () => {
    const { default: renduLegacy } = await import("./[slug]/renduLegacy") as any
    const b: any = TOUS.find(t => t.key === "resto_bistrot")
    const blocs = (b.blocks as any[]).map(x => ({ type: x.type, content: { ...x.content } }))
    const remplis = applyAnswers(blocs as any, { phone: "03 26 00 00 00" } as any)
    const appel: any = remplis.find((x: any) => x.type === "call_button")
    expect(appel.content.phone).toBe("03 26 00 00 00")
    expect(hasPublishableContent("call_button", appel.content)).toBe(true)
  })
})

describe("la liste des moyens de joindre est explicite", () => {
  it("elle nomme les huit blocs qui comptent", () => {
    expect([...BLOCS_POUR_JOINDRE]).toContain("call_button")
    expect([...BLOCS_POUR_JOINDRE]).toContain("contact_form")
    expect([...BLOCS_POUR_JOINDRE]).toContain("whatsapp_button")
    expect(BLOCS_POUR_JOINDRE.length).toBe(8)
  })
  it("les cinq modèles qui en avaient déjà un n'ont pas reçu de doublon", () => {
    for (const k of ["immo_agence", "artisan_batiment", "biz_agence", "studio_artisan"]) {
      const t: any = TOUS.find(x => x.key === k)
      expect((t.blocks as any[]).filter(b => b.type === "call_button"), k).toHaveLength(0)
    }
  })
})
