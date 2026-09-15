// typographieFr.ts — le produit parle français, ses espaces aussi.
//
// Relevé du 14 septembre, en balayant toutes les chaînes du produit et en
// classant l'espace qui précède chaque signe double :
//
//   signe   espace insécable   espace ordinaire   aucune espace
//     %             0                  65              453
//     €             0                 148              101
//     ?             0               2 256               92
//     !             0                  71               19
//     «             0                 297                0
//
// **Zéro.** Pas une seule espace insécable dans tout le produit.
//
// Deux défauts, pas un :
//
// 1) Les 453 « 12% » et 101 « 12€ » n'ont pas d'espace du tout. En français,
//    elle n'est pas optionnelle. Et le produit s'en sait : 65 endroits écrivent
//    « 12 % ». Le même signe s'écrit donc de deux façons dans le même écran.
//
// 2) Les 2 256 autres ont une espace ORDINAIRE, qui casse. Sur un téléphone —
//    là où le commerçant lit ses alertes — une confirmation se rend ainsi :
//
//        Supprimer « Menu du midi »
//        ?
//
//    ou une jauge :
//
//        Vous en êtes à 1 240 / 1 500 vues (82
//        %)
//
//    Le signe part seul à la ligne. C'est exactement ce que l'espace insécable
//    existe pour empêcher.
//
// On ne corrige pas 3 000 chaînes à la main : on corrige les quatre endroits par
// lesquels les phrases du produit passent pour être rendues — l'infobulle, la
// confirmation, la coquille des e-mails, et le module des chiffres. Une phrase
// écrite ailleurs traverse l'un des quatre.
//
// Module PUR.

/** Espace fine insécable — avant `; ! ? %`, comme le veut l'usage. */
export const FINE = " "
/** Espace insécable — avant `:`, autour des guillemets, devant une unité. */
export const INSECABLE = " "

/** Les deux espaces insécables, pour reconnaître ce qui est déjà correct. */
const DEJA = `${FINE}${INSECABLE}`

// Ce qu'on ne touche jamais : une adresse web, une adresse e-mail, une balise,
// et **une entité HTML**. `:` et `?` y sont de la syntaxe, pas de la ponctuation.
//
// L'entité manquait, et le `;` qui la termine ressemblait à une ponctuation
// française : `escapeHtml("Bar & Co")` donne `Bar &amp; Co`, que cette règle
// réécrivait en `Bar &amp ; Co`. Le commerçant recevait un e-mail intitulé
// « Nouveau message sur Bar &amp ; Co » — son propre nom, abîmé par la règle
// censée bien écrire son français (lot v125).
const INTOUCHABLE = /(https?:\/\/[^\s<>"']+|[\w.+-]+@[\w-]+\.[\w.]+|<[^>]+>|\{[^}]*\}|&(?:[a-zA-Z][a-zA-Z0-9]{1,9}|#\d{1,6}|#x[0-9a-fA-F]{1,6});)/g

/**
 * Le signe suit un caractère de texte, et il est bien en fin de mot (suivi d'une
 * espace, d'une fin, ou d'une ponctuation fermante) — pas au milieu d'un code.
 */
const finDeMot = `(?=$|[\\s.,)\\]»"'<])`

function corrigerMorceau(t: string): string {
  let s = t

  // ── `; ! ? %` : espace fine insécable ────────────────────────────────────
  // Le caractère précédent doit être du texte : on ne touche ni « ?? » ni « !! ».
  s = s.replace(new RegExp(`([^\\s${DEJA}!?%;])[ ]?([;!?])${finDeMot}`, "g"), `$1${FINE}$2`)
  // Le mot précédent peut être dans le morceau d'avant — une adresse web, par
  // exemple : « …@qrowg.com ! » arrivait ici comme une espace puis le signe.
  s = s.replace(new RegExp(`^[ ]([;!?])${finDeMot}`), `${FINE}$1`)

  // `%` : seulement après un chiffre. « 100% » devient « 100 % », mais un nom de
  // variable ou un modulo resté dans une chaîne n'est pas réécrit.
  s = s.replace(new RegExp(`(\\d)[ ]?%${finDeMot}`, "g"), `$1${FINE}%`)

  // ── `€` : espace insécable, c'est une unité qui suit son nombre ──────────
  s = s.replace(new RegExp(`(\\d)[ ]?€`, "g"), `$1${INSECABLE}€`)

  // ── `:` : espace insécable, mais jamais dans une heure ni un rapport ─────
  // « Horaires : 12:30 » — le premier prend l'espace, le second non.
  s = s.replace(new RegExp(`([^\\s${DEJA}:\\d])[ ]?:(?=\\s|$)`, "g"), `$1${INSECABLE}:`)

  // ── Guillemets français : l'espace intérieure ne doit jamais casser ──────
  s = s.replace(new RegExp(`«[ ${DEJA}]?`, "g"), `«${INSECABLE}`)
  s = s.replace(new RegExp(`[ ${DEJA}]?»`, "g"), `${INSECABLE}»`)

  return s
}

/**
 * Une phrase du produit, avec les espaces que le français demande.
 *
 * Idempotente : une chaîne déjà correcte en ressort identique — c'est ce qui
 * permet de l'appliquer au point de rendu sans savoir ce qui a déjà été fait en
 * amont. Les adresses web, les adresses e-mail et les balises HTML traversent
 * sans être touchées.
 */
export function typoFr(valeur: unknown): string {
  if (typeof valeur !== "string" || !valeur) return typeof valeur === "string" ? valeur : ""
  // On découpe sur les morceaux intouchables et on ne corrige que le reste.
  const morceaux = valeur.split(INTOUCHABLE)
  return morceaux
    .map((m, i) => (i % 2 === 1 ? m : corrigerMorceau(m)))
    .join("")
}

/** Vrai si la chaîne est déjà écrite comme il faut — pour les gardes. */
export function typographieCorrecte(valeur: unknown): boolean {
  return typeof valeur === "string" ? typoFr(valeur) === valeur : true
}

/**
 * Ce qu'il manque, dit en clair — pour qu'un test n'affiche pas deux chaînes
 * visuellement identiques dont une seule est juste.
 */
export function ecartsDeTypographie(valeur: string): string[] {
  const ecarts: string[] = []
  if (/[^\s  ][;!?](?=$|[\s.,)\]»"'<])/.test(valeur)) ecarts.push("espace manquante avant ; ! ou ?")
  if (/\d%/.test(valeur)) ecarts.push("espace manquante avant %")
  if (/\d€/.test(valeur)) ecarts.push("espace manquante avant €")
  if (/ [;!?%€»]/.test(valeur)) ecarts.push("espace ordinaire là où il faut une insécable")
  if (/« /.test(valeur)) ecarts.push("espace ordinaire après «")
  return ecarts
}
