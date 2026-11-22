import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { codeEnClair, phraseCodeEnClair } from "./codeEnClair"
import { alertesPublication } from "./AlertesPublication"
import type { Block } from "./types"

describe("code d'accès écrit en clair (SECT-005)", () => {
  it("repère les codes de porte, de boîte à clés, d'alarme suivis de chiffres", () => {
    expect(codeEnClair({ acces: "Digicode 4521 puis 3e étage" })).toBe("Digicode 4521")
    expect(codeEnClair({ acces: "La boîte à clés est à gauche, code : 0912" })).toBe("boîte à clés 0912")
    expect(codeEnClair({ text: "Code du portail : A1234#" })).toBe("Code du portail A1234#")
    expect(codeEnClair({ text: "Code de l'alarme 7788" })).toBe("Code de l'alarme 7788")
    expect(codeEnClair({ items: [{ desc: "code porte 1984" }] })).toBe("code porte 1984")
  })

  it("se tait quand il n'y a pas de code, ou quand le code est à sa place", () => {
    expect(codeEnClair({ acces: "La clé est dans la boîte à clés, à gauche de la porte." })).toBeNull()
    expect(codeEnClair({ acces: "Le code de la boîte vous sera envoyé par SMS la veille." })).toBeNull()
    // Le champ prévu, masqué par le rendu : rien à signaler.
    expect(codeEnClair({ code_label: "Code de la boîte à clés", code: "4821" })).toBeNull()
    // Le Wi-Fi n'est pas un code d'accès : le publier est le but du bloc.
    expect(codeEnClair({ ssid: "Gite", password: "tilleuls2024" })).toBeNull()
    // Un horaire ou un prix n'est pas un code.
    expect(codeEnClair({ text: "Arrivée à partir de 1600, accès parking 2 €" })).toBeNull()
  })

  it("remonte dans les alertes de la fenêtre Publier", () => {
    const blocs = [{ id: "b1", type: "infos_sejour", visible: true, content: { title: "Votre séjour", acces: "Digicode 4521, porte de gauche" } }] as unknown as Block[]
    const textes = alertesPublication(blocs).map(a => a.texte)
    expect(textes).toContain(phraseCodeEnClair("Digicode 4521"))
  })

  it("les livrets d'accueil livrés ne déclenchent pas l'alerte (code laissé vide)", () => {
    const src = readFileSync(join(__dirname, "page-templates.ts"), "utf8")
    const acces = [...src.matchAll(/acces: "([^"]+)"/g)].map(m => m[1])
    expect(acces.length).toBeGreaterThanOrEqual(3)
    for (const a of acces) expect(codeEnClair({ acces: a }), a).toBeNull()
  })
})
