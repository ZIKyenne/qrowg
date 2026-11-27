import type { Page, Route } from "@playwright/test"
import { connecter } from "./sessionSimulee"

// Une base qui retient ce qu'on lui écrit — pour jouer l'éditeur d'une page
// EXISTANTE au navigateur (v390). `sessionSimulee` répond « vide » à tout : assez
// pour la coquille, pas pour prouver qu'une modification arrive en base.
//
// Ici, un petit PostgREST en mémoire, limité à ce que l'éditeur emploie :
// lecture filtrée (`eq`, `in`, `gte`) et ordonnée, `single()`, mise à jour,
// upsert (`on_conflict`), insertion, suppression. Chaque écriture de bloc date
// `updated_at`, comme le déclencheur réel — sans quoi le contrôle de version de
// `savePage` ne verrait jamais rien bouger.
//
// Le test lit l'état par `base.tables` et le journal des requêtes d'écriture par
// `base.ecritures`. `base.retenir()` met les écritures en attente (réponse
// suspendue) jusqu'à `base.relacher()` — pour placer un départ PENDANT une
// sauvegarde.

type Ligne = Record<string, unknown>
export type Tables = Record<string, Ligne[]>

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "access-control-expose-headers": "content-range, x-supabase-api-version",
  "content-type": "application/json",
}

/** null : un filtre que ce banc ne sait pas lire. */
function filtres(url: URL): ((l: Ligne) => boolean)[] | null {
  const res: ((l: Ligne) => boolean)[] = []
  for (const [cle, val] of url.searchParams) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(cle)) continue
    const point = val.indexOf(".")
    const op = val.slice(0, point), arg = val.slice(point + 1)
    if (op === "eq") res.push(l => String(l[cle]) === arg)
    else if (op === "in") {
      const liste = arg.replace(/^\(|\)$/g, "").split(",").map(s => s.replace(/^"|"$/g, ""))
      res.push(l => liste.includes(String(l[cle])))
    } else if (op === "gte") res.push(l => String(l[cle] ?? "") >= arg)
    else return null
  }
  return res
}

export async function baseSimulee(page: Page, depart: Tables) {
  await connecter(page, "pro")
  const tables: Tables = JSON.parse(JSON.stringify(depart))
  const ecritures: { methode: string; table: string; corps: unknown }[] = []
  let horloge = Date.parse("2026-11-01T00:00:00Z")
  const date = () => new Date((horloge += 1000)).toISOString()
  let retenues: (() => Promise<void>)[] | null = null
  const refusees = new Set<string>()
  const ignorees = new Set<string>()

  const repondre = (route: Route, status: number, corps: unknown, entetes: Record<string, string> = {}) =>
    route.fulfill({ status, headers: { ...CORS, ...entetes }, body: corps === undefined ? "" : JSON.stringify(corps) })

  async function traiter(route: Route) {
    const req = route.request()
    const url = new URL(req.url())
    const table = url.pathname.split("/rest/v1/")[1]
    const lignes = (tables[table] ??= [])
    const methode = req.method()
    // HEAD = comptage (« count: exact, head: true ») : une lecture, jamais une écriture.
    const lecture = methode === "GET" || methode === "HEAD"
    const garde = filtres(url)
    // Filtre inconnu : une lecture hors de l'éditeur (coquille, compteurs) reçoit
    // « rien » ; une écriture est refusée net — jamais deviner ce qu'elle visait.
    if (!garde) {
      if (lecture) return repondre(route, 200, [], { "content-range": "0-0/0" })
      return repondre(route, 400, { code: "BANC", message: "filtre non pris en charge : " + url.search, details: null, hint: null })
    }
    const choisies = () => lignes.filter(l => garde.every(f => f(l)))
    const unSeul = (req.headers()["accept"] || "").includes("pgrst.object")

    if (lecture) {
      let res = choisies()
      const ordre = url.searchParams.get("order")
      if (ordre) {
        const [col, sens] = ordre.split(".")
        res = [...res].sort((a, b) => (a[col] as number) > (b[col] as number) ? 1 : -1)
        if (sens === "desc") res.reverse()
      }
      const limite = url.searchParams.get("limit")
      if (limite) res = res.slice(0, Number(limite))
      if (unSeul) {
        if (res.length !== 1) return repondre(route, 406, { code: "PGRST116", message: "aucune ligne", details: null, hint: null })
        return repondre(route, 200, res[0])
      }
      return repondre(route, 200, res, { "content-range": `0-${Math.max(res.length - 1, 0)}/${res.length}` })
    }

    const corps = req.postData() ? JSON.parse(req.postData()!) : undefined
    ecritures.push({ methode, table, corps })
    if (refusees.has(table)) return repondre(route, 503, { code: "BANC", message: "base indisponible (simulée)", details: null, hint: null })
    const dater = (l: Ligne) => { if (table === "blocks") l.updated_at = date(); return l }

    // `.select()` après une écriture = « Prefer: return=representation » : PostgREST
    // renvoie alors les lignes écrites (v405 — l'éditeur confirme ainsi la page).
    const representation = (req.headers()["prefer"] || "").includes("return=representation")
    if (methode === "PATCH") {
      // Une RLS qui ne laisse rien écrire ne lève pas d'erreur : zéro ligne touchée.
      const ecrites = ignorees.has(table) ? [] : choisies().map(l => dater(Object.assign(l, corps)))
      return representation ? repondre(route, 200, ecrites) : repondre(route, 204, undefined)
    }
    if (methode === "DELETE") {
      const parties = new Set(choisies())
      tables[table] = lignes.filter(l => !parties.has(l))
      return repondre(route, 204, undefined)
    }
    if (methode === "POST") {
      const cle = url.searchParams.get("on_conflict")
      for (const neuve of (Array.isArray(corps) ? corps : [corps]) as Ligne[]) {
        const existante = cle ? lignes.find(l => l[cle] === neuve[cle]) : undefined
        if (existante) dater(Object.assign(existante, neuve))
        else lignes.push(dater({ id: neuve.id ?? `ligne-${lignes.length + 1}`, ...neuve }))
      }
      return repondre(route, 201, undefined)
    }
    return repondre(route, 405, { message: methode })
  }

  // Enregistrée APRÈS `connecter` : Playwright essaie la dernière route d'abord.
  await page.route(/supabase\.co\/rest\/v1\//, async route => {
    const req = route.request()
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" })
    const table = new URL(req.url()).pathname.split("/rest/v1/")[1]
    if (table === "profiles") return route.fallback()
    if (!["GET", "HEAD"].includes(req.method()) && retenues) { retenues.push(() => traiter(route)); return }
    return traiter(route)
  })

  return {
    tables: () => tables,
    ecritures,
    /** Les écritures suivantes restent sans réponse jusqu'à `relacher()`. */
    retenir() { retenues = [] },
    async relacher() { const r = retenues ?? []; retenues = null; for (const f of r) await f() },
    enAttente: () => retenues?.length ?? 0,
    /** Les écritures sur `table` échouent (503), comme une base injoignable. */
    refuser(table: string) { refusees.add(table) },
    /** Les mises à jour sur `table` « réussissent » sans toucher une ligne, comme une RLS qui refuse en silence. */
    ignorer(table: string) { ignorees.add(table) },
  }
}
