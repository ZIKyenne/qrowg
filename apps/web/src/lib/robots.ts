// robots.ts — distinguer un client debout devant une vitrine d'un programme qui
// suit un lien.
//
// Relevé du 13 septembre, en suivant ce qui se passe quand on scanne. La
// redirection `/q/<code>` écrit une ligne dans `scans` à CHAQUE requête. Elle
// lit pourtant déjà l'en-tête `User-Agent` — `parseDevice` en tire un
// « appareil », et cet appareil peut valoir **"bot"**.
//
// Autrement dit : le produit reconnaît le robot, l'écrit noir sur blanc dans la
// colonne `device`, et le compte quand même comme un scan. Le déclencheur SQL
// `increment_scan_counters` incrémente alors `qr_codes.total_scans`,
// `pages.total_views` et `profiles.total_scans`, et l'écran de statistiques
// l'additionne au reste.
//
// Qui suit un lien sans être un client : l'aperçu de WhatsApp, de Messenger, de
// Slack, de Discord, de Telegram, de LinkedIn ; les passerelles de messagerie
// qui ouvrent les liens avant de livrer le courrier (Safe Links, Proofpoint,
// Barracuda) ; les moteurs de recherche ; les outils en ligne de commande. Un
// commerçant qui partage son lien dans un groupe WhatsApp récolte un « scan »
// par aperçu — et sur un compte qui en compte trois, cela fait toute la mesure.
//
// La liste ci-dessous est faite de signatures réelles, vérifiées dans la garde
// sur des chaînes d'agent complètes. Module PUR.

/**
 * Signatures d'agents non humains. Volontairement large : mieux vaut ne pas
 * compter un visiteur douteux que compter un robot comme un client — une
 * statistique gonflée fait prendre de mauvaises décisions au commerçant, une
 * statistique prudente lui en fait seulement prendre moins vite.
 */
const SIGNATURES = [
  // Aperçus de messagerie et de réseaux sociaux
  "facebookexternalhit", "facebookcatalog", "whatsapp", "telegrambot", "slackbot",
  "slack-imgproxy", "discordbot", "twitterbot", "linkedinbot", "pinterest",
  "redditbot", "skypeuripreview", "viber", "line-poker", "snapchat", "applebot",
  "vkshare", "embedly", "quora link preview", "outbrain", "flipboard", "nuzzel",
  // Moteurs et indexeurs
  "googlebot", "bingbot", "yandex", "duckduckbot", "baiduspider", "sogou",
  "exabot", "ia_archiver", "ahrefsbot", "semrushbot", "mj12bot", "dotbot",
  "petalbot", "bytespider", "gptbot", "ccbot", "claudebot", "perplexitybot",
  // Passerelles de sécurité du courrier
  "safelinks", "proofpoint", "barracuda", "mimecast", "symantec", "forcepoint",
  "urlpreview", "microsoft office", "ms-office", "skypeuripreview",
  // Outils et robots génériques
  "curl/", "wget", "python-requests", "python-urllib", "go-http-client",
  "java/", "okhttp", "axios/", "node-fetch", "got (", "libwww-perl", "httpclient",
  "headlesschrome", "phantomjs", "puppeteer", "playwright", "lighthouse",
  "pingdom", "uptimerobot", "statuscake", "site24x7", "newrelicpinger",
  // Termes génériques, en dernier : ils attrapent ce que la liste ignore
  "bot", "crawler", "spider", "crawling", "slurp", "scraper", "preview", "monitor",
] as const

/** La valeur que `parseDevice` écrit dans la colonne `device` pour un programme. */
export const APPAREIL_ROBOT = "bot"

/**
 * Vrai quand la requête ne vient pas d'une personne. Un agent absent ou vide
 * compte AUSSI comme non humain : un navigateur en envoie toujours un, et une
 * requête anonyme sans agent est un programme.
 */
export function estUnRobot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent || "").trim().toLowerCase()
  if (!ua) return true
  return SIGNATURES.some(s => ua.includes(s))
}

/**
 * Le même jugement sur une ligne déjà enregistrée. Les scans écrits avant ce
 * lot portent `device: "bot"` : les exclure à la lecture répare l'historique
 * sans toucher à la base.
 */
export function ligneDeRobot(device: string | null | undefined): boolean {
  return (device || "").toLowerCase() === APPAREIL_ROBOT
}

// Côté base, le filtre s'écrit à la main : `.neq("device", APPAREIL_ROBOT)` sur
// TOUTE requête qui compte des scans ou des vues pour les montrer au commerçant.
// Les tables `scans` et `page_views` portent la colonne `device` ; une ligne
// « bot » y est un aperçu de lien, pas une visite, et fausse aussi bien un
// chiffre qu'un quota.
//
// Une aide générique (`sansRobots(requete)`) a été écrite puis retirée : sur les
// sélections larges et dans les tuples de `Promise.all`, l'inférence de son
// paramètre faisait dépasser à TypeScript sa profondeur d'instanciation
// (TS2589) — la compilation échouait. La constante suffit, et la garde
// `app/scansHonnetes.test.ts` vérifie qu'aucune requête ne l'oublie.
