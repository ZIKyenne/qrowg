// codeEnClair.ts — un code d'accès écrit EN CLAIR dans le texte d'un bloc.
//
// Audit UX v2 (SECT-005, 22 nov.). Le bloc « Infos séjour » a un champ « Code »
// prévu pour ça : masqué sur la page (« Afficher le code »), avec l'avertissement
// « changez-le entre deux séjours ». Mais rien n'empêche d'écrire « digicode
// 4521 » dans le champ « Accès » ou dans un bloc de texte — et là, le code
// s'affiche en toutes lettres à quiconque scanne le QR.
//
// On ne cherche QUE ce qui ressemble à un code de porte, de portail, de boîte
// à clés ou d'alarme suivi d'une suite de chiffres. Le mot de passe Wi-Fi n'en
// fait pas partie : le publier est le but du bloc Wi-Fi (un café le donne à
// ses clients). Une phrase sans chiffres (« le code vous sera envoyé par SMS »)
// ne déclenche rien.

import { typoFr } from "@/lib/typographieFr"

/** Champs où le code est À SA PLACE (masqué par le rendu) : jamais signalés. */
const CHAMPS_PREVUS = new Set(["code", "code_label"])

const MOT_DE_CODE = String.raw`(?:digicode|code\s+(?:de\s+(?:la\s+|l['’])?|du\s+|d['’])?(?:porte|portail|entr[ée]e|immeuble|bo[iî]te(?:\s+[àa]\s+cl[ée]s?)?|alarme|acc[eè]s|garage|cadenas)|bo[iî]te\s+[àa]\s+(?:cl[ée]s?|codes?)|keybox|key\s?box|lockbox)`
// Le code lui-même : 3 à 8 chiffres, éventuellement encadrés d'une lettre ou de # / *.
const CODE = String.raw`[A-Za-z]?\d{3,8}[A-Za-z#*]?`
const MOTIF = new RegExp(`(${MOT_DE_CODE})[^\\d\\n]{0,25}?(${CODE})(?![\\d])`, "i")

/** Le premier passage qui ressemble à un code en clair, ou null. */
export function codeEnClair(content: unknown): string | null {
  const textes: string[] = []
  const parcourir = (v: unknown, cle?: string) => {
    if (cle && CHAMPS_PREVUS.has(cle)) return
    if (typeof v === "string") textes.push(v)
    else if (Array.isArray(v)) v.forEach(x => parcourir(x))
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) parcourir(x, k)
  }
  parcourir(content)
  for (const t of textes) {
    const m = MOTIF.exec(t)
    if (m) return `${m[1]} ${m[2]}`.replace(/\s+/g, " ").trim()
  }
  return null
}

/** La phrase de l'alerte de publication (typoFr : « Digicode 4521 » ne se coupe pas après le guillemet). */
export function phraseCodeEnClair(extrait: string): string {
  return typoFr(`Code d'accès écrit en clair (« ${extrait} ») : toute personne qui scanne le QR le lira. Mettez-le dans le champ « Code » du bloc Infos séjour, masqué sur la page`)
}
