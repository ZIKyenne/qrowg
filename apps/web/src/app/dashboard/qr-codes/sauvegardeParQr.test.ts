import { describe, it, expect } from "vitest"
import { creerSauvegardeParQr, type Planificateur, type EtatDeQr } from "./sauvegardeParQr"
import { verrouDe, reglagesFermes, refusDeFormule } from "./droitsDuStudio"

// Minuteurs à la main : on avance le temps quand on veut.
function horloge() {
  let n = 0
  const file = new Map<number, () => void>()
  const p: Planificateur = { plus: (fn) => { file.set(++n, fn); return n }, annuler: id => { file.delete(id as number) } }
  return { p, toutLancer: () => { const fns = [...file.values()]; file.clear(); fns.forEach(f => f()) }, enFile: () => file.size }
}
const tick = () => new Promise(r => setTimeout(r, 0))

describe("sauvegarde automatique par QR", () => {
  it("attend le délai, puis enregistre le DERNIER réglage", async () => {
    const h = horloge(); const envois: string[] = []
    const s = creerSauvegardeParQr<string>({ enregistrer: async (id, v) => { envois.push(`${id}:${v}`) }, minuteurs: h.p })
    s.modifier("A", "rouge"); s.modifier("A", "bleu")
    expect(envois).toEqual([])
    h.toutLancer(); await tick(); await tick()
    expect(envois).toEqual(["A:bleu"])
  })
  it("changer de QR n'annule pas la modification en attente : elle part tout de suite", async () => {
    const h = horloge(); const envois: string[] = []
    const s = creerSauvegardeParQr<string>({ enregistrer: async (id, v) => { envois.push(`${id}:${v}`) }, minuteurs: h.p })
    s.modifier("A", "rouge")
    s.modifier("B", "vert")           // A n'a pas attendu son délai
    await tick(); await tick()
    expect(envois).toEqual(["A:rouge"])
    h.toutLancer(); await tick(); await tick()
    expect(envois).toEqual(["A:rouge", "B:vert"])
  })
  it("quitter la page vide l'attente", async () => {
    const h = horloge(); const envois: string[] = []
    const s = creerSauvegardeParQr<string>({ enregistrer: async (id, v) => { envois.push(`${id}:${v}`) }, minuteurs: h.p })
    s.modifier("A", "rouge")
    expect(s.toutEstEnregistre()).toBe(false)
    expect(await s.attendre()).toBe(true)
    expect(envois).toEqual(["A:rouge"])
    expect(s.toutEstEnregistre()).toBe(true)
  })
  it("un échec se réessaie seul UNE fois, puis attend un geste", async () => {
    const h = horloge(); let essais = 0; const etats: EtatDeQr[] = []
    const s = creerSauvegardeParQr<string>({ enregistrer: async () => { essais++; throw new Error("réseau") }, onEtat: (_, e) => etats.push(e), minuteurs: h.p })
    s.modifier("A", "rouge"); h.toutLancer(); await tick(); await tick()
    expect(essais).toBe(1); expect(etats.at(-1)).toBe("error")
    h.toutLancer(); await tick(); await tick()        // relance automatique
    expect(essais).toBe(2)
    h.toutLancer(); await tick(); await tick()        // plus de relance seule
    expect(essais).toBe(2)
    expect(s.toutEstEnregistre()).toBe(false)
    s.reessayer("A"); await tick(); await tick()
    expect(essais).toBe(3)
  })
  it("ce qui attend se lit, pour l'envoi de dernière chance", () => {
    const h = horloge()
    const s = creerSauvegardeParQr<string>({ enregistrer: async () => {}, minuteurs: h.p })
    s.modifier("A", "rouge")
    expect(s.enAttentePour("A")).toBe("rouge")
    expect(s.enAttentePour("B")).toBe(null)
  })
})

describe("droits du Studio : lus dans lib/plans", () => {
  it("gratuit : PNG oui, SVG et PDF non, avec la formule qui les ouvre", () => {
    expect(verrouDe("free", { type: "format", id: "png" })).toBeNull()
    expect(verrouDe("free", { type: "format", id: "svg" })?.nomDuPlan).toBe("Établissement")
    expect(verrouDe("free", { type: "format", id: "png-t" })?.nomDuPlan).toBe("Starter")
    expect(verrouDe("pro", { type: "format", id: "pdf" })).toBeNull()
  })
  it("modules, coins et correction avancés : fermés en gratuit, ouverts dès Starter", () => {
    expect(verrouDe("free", { type: "module", id: "neon" })?.phrase).toBe("Ce style de modules : inclus dès la formule Starter.")
    expect(verrouDe("free", { type: "module", id: "rounded" })).toBeNull()
    expect(verrouDe("free", { type: "coin", id: "diamond" })).not.toBeNull()
    expect(verrouDe("free", { type: "correction", id: "H" })).not.toBeNull()
    expect(verrouDe("free", { type: "correction", id: "M" })).toBeNull()
    expect(verrouDe("starter", { type: "module", id: "neon" })).toBeNull()
  })
  it("un style déjà enregistré se signale, il ne s'efface pas", () => {
    expect(reglagesFermes("free", { dotStyle: "luxury", cornerStyle: "square", ecc: "M" })).toHaveLength(1)
    expect(reglagesFermes("business", { dotStyle: "luxury", cornerStyle: "luxury", ecc: "H" })).toHaveLength(0)
  })
})

describe("la même règle côté serveur (/api/qr-style)", () => {
  it("refuse un réglage fermé NOUVEAU, avec la phrase de la formule", () => {
    expect(refusDeFormule("free", { dotStyle: "pixel" })).toMatch(/formule Starter/)
    expect(refusDeFormule("free", { ecc: "H" })).toMatch(/correction d'erreur H/)
    expect(refusDeFormule("free", { cornerStyle: "luxury" }, { cornerStyle: "square" })).not.toBeNull()
  })
  it("laisse passer ce que la formule ouvre", () => {
    expect(refusDeFormule("free", { dotStyle: "square", cornerStyle: "rounded", ecc: "M" })).toBeNull()
    expect(refusDeFormule("starter", { dotStyle: "pixel", ecc: "H" })).toBeNull()
    expect(refusDeFormule(undefined, {})).toBeNull()
  })
  it("ne fait pas perdre un style déjà porté (formule baissée)", () => {
    expect(refusDeFormule("free", { dotStyle: "neon", ecc: "Q" }, { dotStyle: "neon", ecc: "Q" })).toBeNull()
    expect(refusDeFormule("free", { dotStyle: "neon", ecc: "H" }, { dotStyle: "neon", ecc: "Q" }), "mais un autre réglage fermé, non").toMatch(/H/)
  })
})
