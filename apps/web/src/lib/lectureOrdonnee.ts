// lectureOrdonnee.ts — « prendre 50 000 lignes » sans dire lesquelles.
//
// Relevé du 14 septembre, en balayant les lectures de liste du produit.
//
// Vingt-six requêtes demandent un nombre maximum de lignes. Dix-sept disent
// AUSSI dans quel ordre — donc lesquelles. Neuf ne le disent pas :
//
//   analytics/page.tsx:64   blocks         .limit(LIM)
//   analytics/page.tsx:68   page_events    .limit(LIM)   engagement
//   analytics/page.tsx:73   page_events    .limit(LIM)   carte de chaleur
//   analytics/page.tsx:88   page_views     .limit(LIM)   attribution par support
//   analytics/page.tsx:89   block_clicks   .limit(LIM)   attribution par support
//   analytics/page.tsx:90   leads          .limit(LIM)   attribution par support
//   q/[code]/route.ts:380   blocks         .limit(60)
//   cron/relance:67         profiles       .limit(500)
//   lib/journalCron:140     cron_runs      .limit(1)
//
// `LIM` vaut 50 000. Sans `order by`, Postgres ne promet aucun ordre : « les
// 50 000 premières » n'existe pas, il rend 50 000 lignes, celles qu'il a sous la
// main. Deux conséquences, sur le même écran :
//
//   1. Un commerçant qui dépasse le plafond voit l'entonnoir de scroll, la carte
//      de chaleur et l'attribution par support CHANGER entre deux rafraîchis-
//      sements de la même période. Rien n'a bougé dans ses données.
//
//   2. Et surtout : sur cet écran, `page_views` et `block_clicks` (lignes 58 et
//      63) prennent bien les 50 000 PLUS RÉCENTS. Les six autres prennent une
//      tranche quelconque. Deux panneaux côte à côte ne décrivent donc pas les
//      mêmes événements — l'un mesure la période récente, l'autre un échantillon
//      arbitraire, et leurs totaux ne se recoupent pas.
//
// Le produit connaît le geste : dix-sept requêtes sur vingt-six l'appliquent, et
// chaque table a déjà SA colonne de temps dans le code existant. Ce module la
// nomme une fois pour toutes.
//
// C'est le frère du lot v89 : celui-là rendait le périmètre de mesure VISIBLE,
// celui-ci le rend DÉFINI.
//
// Module PUR.

/** Le plafond de lecture des événements. Repris tel quel de l'écran d'analyse. */
export const PLAFOND_MESURE = 50_000

/**
 * La colonne qui ordonne chaque table — celle que le produit utilise déjà
 * ailleurs, relevée dans le code existant plutôt qu'inventée ici.
 */
export const COLONNE_DORDRE: Record<string, { colonne: string; ascendant: boolean }> = {
  page_views:   { colonne: "viewed_at",  ascendant: false },
  block_clicks: { colonne: "clicked_at", ascendant: false },
  page_events:  { colonne: "created_at", ascendant: false },
  leads:        { colonne: "created_at", ascendant: false },
  scans:        { colonne: "scanned_at", ascendant: false },
  qr_codes:     { colonne: "created_at", ascendant: false },
  instant_qrs:  { colonne: "created_at", ascendant: false },
  profiles:     { colonne: "created_at", ascendant: false },
  cron_runs:    { colonne: "lance_le",   ascendant: false },
  instant_scan_events: { colonne: "scanned_at", ascendant: false },
  activity_logs:      { colonne: "created_at", ascendant: false },
  pages:              { colonne: "created_at", ascendant: false },
  // Un bloc n'a pas d'heure : son ordre est celui que le commerçant a composé.
  blocks:       { colonne: "position",   ascendant: true },
}

/** L'ordre à poser sur une lecture de cette table. `null` si on ne la connaît pas. */
export function ordreDeLecture(table: unknown): { colonne: string; ascendant: boolean } | null {
  const t = typeof table === "string" ? table.trim() : ""
  return COLONNE_DORDRE[t] ?? null
}

/** Les tables dont la lecture porte sur des événements mesurés. */
export function estUneTableDEvenements(table: unknown): boolean {
  const t = typeof table === "string" ? table.trim() : ""
  return ["page_views", "block_clicks", "page_events", "leads", "scans", "instant_scan_events"].includes(t)
}

/**
 * La tranche a-t-elle été coupée ?
 *
 * On compare au plafond demandé : autant de lignes que le plafond, c'est qu'il
 * y en avait probablement davantage. Le produit ne peut pas savoir combien —
 * et ce module ne le prétend pas.
 */
export function trancheCoupee(lues: unknown, plafond: number = PLAFOND_MESURE): boolean {
  const n = Number(lues)
  return Number.isFinite(n) && n >= plafond && plafond > 0
}

/**
 * Ce que l'écran dit quand la tranche a été coupée. `null` quand elle ne l'a pas
 * été : une précision inutile encombre plus qu'elle n'informe.
 *
 * On nomme ce qui est mesuré — « les 50 000 plus récents » — parce que c'est
 * maintenant vrai, et que c'est ce qui rend les panneaux comparables entre eux.
 */
export function phraseTranche(lues: unknown, plafond: number = PLAFOND_MESURE): string | null {
  if (!trancheCoupee(lues, plafond)) return null
  return `Mesure basée sur les ${plafond.toLocaleString("fr-FR")} événements les plus récents.`
}
