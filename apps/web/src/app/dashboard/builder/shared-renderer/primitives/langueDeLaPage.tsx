"use client"
// La langue des cartes, choisie UNE fois pour toute la page (vague 2, 23 nov.).
//
// Un resto à trois menus (Entrées, Plats, Desserts) n'aura pas trois barres de
// langues : la page en pose une seule, juste avant sa première carte traduite,
// et toutes ses cartes la suivent. Le choix est retenu sur le téléphone ; à la
// première visite, la langue du téléphone est proposée d'office.
//
// Hors d'une page publiée (éditeur, miniatures, bancs), pas de contexte : les
// blocs restent en français, et la carte illustrée garde sa propre barre.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { lire, ecrire } from "@/lib/memoireDuNavigateur"
import { LIBELLES, langueDuVisiteur, type CodeLangue } from "../models/traductionCarte"
import { languesDuBloc, traductionDuBloc } from "../models/traductionDesCartes"

/** La même mémoire que la carte illustrée : un choix fait là vaut ici. */
export const CLE_LANGUE = "qrowg.carte.langue"

type Langue = { langue: CodeLangue; offertes: CodeLangue[]; choisir: (l: CodeLangue) => void }
const Contexte = createContext<Langue | null>(null)

/** null hors d'une page publiée. */
export function useLangueDeLaPage(): Langue | null { return useContext(Contexte) }

export function LangueDeLaPage({ offertes, children }: { offertes: CodeLangue[]; children: ReactNode }) {
  // « fr » au rendu serveur ET au premier rendu client (pas d'écart d'hydratation),
  // puis la langue du visiteur au montage.
  const [langue, setLangue] = useState<CodeLangue>("fr")
  const cle = offertes.join(",")
  useEffect(() => {
    if (!offertes.length) return
    const choisie = lire(CLE_LANGUE)
    const prefs = [...(choisie ? [choisie] : []), ...(typeof navigator !== "undefined" ? navigator.languages ?? [navigator.language] : [])]
    setLangue(langueDuVisiteur(prefs, offertes))
  }, [cle]) // eslint-disable-line react-hooks/exhaustive-deps
  const choisir = (l: CodeLangue) => { setLangue(l); ecrire(CLE_LANGUE, l) }
  return <Contexte.Provider value={{ langue, offertes, choisir }}>{children}</Contexte.Provider>
}

/** La barre unique, aux couleurs du thème. Rien si la page n'offre aucune langue. */
export function BarreDesLangues({ theme }: { theme: { primary?: string; text?: string; muted?: string; fontBody?: string } }) {
  const l = useLangueDeLaPage()
  if (!l || l.offertes.length === 0) return null
  const L = LIBELLES[l.langue]
  return (
    <div role="group" aria-label={L.langue} data-barre-des-langues="" style={{
      display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", padding: "8px 16px 4px",
      ["--carte-texte" as string]: theme.text || "#F5F0E8", ["--carte-ligne" as string]: "color-mix(in srgb, currentColor 22%, transparent)",
      ["--carte-police" as string]: theme.fontBody || "inherit", ["--carte-accent" as string]: theme.primary || "#C9A84C", ["--carte-discret" as string]: theme.muted || "#8A8478",
      color: theme.text || "#F5F0E8",
    }}>
      {(["fr", ...l.offertes] as CodeLangue[]).map(code => (
        <button key={code} type="button" lang={code} aria-pressed={l.langue === code} title={LIBELLES[code].nom}
          className={l.langue === code ? "carte-pastille carte-pastille--on" : "carte-pastille"} onClick={() => l.choisir(code)}>
          {LIBELLES[code].nom}
        </button>
      ))}
    </div>
  )
}

/**
 * Pour un bloc de carte : sa traduction dans la langue de la page, ses libellés
 * (« Épuisé », « Allergènes »), et les attributs lang/dir de son contenu (l'arabe
 * se lit de droite à gauche). En français — ou hors d'une page publiée — rien ne change.
 */
export function useCarteTraduite(content: Record<string, any> | null | undefined) {
  const l = useLangueDeLaPage()
  const langue: CodeLangue = l && languesDuBloc(content).includes(l.langue) ? l.langue : "fr"
  const L = LIBELLES[langue]
  return {
    langue,
    t: traductionDuBloc(content, langue),
    libelles: { epuise: L.epuise, allergenes: `${L.allergenes}${langue === "fr" ? " : " : ": "}` },
    attrs: langue === "fr" ? {} : { lang: langue, dir: L.dir },
  }
}
