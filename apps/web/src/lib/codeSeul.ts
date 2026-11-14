// Lire du code sans lire ce qu'on en a écrit.
//
// ── Pourquoi ce fichier existe ────────────────────────────────────────────
//
// Beaucoup de gardes de ce dépôt lisent du SOURCE : « le `fetch` doit poser
// `redirect: "manual"` », « aucune page ne doit poser deux `<main>` », « ce
// tarif ne doit apparaître nulle part à l'écran ». Toutes ont le même piège :
// un fichier explique souvent EN COMMENTAIRE ce qu'il se garde de faire, et la
// garde lit cette explication comme du code.
//
// Ce n'est pas une hypothèse. C'est arrivé trois fois le même jour :
//
//   · `lienQuiJoint` sautait les commentaires de ligne mais pas l'ouverture
//     d'un bloc `/**` ;
//   · deux gardes neuves criaient sur le commentaire qui expliquait pourquoi
//     `redirect: "follow"` serait dangereux.
//
// Une garde qu'un commentaire fait crier apprend à ne plus commenter. C'est le
// pire effet possible d'un filet de sécurité : il décourage d'écrire pourquoi.
//
// ── Pourquoi un vrai balayage, et pas une expression régulière ─────────────
//
// Le dépôt avait quatre conventions concurrentes, toutes incomplètes :
//
//   1. `/^\s*\/\/.*$/gm`    — rate `code() // explication` en fin de ligne ;
//   2. `/\/\/[^\n]*/g`      — PIRE : mange la fin de toute ligne contenant
//                              `https://`, donc ampute du code qu'elle devait
//                              examiner, en silence ;
//   3. `/\/\*[\s\S]*?\*\//g` seul — laisse passer les commentaires de ligne ;
//   4. un balayeur caractère par caractère, correct, mais enfermé dans un seul
//      fichier de test et aveugle aux apostrophes françaises.
//
// Les cas 2 et 4 ne font pas « un peu moins bien » : ils EFFACENT du code. Une
// garde qui lit un fichier amputé ne crie pas — elle se tait. C'est une
// protection qui disparaît sans rien dire, et c'est exactement ce que ce
// fichier existe pour empêcher.
//
// ── Ce que ce module garantit ─────────────────────────────────────────────
//
//   · les longueurs et les numéros de ligne sont PRÉSERVÉS : tout est blanchi
//     sur place, jamais supprimé, donc un `indexOf` reste utilisable ;
//   · un `//` dans une chaîne n'est pas un commentaire ;
//   · un `//` collé à un `:` n'est pas un commentaire — c'est `https://`, qui
//     apparaît aussi en texte JSX, hors de toute chaîne ;
//   · une apostrophe française ne mange pas le reste du fichier ;
//   · un antislash hors chaîne est une échappée : `/\/\//` reste intact.
//
// ── Ce qu'il ne prétend pas être ──────────────────────────────────────────
//
// Pas un analyseur syntaxique. Deux limites connues et assumées :
//
//   · une expression `${…}` à l'intérieur d'un gabarit est traitée comme du
//     contenu de chaîne, pas comme du code (sans effet sur l'équilibre des
//     accolades : l'ouvrante et la fermante disparaissent ensemble) ;
//   · un guillemet ou un accent grave isolé en texte JSX ouvre une fausse
//     chaîne, bornée à la fin de la ligne.
//
// Les deux coûteraient un vrai analyseur. Aucune garde de ce dépôt n'en dépend.

type Options = {
  /**
   * Blanchir aussi le CONTENU des chaînes.
   *
   * À n'utiliser que pour une analyse de STRUCTURE (compter des accolades,
   * trouver un `return`) : une garde qui cherche un texte affiché — un tarif,
   * une promesse, une URL — doit garder les chaînes, puisque c'est là qu'il
   * vit.
   */
  chaines?: boolean
}

function balayer(src: string, chaines: boolean): string {
  const out = src.split("")
  // Blanchir, jamais supprimer : les numéros de ligne et les positions
  // restent justes, donc un `slice(indexOf(…))` continue de désigner la bonne
  // portion du fichier.
  const blanchir = (de: number, a: number) => {
    for (let k = Math.max(0, de); k < a && k < out.length; k++) if (out[k] !== "\n") out[k] = " "
  }

  let i = 0
  while (i < src.length) {
    const c = src[i]
    const d = src[i + 1]

    // Un antislash hors chaîne ne peut être qu'une échappée d'expression
    // régulière. Le consommer avec le caractère suivant évite de lire le
    // second slash de `/\/\//` comme le début d'un commentaire.
    if (c === "\\") { i += 2; continue }

    if (c === "/" && d === "/") {
      // `https://` : en texte JSX, l'URL n'est dans aucune chaîne. Un vrai
      // commentaire ne se colle jamais à un `:` sans espace.
      if (src[i - 1] === ":") { i += 2; continue }
      let fin = src.indexOf("\n", i)
      if (fin < 0) fin = src.length
      blanchir(i, fin)
      i = fin
      continue
    }

    if (c === "/" && d === "*") {
      const trouve = src.indexOf("*/", i + 2)
      const fin = trouve < 0 ? src.length : trouve + 2
      blanchir(i, fin)
      i = fin
      continue
    }

    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1
      let fermee = false
      while (j < src.length) {
        if (src[j] === "\\") { j += 2; continue }
        if (src[j] === c) { fermee = true; break }
        // Une chaîne ordinaire ne traverse pas une ligne. Sans cette borne,
        // l'apostrophe de « l'adresse » en texte JSX ouvrirait une chaîne qui
        // avalerait tout jusqu'à la suivante — des centaines de lignes de code
        // soustraites à l'examen, sans un mot.
        if (c !== "`" && src[j] === "\n") break
        j++
      }
      if (chaines) blanchir(i + 1, j)
      i = fermee ? j + 1 : j
      continue
    }

    i++
  }

  return out.join("")
}

/**
 * Le code, sans les commentaires — chaînes intactes.
 *
 * C'est la forme par défaut : une garde cherche presque toujours quelque chose
 * d'écrit dans le code OU affiché depuis une chaîne.
 */
export function sansCommentaires(src: string, o: Options = {}): string {
  return balayer(src ?? "", o.chaines === true)
}

/**
 * Le code, sans les commentaires NI le contenu des chaînes.
 *
 * Pour les gardes qui analysent la structure : un `{` dans un message
 * d'erreur, un `return` dans un texte d'aide ou un `//` dans une URL ne sont
 * pas du code, et les compter fausse le verdict.
 */
export function sansCommentairesNiChaines(src: string): string {
  return balayer(src ?? "", true)
}
