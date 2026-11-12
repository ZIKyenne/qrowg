import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { DUREE_ESSAI_JOURS, planSoumisALEssai } from "./essaiGratuit"
import { PLAN_ORDER } from "./plans"

// La règle des trente jours est écrite DEUX FOIS : dans `lib/essaiGratuit.ts`,
// qui décide ce que voit un visiteur, et en SQL, qui décide ce que la base
// accepte. Il le faut : l'application seule ne tient rien, puisque la base est
// joignable avec la clé publique et qu'un propriétaire peut écrire chez lui.
//
// Deux endroits pour la même règle, donc un test qui les compare — sans quoi
// ils divergeront, et le jour où ils divergeront c'est la base qui gagnera en
// silence.

const MIGRATIONS = join(__dirname, "../../../../supabase/migrations")

/** La dernière migration qui définit une fonction donnée — c'est elle qui fait foi. */
function dernierSqlDe(fonction: string): string {
  const fichiers = readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort()
  let trouve = ""
  for (const f of fichiers) {
    const sql = readFileSync(join(MIGRATIONS, f), "utf8")
    const re = new RegExp(`create or replace function (?:public\\.)?${fonction}\\b`, "i")
    if (re.test(sql)) trouve = sql.slice(sql.search(re))
  }
  return trouve
}

const SQL_DUREE = dernierSqlDe("duree_essai_jours")
const SQL_EXPIRE = dernierSqlDe("essai_expire")
const SQL_PUBLICATION = dernierSqlDe("garde_essai_publication")
const SQL_COMPTEUR = dernierSqlDe("garde_compteur_essai")

describe("la base et le code disent les mêmes trente jours", () => {
  it("la garde lit vraiment du SQL — sinon elle ne prouve rien", () => {
    for (const [nom, sql] of Object.entries({ SQL_DUREE, SQL_EXPIRE, SQL_PUBLICATION, SQL_COMPTEUR })) {
      expect(sql.length, `${nom} : définition introuvable dans les migrations`).toBeGreaterThan(50)
    }
  })

  it("la durée est la même des deux côtés", () => {
    const m = SQL_DUREE.match(/select\s+(\d+)\s*\$\$/i)
    expect(m, "durée introuvable dans duree_essai_jours()").toBeTruthy()
    expect(Number(m![1]), "le SQL et lib/essaiGratuit.ts doivent dire le même nombre de jours")
      .toBe(DUREE_ESSAI_JOURS)
  })

  it("les plans qui échappent à l'essai sont les mêmes des deux côtés", () => {
    const m = SQL_EXPIRE.match(/in \(([^)]*)\)/)
    expect(m, "liste des plans payants introuvable dans essai_expire()").toBeTruthy()
    const exemptesSql = m![1].split(",").map(v => v.trim().replace(/'/g, "")).sort()

    const exemptesTs = PLAN_ORDER.filter(id => !planSoumisALEssai(id)).sort()
    expect(exemptesSql, "un palier payant oublié d'un côté se mettrait en pause au bout de 30 jours")
      .toEqual(exemptesTs)
  })

  it("un plan inconnu est traité comme gratuit des deux côtés", () => {
    // TS : vérifié dans essaiGratuit.test.ts. SQL : c'est le `coalesce(v_plan,'free')`
    // combiné au `in (...)` — tout ce qui n'est pas listé tombe dans l'essai.
    expect(SQL_EXPIRE).toContain("coalesce(v_plan, 'free')")
    expect(planSoumisALEssai("palier_inconnu")).toBe(true)
  })
})

describe("ce que la base refuse, et qu'une console de navigateur tenterait", () => {
  it("publier quand l'essai est fini lève une erreur", () => {
    expect(SQL_PUBLICATION).toContain("public.essai_expire(new.user_id)")
    expect(SQL_PUBLICATION).toMatch(/raise exception\s+'ESSAI_TERMINE/)
  })

  it("le compteur est posé avec l'horloge du SERVEUR, pas une date reçue", () => {
    expect(SQL_PUBLICATION).toContain("free_published_since = now()")
    // `where ... is null` : idempotent, et impossible à repousser.
    expect(SQL_PUBLICATION).toContain("free_published_since is null")
  })

  it("le compteur ne peut être ni effacé ni repoussé", () => {
    // C'est LA ligne qui ferme la boucle : sans elle, le propriétaire remet
    // son propre compteur à zéro depuis le navigateur et tout le reste est
    // décoratif.
    expect(SQL_COMPTEUR).toContain("new.free_published_since is null")
    expect(SQL_COMPTEUR).toContain("new.free_published_since > old.free_published_since")
    expect(SQL_COMPTEUR).toContain("new.free_published_since := old.free_published_since")
  })

  it("les deux déclencheurs sont bien posés sur leurs tables", () => {
    const tout = readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort()
      .map(f => readFileSync(join(MIGRATIONS, f), "utf8")).join("\n")
    expect(tout).toMatch(/create trigger garde_essai_publication[\s\S]{0,120}on public\.pages/i)
    expect(tout).toMatch(/create trigger garde_compteur_essai[\s\S]{0,120}on public\.profiles/i)
  })

  it("ne dépublier ou renommer une page n'est jamais bloqué", () => {
    // On ne punit pas un commerçant qui range ses affaires : seul le PASSAGE
    // à l'état publié est contrôlé.
    expect(SQL_PUBLICATION).toContain("if new.status is distinct from 'published' then return new; end if;")
    expect(SQL_PUBLICATION).toContain("if tg_op = 'UPDATE' and old.status = 'published' then return new; end if;")
  })

  it("aucune migration d'essai n'efface quoi que ce soit", () => {
    const fichiers = readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort()
      .map(f => readFileSync(join(MIGRATIONS, f), "utf8"))
      .filter(sql => /create or replace function (?:public\.)?essai_expire\b/i.test(sql))
    expect(fichiers.length, "aucune migration d'essai lue").toBeGreaterThanOrEqual(1)
    for (const sql of fichiers) {
      expect(sql, "une migration d'essai ne doit rien effacer").not.toMatch(/\bdelete from\b/i)
      expect(sql).not.toMatch(/\btruncate\b/i)
    }
  })
})

describe("le rendu public applique la règle", () => {
  const page = readFileSync(join(__dirname, "../app/[slug]/page.tsx"), "utf8")

  it("il la CALCULE, il ne lit pas un drapeau", () => {
    expect(page).toContain("essaiExpire(")
    expect(page, "un drapeau posé par un cron finirait par mentir").not.toMatch(/\bpaused_at\b/)
  })

  it("il rend un écran d'attente, jamais un 404 — le QR est imprimé", () => {
    const i = page.indexOf("essaiExpire((page.profiles")
    expect(i, "la décision de pause est introuvable dans le rendu").toBeGreaterThan(0)
    const bloc = page.slice(i, i + 600)
    expect(bloc).toContain("PageEnPause")
    expect(bloc, "un 404 apprendrait au client que son QR est cassé").not.toContain("notFound")
  })

  it("et il retire la page des moteurs tant qu'elle est en pause", () => {
    expect(page).toContain("const proposable = !enPauseMeta &&")
  })
})
