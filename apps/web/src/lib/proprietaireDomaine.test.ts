import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { candidats, proprietaire } from "./proprietaireDomaine"

// La résolution publique d'un domaine personnalisé cherchait redirections et
// routes sans regarder qui possède le domaine : détournement possible du trafic
// d'un autre client, et redirection ouverte sur qrowg.com. Désormais tout est
// filtré par le propriétaire vérifié — et rien n'est résolu sans propriétaire.

const ici = dirname(fileURLToPath(import.meta.url))

describe("candidats", () => {
  it("l'hôte puis chacun de ses parents jusqu'au domaine enregistrable", () => {
    expect(candidats("a.b.exemple.fr")).toEqual(["a.b.exemple.fr", "b.exemple.fr", "exemple.fr"])
    expect(candidats("exemple.fr")).toEqual(["exemple.fr"])
    expect(candidats("www.Exemple.FR.")).toEqual(["exemple.fr"])
    expect(candidats("fr")).toEqual([])
  })
})

describe("proprietaire", () => {
  const V = [
    { user_id: "u1", domain: "victim.com", verified: true },
    { user_id: "u2", domain: "booking.victim.com", verified: true },
    { user_id: "u3", domain: "attente.com", verified: false },
  ]
  it("le domaine exact", () => { expect(proprietaire("victim.com", V)?.user_id).toBe("u1") })
  it("un sous-domaine remonte au parent vérifié", () => { expect(proprietaire("shop.victim.com", V)?.user_id).toBe("u1") })
  it("le plus précis l'emporte", () => { expect(proprietaire("booking.victim.com", V)?.user_id).toBe("u2") })
  it("un domaine non vérifié n'a pas de propriétaire", () => { expect(proprietaire("attente.com", V)).toBeNull() })
  it("un domaine inconnu n'a pas de propriétaire", () => { expect(proprietaire("evil.example", V)).toBeNull() })
})

describe("la route de résolution", () => {
  const src = readFileSync(join(ici, "..", "app", "api", "domains", "resolve", "route.ts"), "utf8")
  it("cherche d'abord le propriétaire et s'arrête s'il n'y en a pas", () => {
    expect(src).toContain("const owner = proprietaire(domain, verifs ?? [])")
    expect(src).toMatch(/if \(!owner\) \{\s*return new NextResponse\(notFoundHtml/)
  })
  it("chaque lecture est filtrée par ce propriétaire", () => {
    const n = (src.match(/\.eq\("user_id", owner\.user_id\)/g) || []).length
    expect(n, "redirection exacte, redirection racine, routes, vérification").toBeGreaterThanOrEqual(4)
  })
})

describe("la migration", () => {
  const sql = readFileSync(join(ici, "..", "..", "..", "..", "supabase", "migrations", "20260904120000_domaines_proprietaire.sql"), "utf8")
  it("teste session_user, jamais current_user (piège du SECURITY DEFINER)", () => {
    // Seuls les commentaires ont le droit de citer current_user (pour expliquer le piège).
    const code = sql.split("\n").filter(l => !l.trim().startsWith("--")).join("\n")
    expect(code).not.toMatch(/current_user/)
    expect((sql.match(/session_user/g) || []).length).toBeGreaterThanOrEqual(2)
  })
  it("verrouille l'état des vérifications et la source des redirections et routes", () => {
    expect(sql).toContain("guard_domain_verification_trg")
    expect(sql).toContain("guard_domain_source_trg")
    expect(sql).toContain("guard_domain_route_trg")
    expect(sql).toContain("domaine_verifie_par(new.user_id, v_hote)")
  })
})

// P1-32 · set_primary n'était pas transactionnel (et l'index unique partiel sur
// is_primary faisait échouer « poser le nouveau avant d'effacer l'ancien ») ;
// pages.custom_domain était mis à jour avec l'identifiant de la VÉRIFICATION.
describe("domaine principal et page rattachée", () => {
  const sql = readFileSync(join(__dirname, "../../../../supabase/migrations/20260905130000_domaine_principal.sql"), "utf8")

  it("le changement de principal passe par une fonction transactionnelle réservée au service", () => {
    // L'appel de la route est JOUÉ depuis v410 (bancDomaines.test.ts) ; reste le SQL.
    expect(sql).toContain("security definer")
    expect(sql).toContain("revoke all on function public.definir_domaine_principal(uuid, text) from public, anon, authenticated")
    // l'ancien principal est retiré AVANT que le nouveau soit posé, dans la même transaction
    expect(sql.indexOf("set is_primary = false")).toBeLessThan(sql.indexOf("set is_primary = true"))
  })

  // « custom_domain cible la page de la vérification » et « le domaine est normalisé
  // et validé en tête de route » : JOUÉS depuis v410 (app/api/domains/bancDomaines.test.ts).

})

// v410 · la correction de juillet (unicité par compte, un seul compte VÉRIFIÉ) avait
// été écrite dans une migration déjà appliquée : elle n'a jamais atteint la base.
// La nouvelle migration la porte vraiment — et le banc (bancDomaines.test.ts) joue
// la route dans les deux états de la base.
describe("l'unicité des domaines, portée par une migration qui s'applique", () => {
  const sql = readFileSync(join(__dirname, "../../../../supabase/migrations/20261128120000_domaines_unicite_reelle.sql"), "utf8")
  it("retire l'unicité globale, pose celle du compte, et rend unique le domaine VÉRIFIÉ", () => {
    expect(sql).toMatch(/drop constraint if exists domain_verifications_domain_key/i)
    expect(sql).toMatch(/create unique index if not exists domain_verifications_user_domain_key\s+on public\.domain_verifications \(user_id, domain\)/i)
    expect(sql).toMatch(/drop index if exists public\.idx_domain_verif_domain;\s*create unique index idx_domain_verif_domain\s+on public\.domain_verifications \(domain\)\s+where verified = true/i)
    expect(sql).not.toMatch(/\b(delete|truncate|drop table)\b/i)
  })
})
