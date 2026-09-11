import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { raisonDeProposer, avantagesEnPlus } from "./offreUtile"
import { PLANS } from "@/lib/plans"

// Relevé du 11 septembre. Mesure du POIDS VISUEL de l'accueil connecté — surface
// du bloc × écart de clarté avec le fond — sur un compte gratuit de trois scans :
//
//     poids 7  « Voir les offres »      ← l'encart payant
//     poids 3  « Nouvelle page »
//     poids 3  « Voir mon QR code »     ← l'étape utile du moment
//
// L'élément le plus fort de l'écran était la demande d'argent, et elle valait
// plus que les deux gestes utiles réunis. Sa seule condition d'affichage était
// `profile?.plan === "free"` : tous les jours, dès le premier.
//
// Et elle annonçait « 10 pages, vues illimitées, QR personnalisés, sans
// branding ». Or plans.ts donne `views: null` aux TROIS plans : les vues sont
// illimitées y compris en gratuit, et l'écran l'écrit lui-même deux cartes plus
// haut (« Vues ce mois · 4 · illimitées »).
//
// Mesuré après ce lot : l'encart disparaît à 3 scans ; à 64 il revient, en poids
// 0 — présent, lisible, sous les gestes utiles.

const lire = (f: string) => readFileSync(join(__dirname, f), "utf8")
const client = lire("DashboardClient.tsx")
const banc = readFileSync(join(__dirname, "../e2e-harness/accueil/page.tsx"), "utf8")

describe("l'offre attend d'avoir une raison", () => {
  it("sa condition n'est plus « le plan est gratuit »", () => {
    expect(client).not.toContain('{profile?.plan === "free" && (')
    expect(client).toContain("const raison = raisonDeProposer({ plan: profile?.plan ?? \"free\", pages: pages.length, scans: totalScans })")
    expect(client).toContain("if (!raison) return null")
  })
  it("le cas relevé ne la déclenche pas, un QR qui tourne oui", () => {
    expect(raisonDeProposer({ plan: "free", pages: 1, scans: 3 })).toBeNull()
    expect(raisonDeProposer({ plan: "free", pages: 1, scans: 64 })).toBe("trafic")
  })
  it("l'accroche vient du module, et dit pourquoi on en parle", () => {
    expect(client).toContain("{accrocheOffre(raison)}")
    expect(client).not.toContain("Passez à {getPlan(\"pro\").label}")
  })
})

describe("elle ne promet que ce qu'elle apporte", () => {
  it("la liste est calculée sur plans.ts, plus écrite à la main", () => {
    expect(client).toContain('const plus = avantagesEnPlus("free", "pro").slice(0, 4)')
    expect(client).not.toContain("pages, vues illimitées, QR personnalisés, sans branding")
  })
  it("« vues illimitées » n'est l'avantage d'aucun plan : les trois les ont", () => {
    expect(PLANS.free.limits.views).toBeNull()
    expect(PLANS.pro.limits.views).toBeNull()
    expect(PLANS.business.limits.views).toBeNull()
    expect(avantagesEnPlus("free", "pro").join(" · ")).not.toMatch(/vue/i)
  })
  it("ce qu'elle annonce est vrai, ligne à ligne", () => {
    const a = avantagesEnPlus("free", "pro")
    expect(a).toContain(`${PLANS.pro.limits.pages} pages`)
    expect(a).toContain(`${PLANS.pro.limits.qr} QR codes`)
    expect(a).toContain("sans la mention QRowg")
  })
})

describe("elle ne domine plus l'écran", () => {
  it("son bouton n'est plus le seul aplat d'or de la page", () => {
    // `da-btn-primary` est le bouton plein ; l'offre prend le bouton neutre.
    const i = client.indexOf("const raison = raisonDeProposer")
    const bloc = client.slice(i, client.indexOf("})()}", i))
    expect(bloc).toContain('className="da-btn-neutral da-btn-neutral--sm"')
    expect(bloc).not.toContain("da-btn-primary")
  })
})

describe("les deux états sont montables, donc mesurables", () => {
  it("?debut=1 n'a pas de raison, ?debut=2 en a une", () => {
    expect(banc).toContain('const lance = debut === "2"')
    expect(banc).toContain('plan: "free", total_scans: 64, total_pages: 1')
    expect(banc).toContain('plan: "free", total_scans: 3, total_pages: 1')
  })
})
