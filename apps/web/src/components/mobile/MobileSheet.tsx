"use client"

// MobileSheet — LA feuille montante du produit. Une seule implémentation.
//
// ── D'où elle vient ────────────────────────────────────────────────────────
//
// De `app/dashboard/builder/MobileBottomSheet.tsx`, écrite en juillet 2026 et
// réglée avec de vraies captures sur un vrai iPhone : rôle de dialogue, piège
// de focus, Échap, focus rendu au déclencheur, trois paliers accessibles au
// bouton (pas seulement au geste), corps défilant avec `minHeight: 0` — le
// défaut de flexbox qui, sans lui, empêche iOS de faire défiler le contenu —,
// safe area, et variante latérale en paysage pour garder le canvas visible.
//
// Tout cela est conservé. Elle n'avait qu'un défaut : elle vivait sous
// `dashboard/builder/`, donc UN écran sur dix-huit en profitait. Les autres
// ouvrent des fenêtres centrées, ou rien.
//
// ── Ce qui est corrigé en la promouvant ────────────────────────────────────
//
// 1. **Les règles des hooks.** L'original faisait `if (!open) return null`
//    AVANT `useCallback` et `useDialogue` : moins de hooks fermée qu'ouverte.
//    React exige un nombre de hooks constant d'un rendu à l'autre. Le dépôt n'a
//    AUCUNE configuration ESLint, donc rien ne l'a signalé.
//    Je n'ai pas réussi à le faire planter au navigateur et je ne prétendrai
//    pas qu'il plantait en production — mais c'est une violation, elle ne coûte
//    rien à corriger, et on ne laisse pas une bombe amorcée dans une primitive
//    qu'on s'apprête à poser partout.
//
// 2. **Le verrou de défilement du fond**, robuste iOS. `overflow: hidden` sur
//    `body` ne suffit pas sur iPhone : il faut `position: fixed` et un décalage,
//    puis restaurer. C'est une régression déjà vécue dans ce dépôt (3e audit
//    mobile de juillet, P0).
//
// 3. **Le bouton retour du téléphone ferme la feuille** au lieu de quitter
//    l'écran, par `history.pushState` + `popstate`.
//
// 4. **`overscroll-behavior: contain`** : il n'y en avait plus qu'UN seul dans
//    tout le dépôt. Sans lui, arriver au bout du contenu fait défiler la page
//    derrière.
//
// 5. **La poignée se tire vraiment.** L'original la marquait « décoratif » :
//    elle a l'air de se tirer et ne se tire pas. Une poignée qui ment coûte
//    plus cher qu'une poignée absente. Les boutons de palier restent : le geste
//    n'est jamais le SEUL chemin, conformément au brief.

import { useDialogue } from "@/components/ui/useDialogue"
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react"
import {
  FRACTION_TAILLE, type TailleFeuille, glissementFerme, tailleApresGlissement,
  laFeuilleSuitLeDoigt,
} from "./feuilleMobile"

export interface MobileSheetProps {
  open: boolean
  /** Titre visible. Il NOMME la fenêtre (`aria-labelledby`), d'où le ReactNode :
   *  une fenêtre dont le titre porte une icône ou un compteur reste nommée par
   *  ce qu'on lit, pas par une chaîne recopiée à côté. */
  titre: ReactNode
  taille: TailleFeuille
  onTaille: (t: TailleFeuille) => void
  onFermer: () => void
  /** Applique la safe area basse (quand aucune barre ne la porte déjà). */
  safeAreaBasse?: boolean
  /** Paysage téléphone : feuille latérale, pour garder le contenu visible. */
  laterale?: boolean
  /**
   * `absolute` quand la feuille appartient à une coquille qui la contient
   * (l'éditeur), `fixed` quand elle appartient à l'écran. Par défaut `fixed` :
   * c'est le cas général, et une primitive ne doit pas supposer qu'un ancêtre
   * la cadre.
   */
  ancrage?: "fixed" | "absolute"
  /** Boutons de palier. `false` quand la feuille n'a qu'une taille utile —
   *  une fenêtre de confirmation ne se réduit pas. */
  paliers?: boolean
  /** Pied collé en bas, hors du défilement : les actions restent atteignables
   *  quel que soit le contenu, y compris clavier ouvert. */
  piedDePage?: ReactNode
  children: ReactNode
}

const PALIERS_UI: { id: TailleFeuille; label: string }[] = [
  { id: "compact", label: "Réduit" }, { id: "medium", label: "Moyen" }, { id: "expanded", label: "Plein" },
]

/** Verrou de fond robuste iOS : `overflow: hidden` ne suffit pas sur iPhone. */
function useFondVerrouille(actif: boolean): void {
  useEffect(() => {
    if (!actif) return
    const y = window.scrollY
    const b = document.body
    const avant = { position: b.style.position, top: b.style.top, width: b.style.width, overflow: b.style.overflow }
    b.style.position = "fixed"
    b.style.top = `-${y}px`
    b.style.width = "100%"
    b.style.overflow = "hidden"
    return () => {
      b.style.position = avant.position
      b.style.top = avant.top
      b.style.width = avant.width
      b.style.overflow = avant.overflow
      window.scrollTo(0, y)
    }
  }, [actif])
}

/** Le bouton retour du téléphone ferme la feuille, il ne quitte pas l'écran. */
function useRetourFerme(actif: boolean, fermer: () => void): void {
  const fermerRef = useRef(fermer)
  fermerRef.current = fermer
  useEffect(() => {
    if (!actif) return
    // Un seul état poussé par ouverture. `popstate` arrive quand l'utilisateur
    // appuie sur retour ; on ferme, on ne navigue pas.
    history.pushState({ feuilleMobile: true }, "")
    const surRetour = () => fermerRef.current()
    window.addEventListener("popstate", surRetour)
    return () => {
      window.removeEventListener("popstate", surRetour)
      // Fermeture par un autre chemin (croix, Échap, scrim) : on retire l'état
      // qu'on avait poussé, sinon le bouton retour devient inopérant une fois.
      if (history.state?.feuilleMobile) history.back()
    }
  }, [actif])
}

export function MobileSheet({
  open, titre, taille, onTaille, onFermer,
  safeAreaBasse, laterale, ancrage = "fixed", paliers = true, piedDePage, children,
}: MobileSheetProps) {
  const idTitre = useId()
  const refFermeture = useRef<HTMLButtonElement>(null)
  const refRestauration = useRef<Element | null>(null)
  const refCorps = useRef<HTMLDivElement>(null)
  const [glissement, setGlissement] = useState(0)
  const departRef = useRef<{ y: number; suit: boolean } | null>(null)

  // TOUS les hooks sont appelés avant le moindre retour anticipé. C'est la
  // correction nº 1 décrite en tête de fichier.
  const fermer = useCallback(() => onFermer(), [onFermer])
  // `labelledBy` plutôt que `label` : le titre VISIBLE nomme la fenêtre. Un
  // `aria-label` recopié à côté du titre finit par diverger de lui.
  const { ref: refFeuille, props: propsFeuille } = useDialogue(
    open, fermer, titre ? { labelledBy: idTitre } : { label: "Panneau" },
  )
  useFondVerrouille(open)
  useRetourFerme(open, fermer)

  useEffect(() => {
    if (open) {
      refRestauration.current = document.activeElement
      refFermeture.current?.focus()
      setGlissement(0)
    } else if (refRestauration.current instanceof HTMLElement) {
      refRestauration.current.focus()
    }
  }, [open])

  const auDebut = useCallback((e: React.TouchEvent) => {
    const y = e.touches[0]?.clientY ?? 0
    departRef.current = { y, suit: laFeuilleSuitLeDoigt(refCorps.current?.scrollTop ?? 0, 1) }
  }, [])

  const auMouvement = useCallback((e: React.TouchEvent) => {
    const d = departRef.current
    if (!d) return
    const delta = (e.touches[0]?.clientY ?? 0) - d.y
    // On ne prend la main que si le contenu est en haut ET que le geste descend.
    if (!laFeuilleSuitLeDoigt(refCorps.current?.scrollTop ?? 0, delta)) { setGlissement(0); return }
    setGlissement(Math.max(0, delta))
  }, [])

  const auRelachement = useCallback(() => {
    const hauteur = refFeuille.current?.getBoundingClientRect().height ?? 0
    const delta = glissement
    departRef.current = null
    setGlissement(0)
    if (delta <= 0) return
    if (glissementFerme(delta, hauteur)) { fermer(); return }
    const suivante = tailleApresGlissement(taille, delta, hauteur)
    if (suivante !== taille) onTaille(suivante)
  }, [glissement, taille, onTaille, fermer, refFeuille])

  if (!open) return null

  const stylePanneau: React.CSSProperties = laterale
    ? { position: ancrage, top: 0, right: 0, bottom: 0, width: "min(380px, 80vw)", borderTopLeftRadius: 18, borderBottomLeftRadius: 18, borderLeft: "1px solid rgba(255,255,255,0.1)" }
    : { position: ancrage, left: 0, right: 0, bottom: 0, height: `${Math.round(FRACTION_TAILLE[taille] * 100)}%`, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTop: "1px solid rgba(255,255,255,0.1)" }

  return (
    <div
      style={{
        position: ancrage, inset: 0, zIndex: 80,
        display: "flex", alignItems: laterale ? "stretch" : "flex-end", justifyContent: laterale ? "flex-end" : "center",
        pointerEvents: "none",
      }}>
      {/* Le voile est un FRÈRE du panneau, pas son parent.
          Il porte `aria-hidden` — c'est un décor, et le chemin clavier est
          Échap (fourni par `useDialogue`) plus le bouton de fermeture. S'il
          enveloppait le panneau, comme dans la version d'origine, ce même
          `aria-hidden` aurait masqué le dialogue aux lecteurs d'écran. */}
      <div
        data-testid="mobile-sheet-backdrop" aria-hidden="true" onClick={onFermer}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", pointerEvents: "auto" }} />
      <div
        ref={refFeuille} {...propsFeuille} data-testid="mobile-sheet" data-snap={taille}
        style={{
          pointerEvents: "auto",
          ...stylePanneau, boxSizing: "border-box",
          width: laterale ? stylePanneau.width : "100%", maxWidth: laterale ? undefined : 640,
          margin: laterale ? undefined : "0 auto",
          display: "flex", flexDirection: "column", background: "var(--surface)",
          boxShadow: "0 -16px 44px rgba(0,0,0,0.55)",
          paddingBottom: safeAreaBasse ? "env(safe-area-inset-bottom)" : undefined,
          overflow: "hidden",
          // Le glissement suit le doigt. Pas de transition PENDANT le geste,
          // sinon la feuille traîne derrière le doigt ; elle revient en place
          // à la fin, et `prefers-reduced-motion` est respecté par la classe.
          transform: glissement > 0 ? `translateY(${glissement}px)` : undefined,
          transition: glissement > 0 ? "none" : "transform 220ms cubic-bezier(0.22,1,0.36,1)",
          willChange: glissement > 0 ? "transform" : undefined,
        }}>
        {/* Poignée — elle se tire VRAIMENT (cf. correction nº 5). */}
        {!laterale && (
          <div
            data-testid="mobile-sheet-handle" role="presentation"
            onTouchStart={auDebut} onTouchMove={auMouvement} onTouchEnd={auRelachement}
            style={{ flexShrink: 0, padding: "10px 0 4px", touchAction: "none", cursor: "grab" }}>
            <div aria-hidden="true" style={{ width: 40, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.2)", margin: "0 auto" }} />
          </div>
        )}

        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "2px 12px 10px" }}>
          <h2 id={idTitre} style={{ flex: 1, margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titre}</h2>
          {!laterale && paliers && (
            <div role="group" aria-label="Taille du panneau" style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 9, padding: 2 }}>
              {PALIERS_UI.map(p => (
                <button
                  key={p.id} type="button" data-snap-btn={p.id} aria-pressed={taille === p.id}
                  aria-label={`Taille : ${p.label}`} onClick={() => onTaille(p.id)}
                  style={{ minHeight: 32, padding: "0 9px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: taille === p.id ? 800 : 600, background: taille === p.id ? "var(--accent)" : "transparent", color: taille === p.id ? "var(--ink-on-accent)" : "var(--muted)" }}>
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <button
            ref={refFermeture} type="button" data-testid="mobile-sheet-close" onClick={onFermer} aria-label="Fermer"
            style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, cursor: "pointer", color: "var(--muted)", fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>

        {/* Un seul défilement vertical. `minHeight: 0` est obligatoire : sans
            lui, un enfant `flex: 1; overflow: auto` ne défile pas sur iOS —
            c'était le P0 du 3e audit mobile. */}
        <div
          ref={refCorps} data-testid="mobile-sheet-body"
          style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain", touchAction: "pan-y" }}>
          {children}
        </div>

        {/* Pied hors du défilement : la validation ne part jamais sous le pli. */}
        {piedDePage && (
          <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {piedDePage}
          </div>
        )}
      </div>
    </div>
  )
}
