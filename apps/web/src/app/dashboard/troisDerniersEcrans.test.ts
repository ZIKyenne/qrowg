import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// v57 — QR de pages, Statistiques et Atelier d'impression vus sur PC et téléphone
// (bancs d'essai). Ce qu'on y a corrigé : vocabulaire, un seul dessin de segment.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("Statistiques", () => {
  it("la source « qr » se lit « QR code », comme « qr_scan »", () => {
    const s = lire("../../lib/sourcesTrafic.ts")
    expect(s).toContain('qr_scan:   "QR code"')
    expect(s).toContain('qr:        "QR code"')
  })
  it("« Publiez vos contenus », « contre hier »", () => {
    const a = lire("analytics/AnalyticsClient.tsx")
    // Les deux phrases ont migré (lot v66) : le conseil vit dans lectureHonnete.ts,
    // et « contre hier » ne s'affiche plus que lorsque la veille existe — sinon
    // le pourcentage serait une division par zéro maquillée en « +100 % ».
    expect(lire("analytics/lectureHonnete.ts")).toContain("Publiez vos contenus ${creneauHoraire(opts.heurePic)}, votre heure de pic.")
    // Ancré sur l'INTENTION, pas sur l'écriture du nombre : depuis le lot v102
    // la veille passe par `nombreFr` (« 1 240 » et non « 1240 »).
    expect(a).toMatch(/contre hier \(\$\{[^}]*live\.ydayN[^}]*\}\)/)
    expect(a).not.toContain("vos posts")
  })
})

describe("Atelier d'impression", () => {
  // L'atelier et ses champs (sortis en v382) : le segmenteur vit dans les champs.
  const p = lire("print-studio/PrintStudioClient.tsx") + lire("print-studio/champsDuStudio.tsx")
  it("un seul dessin de segment : surface-2 + filet d'accent, plus d'or plein hors action primaire", () => {
    expect(p).not.toContain("background: actif ? C.gold")
    expect(p).not.toContain('background: sem === cid ? C.gold')
    expect(p).not.toContain("background: value === o ? C.gold")
    expect(p).toContain('boxShadow: value === o ? "inset 0 -2px 0 var(--accent)" : "none"')
    expect(p).toContain('boxShadow: actif ? "inset 0 -2px 0 var(--accent)" : "none"')
    // L'action primaire garde l'or plein
    expect(p).toContain("Vérifier & exporter")
  })
})
