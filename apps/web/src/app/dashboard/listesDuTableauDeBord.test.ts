import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// v56 — les listes d'Équipe, Domaines et Redirections vues avec des données (bancs
// d'essai amorcés), Profil et Paramètres vus sur téléphone. Ce qu'on y a corrigé.

const lire = (p: string) => readFileSync(join(__dirname, p), "utf8")

describe("amorçage des écrans (bancs d'essai, tests)", () => {
  it("Domaines, Redirections et Équipe acceptent une liste initiale et n'appellent alors pas le réseau", () => {
    const d = lire("domains/DomainsPage.tsx"), r = lire("redirects/RedirectsPanel.tsx"), t = lire("team/page.tsx")
    expect(d).toContain("useEffect(() => { if (!initialDomains) charger() }, [])")
    expect(r).toContain("useEffect(() => { if (!initialRedirects) charger() }, [])")
    expect(t).toContain("useEffect(() => { if (!initialData) load() }, [load, initialData])")
    for (const h of ["equipe", "domaines", "redirections"]) expect(lire(`../e2e-harness/${h}/page.tsx`)).toMatch(/initialData=|initialDomains=|initialRedirects=/)
  })
})

describe("Domaines : un domaine n'apparaît qu'une fois", () => {
  const d = lire("domains/DomainsPage.tsx"), m = lire("domains/MultiBrandDomainsPanel.tsx")
  it("le panneau multi-marques est en vue compacte (entête + rappel du principal), la liste détaillée porte « Principal » et « Définir principal »", () => {
    expect(d).toContain("<MultiBrandDomainsPanel\n                vueCompacte")
    expect(m).toContain("{!vueCompacte && isBusiness && secondary.length > 0 && (")
    expect(m).toContain("{!vueCompacte && !isBusiness && domains.length > 0 && !primary && (")
    expect(d).toContain("<Star size={10}/> Principal</span>")
    expect(d).toContain('onClick={() => setPrimaryDomain(rec.domain)} className="da-btn-neutral da-btn-neutral--sm"')
  })
  it("un domaine vérifié se dit « Vérifié », jamais « verified »", () => {
    expect(d).toContain("const statusCfg = rec.verified ? STATUS_CFG.verified : (STATUS_CFG[rec.vercel_status] ?? STATUS_CFG.pending)")
    expect(m).toContain('if (status === "verified") return (')
  })
  it("routes en français", () => {
    const r = lire("domains/DomainRoutesPanel.tsx")
    expect(r).toContain(">Une page par sous-domaine</h3>")
    expect(r).not.toContain(">wildcard<")
    expect(r).toContain(">joker<")
  })
})

describe("Équipe, Profil, Paramètres", () => {
  it("« Administrateur », pas « Admin »", () => {
    const t = lire("team/page.tsx")
    expect(t).toContain('admin: "Administrateur"')
    expect(t).not.toContain('<option value="admin">Admin</option>')
  })
  it("Profil : une limite absente s'écrit « illimitées » sans jauge, « Identité » accentué, plus de « -- »", () => {
    const p = lire("profile/page.tsx")
    expect(p).toContain('{g.limit == null ? " · illimitées" : ` / ${g.limit.toLocaleString("fr-FR")}`}')
    expect(p).toContain("{g.limit != null && (")
    expect(p).toContain('title="Identité"')
    expect(p).not.toContain("-- max 5 Mo --")
    expect(p).toContain('label: "Pages publiées", used: activeQR')
  })
  it("Paramètres : nom du plan depuis lib/plans", () => {
    const s = lire("settings/page.tsx")
    expect(s).toContain("{getPlan(profile?.plan).label}")
    expect(s).toContain("Plan {getPlan(profile?.plan).label}</p>")
    expect(s).not.toContain('{profile?.plan || "free"}')
  })
  it("plus de texte à 9 ou 10 px dans Profil, briques de profil et Paramètres", () => {
    for (const f of ["profile/page.tsx", "profile/briquesProfil.tsx", "settings/page.tsx"]) {
      expect(lire(f), f).not.toMatch(/fontSize:\s*(9|9\.5|10|10\.5)(?![\d.])/)
    }
  })
})
