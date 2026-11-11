import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PLANS, qrLimit, dynLimit, pageLimit, canDynSecurite, type PlanId } from "./plans"
import { readdirSync } from "node:fs"

// Les limites de plan ne vivaient que dans les routes /api. La base est joignable
// directement avec la clé publique, et la règle RLS autorise le propriétaire à
// écrire chez lui : trois lignes dans la console du navigateur suffisaient pour
// cinquante QR modifiables sur un plan qui en donne un.
//
// Une migration pose désormais les mêmes limites en base. Deux endroits pour les
// mêmes chiffres — donc un test qui les compare, sinon ils divergeront.

const MIGRATIONS_DIR = join(__dirname, "../../../../supabase/migrations")

/**
 * Le SQL qui fait FOI pour une fonction, c'est sa DERNIÈRE définition.
 *
 * Ce fichier lisait une migration nommée en dur —
 * `20260831140000_quotas_plan.sql`. Tant que personne ne redéfinissait ces
 * fonctions, c'était la même chose. Mais une migration qui a tourné en
 * production ne se modifie pas : on la remplace par une suivante. La garde
 * aurait alors continué à lire l'ancienne version et déclaré la base conforme
 * pendant qu'elle appliquait tout autre chose — une sonde qui regarde ailleurs
 * est pire qu'une sonde absente.
 *
 * Elle prend maintenant la dernière migration, dans l'ordre des noms, qui
 * redéfinit la fonction demandée.
 */
function dernierSqlDe(fonction: string): string {
  const fichiers = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql")).sort()
  let trouve = ""
  for (const f of fichiers) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8")
    if (new RegExp(`create or replace function (?:public\\.)?${fonction}\\b`, "i").test(sql)) {
      trouve = sql.slice(sql.search(new RegExp(`create or replace function (?:public\\.)?${fonction}\\b`, "i")))
    }
  }
  return trouve
}

const SQL_LIMITES = dernierSqlDe("limite_plan")
const SQL_SECURITE = dernierSqlDe("plan_a_securite_lien")

/**
 * La migration de quotas d'ORIGINE, en entier.
 *
 * Les blocs plus bas ne comparent pas la base au code : ils décrivent ce que CE
 * fichier-là contient — ses déclencheurs, le fait qu'il n'efface rien, ses deux
 * `drop trigger if exists`. Ces affirmations portent sur un texte figé qui a
 * déjà tourné en production ; elles doivent continuer à le lire, lui.
 */
const SQL = readFileSync(join(MIGRATIONS_DIR, "20260831140000_quotas_plan.sql"), "utf8")

/** Toutes les migrations qui touchent aux quotas — l'originale et ses suites. */
// `.sort()` est collé au `readdirSync` : `testsDeterministes` exige de le voir
// sur la même ligne, et il a raison de ne pas chercher plus loin — un tri posé
// trois lignes plus bas se perd au premier remaniement.
const SQL_QUOTAS_TOUTES = readdirSync(MIGRATIONS_DIR).sort()
  .filter(f => f.endsWith(".sql"))
  .map(f => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
  .filter(sql => /create or replace function (?:public\.)?limite_plan\b/i.test(sql))

/** Lit une branche `when 'starter' then 7` du bloc CASE d'une limite. */
function limiteSql(quoi: "qr" | "dyn" | "pages", plan: PlanId): number | null {
  const bloc = SQL_LIMITES.slice(SQL_LIMITES.indexOf(`when '${quoi}' then`))
  const portee = bloc.slice(0, bloc.indexOf("end") + 3)
  if (plan === "free") {
    const m = portee.match(/else\s+(\d+)\s+end/)
    return m ? Number(m[1]) : NaN as never
  }
  const m = portee.match(new RegExp(`when '${plan}'\\s+then\\s+(null|\\d+)`))
  if (!m) return NaN as never
  return m[1] === "null" ? null : Number(m[1])
}

describe("la base applique exactement les mêmes limites que le code", () => {
  const plans = Object.keys(PLANS) as PlanId[]

  // Contre-épreuve d'aveuglement : si la lecture du SQL renvoyait du vide, tous
  // les tests ci-dessous compareraient `NaN` à `NaN` et passeraient pour verts.
  it("la garde lit vraiment du SQL", () => {
    expect(SQL_LIMITES, "aucune définition de limite_plan trouvée").toContain("when 'qr' then")
    expect(SQL_SECURITE, "aucune définition de plan_a_securite_lien trouvée").toContain("in (")
    expect(plans.length, "aucun plan à comparer").toBeGreaterThanOrEqual(4)
  })

  it("les QR autonomes", () => {
    for (const p of plans) expect(limiteSql("qr", p), p).toBe(qrLimit(p))
  })

  it("les QR modifiables", () => {
    for (const p of plans) expect(limiteSql("dyn", p), p).toBe(dynLimit(p))
  })

  it("les QR de page actifs", () => {
    for (const p of plans) expect(limiteSql("pages", p), p).toBe(pageLimit(p))
  })

  it("la sécurité du lien (mot de passe, expiration) couvre les mêmes plans", () => {
    const m = SQL_SECURITE.match(/in \(([^)]*)\)/)
    expect(m, "la liste des plans autorisés est introuvable").toBeTruthy()
    const autorises = m![1].split(",").map(s => s.trim().replace(/'/g, ""))
    for (const p of plans) expect(autorises.includes(p), p).toBe(canDynSecurite(p))
  })
})

describe("la migration ne peut pas casser un compte existant", () => {
  it("ne vérifie le quota qu'au PASSAGE à l'état actif", () => {
    // Sans cette condition, renommer un QR déjà actif sur un compte au-dessus de
    // sa limite (ancien plan, rétrogradation) serait refusé.
    expect(SQL).toContain("or not (coalesce(old.dynamic, false) and coalesce(old.status, 'active') = 'active')")
    expect(SQL).toContain("if tg_op = 'UPDATE' and coalesce(old.status, 'active') = 'active' then return new; end if;")
  })

  it("ne bloque une expiration héritée que si on la MODIFIE", () => {
    expect(SQL).toContain("old.expires_at is distinct from new.expires_at")
    expect(SQL).toContain("old.password_hash is distinct from new.password_hash")
  })

  it("ne supprime ni ne réécrit aucune ligne", () => {
    // La règle vaut pour TOUTES les migrations de quota, pas seulement la
    // première : une suite qui effacerait des lignes passerait inaperçue si la
    // garde ne lisait que l'originale.
    expect(SQL_QUOTAS_TOUTES.length, "aucune migration de quota lue").toBeGreaterThanOrEqual(2)
    for (const sql of SQL_QUOTAS_TOUTES) {
      expect(sql, "une migration de quota ne doit rien effacer").not.toMatch(/\bdelete from\b/i)
      expect(sql).not.toMatch(/\btruncate\b/i)
    }
    // `drop trigger if exists` avant `create trigger` est attendu : c'est ce qui
    // rend la migration rejouable.
    expect(SQL.match(/\bdrop\b/gi)?.length).toBe(2)
  })

  it("se replie sur le plan gratuit quand le profil est illisible", () => {
    expect(SQL).toContain("coalesce(p_plan, 'free')")
  })
})


// ── Le plan vendu doit exister dans la base ──────────────────────────────────

describe("chaque plan vendu est une valeur que la base accepte", () => {
  // `profiles.plan` n'est pas du texte : c'est l'énumération `subscription_plan`,
  // déclarée avec trois valeurs — free, pro, business. La page /upgrade en vend
  // QUATRE. Un client qui achetait le Starter payait, le webhook tentait d'écrire
  // 'starter', Postgres refusait (22P02) et le compte restait gratuit.
  const MIGRATIONS = join(__dirname, "../../../../supabase/migrations")

  function valeursEnum(): string[] {
    const fichiers = readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort()
    let valeurs: string[] = []
    for (const f of fichiers) {
      const sql = readFileSync(join(MIGRATIONS, f), "utf8")
      const creation = sql.match(/create type (?:public\.)?subscription_plan as enum \(([^)]*)\)/i)
      if (creation) valeurs = creation[1].split(",").map(v => v.trim().replace(/'/g, ""))
      for (const m of sql.matchAll(/alter type (?:public\.)?subscription_plan add value(?: if not exists)? '([a-z_]+)'/gi)) {
        if (!valeurs.includes(m[1])) valeurs.push(m[1])
      }
    }
    return valeurs
  }

  it("les quatre plans du code sont dans l'énumération", () => {
    const acceptes = valeursEnum()
    expect(acceptes.length, "énumération introuvable dans les migrations").toBeGreaterThan(0)
    for (const p of Object.keys(PLANS)) {
      expect(acceptes.includes(p), `le plan « ${p} » est vendu mais la base ne l'accepte pas`).toBe(true)
    }
  })

  it("et l'énumération n'invente pas de plan que le code ignore", () => {
    // `starter` fait exception : le palier a été retiré de la grille, mais la
    // valeur peut subsister en base sur un projet où elle a déjà été ajoutée.
    // getPlan la traite comme un Établissement, elle ne vend donc rien de faux.
    for (const v of valeursEnum()) {
      if (v === "starter") continue
      expect(Object.keys(PLANS).includes(v), `la base accepte « ${v} », inconnu de plans.ts`).toBe(true)
    }
  })
})
