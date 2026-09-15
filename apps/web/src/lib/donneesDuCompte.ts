// donneesDuCompte — ce que le compte possède, et que l'export doit rendre.
//
// Relevé du 15 septembre. Le schéma compte **vingt-sept** tables. Vingt et une
// portent les données d'un compte — par `user_id`, ou par la page ou le QR
// auxquels elles se rattachent. L'export RGPD (`/api/account/export`) en lit
// **cinq** : `profiles`, `pages`, `blocks`, `qr_codes`, `leads`.
//
// Ce qui manque n'est pas accessoire, c'est ce pour quoi il paie :
//
//   scans, page_views, block_clicks, page_events   ses statistiques
//   instant_qrs, instant_scan_events               ses QR directs et leurs scans
//   conversion_goals                               ses objectifs
//   domain_verifications, domain_redirects, domain_routes   ses domaines
//   report_subscriptions                           ses rapports
//   print_presets, print_brand_kit                 ses modèles d'impression, sa charte
//   activity_logs, api_keys, api_usage             son journal, ses clés, sa consommation
//   team_members, team_invitations                 son équipe
//   subscriptions                                  son abonnement
//
// Un commerçant qui demande ses données reçoit ses pages et ses messages, et
// repart sans une seule ligne de mesure — c'est-à-dire sans ce qu'il a mis deux
// ans à construire. Le droit à la portabilité (RGPD art. 20) porte sur les
// données qu'il a fournies ET celles que le service a observées à son sujet.
//
// L'autre moitié est saine, et il faut le dire : la SUPPRESSION efface bien
// tout. `profiles.id` référence `auth.users(id) on delete cascade`, et chaque
// table du compte casse en cascade depuis `profiles`. `teams` est en
// `on delete restrict` — c'est pour ça que la route le supprime d'abord.
// Le produit sait donc effacer ce qu'il ne sait pas rendre.
//
// La règle posée : **ce que le produit garde, il doit savoir le rendre.**

/** Comment une table se rattache au compte. */
export type Rattachement =
  | { par: "id" }              // la ligne EST le compte (profiles)
  | { par: "user_id" }         // colonne directe
  | { par: "page_id" }         // via les pages du compte
  | { par: "qr_code_id" }      // via ses QR de page
  | { par: "instant_qr_id" }   // via ses QR directs

export type TableDuCompte = {
  table: string
  /** Ce que la table contient, dit au propriétaire — pas au développeur. */
  quoi: string
  rattachement: Rattachement
  /**
   * Colonnes retirées de l'export. Un secret n'est pas une donnée à rendre :
   * la clé d'API est un moyen d'accès, et la réexporter en clair transformerait
   * un fichier téléchargé en trousseau. On rend son existence, sa date, son
   * préfixe visible — jamais son empreinte.
   */
  colonnesRetirees?: string[]
  /** Renseignée uniquement quand la table n'est PAS exportée, avec sa raison. */
  raisonDAbsence?: string
}

/**
 * Le plafond par table. Un export n'est pas une sauvegarde : il doit tenir dans
 * un fichier qu'on peut ouvrir. Les tables d'événements sont les seules à
 * pouvoir compter des centaines de milliers de lignes ; on rend les plus
 * récentes, et l'export DIT qu'il a coupé (lot v106 : une mesure partielle qui
 * ne le dit pas est une mesure fausse).
 */
export const PLAFOND_PAR_TABLE = 50_000

export const DONNEES_DU_COMPTE: TableDuCompte[] = [
  { table: "profiles",             quoi: "Votre profil",                          rattachement: { par: "id" } },
  { table: "pages",                quoi: "Vos pages",                             rattachement: { par: "user_id" } },
  { table: "blocks",               quoi: "Le contenu de vos pages",               rattachement: { par: "page_id" } },
  { table: "qr_codes",             quoi: "Vos QR de page et leurs supports",      rattachement: { par: "user_id" } },
  { table: "instant_qrs",          quoi: "Vos QR directs",                        rattachement: { par: "user_id" } },
  { table: "leads",                quoi: "Les messages reçus sur vos pages",      rattachement: { par: "page_id" } },
  { table: "scans",                quoi: "Les scans de vos QR",                   rattachement: { par: "page_id" } },
  { table: "instant_scan_events",  quoi: "Les scans de vos QR directs",           rattachement: { par: "user_id" } },
  { table: "page_views",           quoi: "Les visites de vos pages",              rattachement: { par: "page_id" } },
  { table: "block_clicks",         quoi: "Les clics sur vos blocs",               rattachement: { par: "page_id" } },
  { table: "page_events",          quoi: "Le détail de lecture de vos pages",     rattachement: { par: "page_id" } },
  { table: "conversion_goals",     quoi: "Vos objectifs",                         rattachement: { par: "user_id" } },
  { table: "report_subscriptions", quoi: "Vos rapports programmés",               rattachement: { par: "user_id" } },
  { table: "domain_verifications", quoi: "Vos domaines",                          rattachement: { par: "user_id" } },
  { table: "domain_redirects",     quoi: "Vos redirections",                      rattachement: { par: "user_id" } },
  { table: "domain_routes",        quoi: "Les routes de vos domaines",            rattachement: { par: "user_id" } },
  { table: "print_presets",        quoi: "Vos modèles d'impression",              rattachement: { par: "user_id" } },
  { table: "print_brand_kit",      quoi: "Votre charte graphique",                rattachement: { par: "user_id" } },
  { table: "activity_logs",        quoi: "Votre journal d'activité",              rattachement: { par: "user_id" } },
  { table: "api_usage",            quoi: "Votre consommation d'API",              rattachement: { par: "user_id" } },
  { table: "api_keys",             quoi: "Vos clés d'API",                        rattachement: { par: "user_id" },
    colonnesRetirees: ["key_hash", "hash", "secret"] },
  { table: "subscriptions",        quoi: "Votre abonnement",                      rattachement: { par: "user_id" },
    colonnesRetirees: ["stripe_customer_id", "stripe_subscription_id"] },
  { table: "team_members",         quoi: "Votre équipe",                          rattachement: { par: "user_id" } },

  // ── Ce qui n'est PAS exporté, et pourquoi ─────────────────────────────────
  { table: "teams",             quoi: "Les équipes",             rattachement: { par: "user_id" },
    raisonDAbsence: "L'équipe appartient à plusieurs personnes : `team_members` rend votre appartenance, pas le dossier des autres." },
  { table: "team_invitations",  quoi: "Les invitations d'équipe", rattachement: { par: "user_id" },
    raisonDAbsence: "Une invitation porte l'adresse de quelqu'un d'autre. Rendre celle qu'on a envoyée reviendrait à rendre son carnet d'adresses." },
  { table: "referrals",         quoi: "Les parrainages",          rattachement: { par: "user_id" },
    raisonDAbsence: "Une ligne relie deux comptes : l'exporter d'un côté révélerait l'autre." },
  { table: "plan_domain_limits", quoi: "La grille des plans",     rattachement: { par: "user_id" },
    raisonDAbsence: "Table de référence du produit, identique pour tout le monde : ce ne sont pas vos données." },
]

/** Les tables que l'export doit rendre. */
export function tablesAExporter(): TableDuCompte[] {
  return DONNEES_DU_COMPTE.filter(t => !t.raisonDAbsence)
}

/**
 * Les grandes familles de l'export, telles qu'on les nomme à celui qui
 * télécharge. L'écran Réglages promettait « profil, pages, blocs, QR codes et
 * messages reçus » — c'est-à-dire exactement les cinq tables qui étaient lues.
 * La promesse et le contenu ne peuvent plus diverger : la phrase se fabrique
 * ici, et chaque table rendue doit trouver sa famille.
 */
export const FAMILLES: { nom: string; tables: string[] }[] = [
  { nom: "profil",             tables: ["profiles"] },
  { nom: "pages et contenus",  tables: ["pages", "blocks"] },
  { nom: "QR codes",           tables: ["qr_codes", "instant_qrs"] },
  { nom: "messages reçus",     tables: ["leads"] },
  { nom: "statistiques",       tables: ["scans", "instant_scan_events", "page_views", "block_clicks", "page_events", "conversion_goals"] },
  { nom: "domaines",           tables: ["domain_verifications", "domain_redirects", "domain_routes"] },
  { nom: "impressions",        tables: ["print_presets", "print_brand_kit"] },
  { nom: "rapports et API",    tables: ["report_subscriptions", "api_keys", "api_usage", "activity_logs"] },
  { nom: "abonnement et équipe", tables: ["subscriptions", "team_members"] },
]

/** La phrase de l'écran : ce que le fichier contient, sans rien promettre de plus. */
export function phraseDeLExport(): string {
  const noms = FAMILLES.map(f => f.nom)
  return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`
}

/** Ce qu'on ne rend pas, et pourquoi — dit dans l'export lui-même. */
export function tablesEcartees(): { quoi: string; raison: string }[] {
  return DONNEES_DU_COMPTE.filter(t => t.raisonDAbsence).map(t => ({ quoi: t.quoi, raison: t.raisonDAbsence! }))
}

/** Retire d'un lot de lignes les colonnes qui ne se rendent pas. */
export function sansLesSecrets<T extends Record<string, unknown>>(lignes: T[] | null | undefined, colonnes?: string[]): T[] {
  const l = lignes ?? []
  if (!colonnes?.length) return l
  return l.map(ligne => {
    const copie = { ...ligne }
    for (const c of colonnes) delete (copie as Record<string, unknown>)[c]
    return copie
  })
}

/** La phrase de l'export quand une table a été coupée. `null` quand rien ne l'a été. */
export function phraseExportCoupe(coupees: string[]): string | null {
  if (!coupees.length) return null
  return `Les ${PLAFOND_PAR_TABLE.toLocaleString("fr-FR")} lignes les plus récentes ont été retenues pour : ${coupees.join(", ")}.`
}
