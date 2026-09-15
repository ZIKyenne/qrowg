// travailNonEnregistre — ce que le commerçant a composé et pas encore enregistré.
//
// Relevé du 15 septembre. Treize écrans du produit tiennent une saisie et
// l'écrivent en base. **Un seul prévient avant de la perdre** : le builder.
//
//   app/dashboard/print-studio/PrintStudioClient.tsx   45 réglages   —
//   app/dashboard/qr-link/page.tsx                     23 réglages   —
//   app/dashboard/builder/BuilderV4.tsx                20 réglages   oui
//   app/generateur-qr-code/GeneratorClient.tsx         18 réglages   —
//   app/dashboard/qr-codes/QRStudio.tsx                18 réglages   —
//   app/dashboard/profile/page.tsx                     15 réglages   —
//   app/dashboard/settings/page.tsx                    10 réglages   —
//   app/dashboard/qr-codes/QRStudioZero.tsx            10 réglages   (enregistre au fil)
//
// L'atelier d'impression est le pire cas : quarante-cinq réglages — mise en page,
// couleurs, logo, format, charte — composés pendant de longues minutes, et un
// clic sur « Mes QR codes » les efface sans un mot. Le commerçant ne sait même
// pas ce qu'il vient de perdre : rien ne lui avait dit qu'il y avait quelque
// chose à perdre.
//
// La règle posée : **un écran qui tient une saisie non écrite le dit avant de
// la perdre.**
//
// Ce module ne remplace pas le geste du builder, il le sort de là où il était
// enfermé — `dirty` + `beforeunload` — pour que les autres ateliers l'aient
// aussi. Module PUR : la partie React vit dans `useTravailNonEnregistre`.

/**
 * L'empreinte d'une saisie : un JSON dont les clés sont triées, pour que deux
 * objets identiques au désordre près se ressemblent. Ce qui ne se sérialise pas
 * (fonction, cycle, Date) ne fait pas perdre de travail : on retombe sur une
 * empreinte vide plutôt que de lever — une comparaison qui explose ferait bien
 * plus de dégâts que celle qu'elle remplace.
 */
export function empreinte(valeur: unknown): string {
  try {
    return JSON.stringify(valeur, (_, v) => {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const o = v as Record<string, unknown>
        return Object.keys(o).sort().reduce<Record<string, unknown>>((acc, k) => { acc[k] = o[k]; return acc }, {})
      }
      return v
    }) ?? ""
  } catch {
    return ""
  }
}

/**
 * Reste-t-il du travail non enregistré ?
 *
 * `reference` est `null` tant que l'écran n'a pas dit « voilà ce qui est
 * enregistré ». Tant qu'elle l'est, on répond non : un écran qui oublie de poser
 * sa référence retombe sur le comportement d'avant — silencieux — au lieu
 * d'avertir à tort, ce qui serait pire que le défaut qu'on corrige.
 */
export function travailPerdu(actuel: unknown, reference: string | null): boolean {
  if (reference === null) return false
  return empreinte(actuel) !== reference
}

/**
 * Ce qu'on dirait si les navigateurs écoutaient encore. Ils affichent tous leur
 * propre phrase depuis 2017 — la nôtre reste écrite ici pour qu'un écran qui
 * veut le dire lui-même (une modale de confirmation, un bandeau) dise la même
 * chose que les autres.
 */
export const PHRASE_TRAVAIL_PERDU =
  "Des modifications ne sont pas enregistrées. Si vous quittez maintenant, elles seront perdues."
