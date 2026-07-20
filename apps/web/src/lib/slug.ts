// Source unique de la generation de slug (etait dupliquee dans 4 fichiers).
// Sans dependance serveur -> importable client ET serveur.

// Slug de base, deterministe et pur : retire les accents (NFD), passe en
// minuscules, remplace tout caractere non alphanumerique par "-", supprime les
// "-" en debut/fin, et borne la longueur.
export function slugifyBase(input = "", maxLen = 50): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")     // tout le reste -> "-"
    .replace(/^-+|-+$/g, "")         // pas de "-" au debut/fin
    .slice(0, maxLen)
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

// Slug unique cote serveur : base nettoyee (repli "page" si trop courte) +
// suffixe aleatoire. Respecte la contrainte slug_format ^[a-z0-9_-]{2,60}$.
export function slugifyUnique(input?: string): string {
  const base = slugifyBase(input || "page", 50)
  const safeBase = base.length >= 2 ? base : "page"
  return `${safeBase}-${randomSuffix()}`
}
