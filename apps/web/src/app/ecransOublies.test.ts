import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sourceParDefaut, SOUS_DOMAINE_QROWG } from "./dashboard/redirects/sourceParDefaut"

// Relevé du 11 septembre. Les deux règles de maison — aucun texte lu sous 11 px,
// aucune cible sous 32 px — tenaient depuis le lot v60 « sur les écrans du
// produit ». Sauf que « les écrans du produit » était une LISTE de vingt noms
// écrite à la main, et qu'une liste ne signale jamais ce qui lui manque.
//
// Trois écrans n'y avaient jamais figuré : Domaines, Redirections, Équipe.
// Mesuré sur banc d'essai : 4 numéros d'étape à 10 px sur Domaines, 6 libellés
// à 10 px et 6 boutons de ligne à 28 px sur Redirections, 2 menus de rôle à
// 30 px sur Équipe. Et leur état VIDE — celui que traverse tout compte neuf —
// n'avait jamais été monté du tout.
//
// Ce lot remplace la liste par un arbre (voir lisibiliteEtCibles.test.ts) et
// répare ce que l'arbre a trouvé. Ce fichier-ci garde les réparations.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("les trois écrans que la règle n'avait jamais visités", () => {
  it("Domaines : les numéros d'étape du guide sont lus, donc ≥ 11 px", () => {
    const d = lire("dashboard/domains/DomainsPage.tsx")
    expect(d).toContain('fontSize:11.5, fontWeight:700, width:20, height:20, borderRadius:"50%"')
    expect(d).toContain('["1", "Ajoutez votre domaine et sélectionnez la page à associer"]')
  })
  it("Domaines : ouvrir le site et « Vérifier DNS » font leur hauteur", () => {
    const d = lire("dashboard/domains/DomainsPage.tsx")
    expect(d).not.toContain("width:28, height:28,")
    expect(d).toContain('gap:5, minHeight:32, padding:"0 12px"')
  })
  it("Redirections : les trois actions de ligne passent à 32 px, comme Supprimer", () => {
    const r = lire("dashboard/redirects/RedirectsPanel.tsx")
    expect(r).not.toContain("width:28, height:28,")
    expect((r.match(/width:32, height:32,/g) ?? []).length).toBe(3)
  })
  it("Équipe : le menu de rôle d'un membre fait 32 px", () => {
    expect(lire("dashboard/team/page.tsx")).toContain('minHeight: 32, padding: "0 10px"')
  })
})

describe("ce que le formulaire montre est ce qu'il enregistrera", () => {
  it("sans domaine connecté, la source proposée existe dans le menu", () => {
    // Le défaut d'origine : `userDomains[0] ?? ""`. Le <select> affichait alors
    // « qrowg.com » (sa première option) pendant que l'état valait la chaîne vide,
    // et l'aperçu juste dessous annonçait « → URL source : /chemin ».
    expect(sourceParDefaut([])).toBe(SOUS_DOMAINE_QROWG)
    const r = lire("dashboard/redirects/RedirectsPanel.tsx")
    expect(r).not.toContain('userDomains[0] ?? ""')
    expect(r).toContain("useState(sourceParDefaut(userDomains))")
    expect(r).toContain("setFDomain(sourceParDefaut(userDomains))")
    // et l'option de repli n'est plus écrite en dur à deux endroits
    expect(r).toContain("<option value={SOUS_DOMAINE_QROWG}>{SOUS_DOMAINE_QROWG} (sous-domaine)</option>")
  })
})

describe("l'état vide de chaque écran est montable, donc mesurable", () => {
  const banc = (f: string) => readFileSync(join(__dirname, "e2e-harness", f, "page.tsx"), "utf8")
  it("?vide=1 existe sur les quatre écrans à listes, et vide vraiment la liste", () => {
    expect(banc("messages")).toContain("<LeadsClient leads={vide ? [] : leads}")
    expect(banc("equipe")).toContain("members: [], invitations: [], seatsUsed: 1")
    expect(banc("domaines")).toContain("initialDomains={vide ? [] : domains}")
    // Redirections : sans domaine connecté non plus — c'est ce trou qui a révélé le bug du menu.
    expect(banc("redirections")).toContain("userDomains={vide ? [] : [")
    for (const f of ["messages", "equipe", "domaines", "redirections"])
      expect(banc(f), f).toContain('vide = ((await searchParams) ?? {}).vide === "1"')
  })
})

describe("les miniatures ne trichent plus avec du texte minuscule", () => {
  it("la maquette d'éditeur de l'accueil du builder dessine des formes, pas des mots de 6,5 px", () => {
    const w = lire("dashboard/builder/BuilderWelcome.tsx")
    expect(w).not.toContain("fontSize: 6.5")
    expect(w).not.toContain("fontSize: 7.5")
    expect(w).toContain('<div aria-hidden style={{ ...cell(on("topbar")), width: 34, height: 14, borderRadius: 5 }} />')
  })
  it("la coche d'un badge de profil est une icône, pas la lettre « v » à 7 px", () => {
    const p = lire("dashboard/profile/page.tsx")
    expect(p).not.toContain('fontSize:7, color:"var(--ink-on-accent)", fontWeight:900 }}>v<')
    expect(p).toContain('<svg viewBox="0 0 10 10" width="8" height="8" aria-hidden')
  })
  it("« PRO » sur un motif verrouillé se lit dans les deux grilles", () => {
    const z = lire("dashboard/qr-codes/QRStudioZero.tsx")
    expect(z).not.toContain("fontSize: 7.5")
    expect((z.match(/fontSize: 11\.5, fontWeight: 700, color: G, background: "rgba\(0,0,0,0\.6\)"/g) ?? []).length).toBe(2)
  })
})

describe("l'atelier d'impression : la dispense couvrait tout le fichier", () => {
  // Elle disait « au-delà de la ligne 2200 », mais rien ne le vérifiait : la
  // moitié haute — barre de recherche, filtres métier, fil d'Ariane, libellés de
  // section — échappait donc aussi à la règle. Mesuré : champ de recherche haut
  // de 14 px, six puces de métier à 28 px, « + 19 métiers » à 26 px, neuf
  // libellés d'interface entre 8,5 et 10 px. La dispense est maintenant bornée.
  const ps = lire("dashboard/print-studio/PrintStudioClient.tsx")
  it("la borne est écrite dans la garde, et elle s'applique", () => {
    const g = lire("lisibiliteEtCibles.test.ts")
    expect(g).toContain('fichier: "dashboard/print-studio/PrintStudioClient.tsx", apres: 2200')
    expect(g).toContain("if (d?.apres !== undefined && i + 1 > d.apres) return")
  })
  it("le champ de recherche des supports se touche", () => {
    expect(ps).toContain('placeholder="Sticker, chevalet, carte…" style={{ flex: 1, minWidth: 0, minHeight: 34')
    expect(ps).not.toContain('gap: 9, padding: "10px 13px", borderRadius: 11, background: "var(--surface)"')
  })
  it("les puces de métier et « + N métiers » font 32 px", () => {
    expect(ps).toContain('style={{ minHeight: 32, padding: "0 13px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: on ? 600 : 500')
    expect(ps).toContain('setAllMetiers(a => !a)} style={{ minHeight: 32, padding: "0 4px"')
    expect(ps).toContain('gap: 8, minHeight: 32, padding: "0 13px 0 10px", borderRadius: 999')
  })
})

