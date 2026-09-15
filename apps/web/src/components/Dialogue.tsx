"use client"

// Dialogue.tsx — Une boîte de dialogue accessible, pour remplacer prompt/confirm/alert.
//
// La page « Créer un QR » en appelait huit : la destination d'un lien, un MOT DE PASSE
// saisi en clair dans une invite du navigateur, une date qu'il fallait taper au format
// AAAA-MM-JJ (et si on se trompait, un alert renvoyait à zéro sans garder la saisie),
// et cinq messages d'erreur. Ces invites bloquent l'onglet, ne se stylent pas, sont
// supprimées par certains navigateurs après un `await`, et n'offrent aucun champ adapté.
//
// Ce composant fait ce qu'elles ne font pas : rôle annoncé, fermeture par Échap,
// focus posé à l'ouverture et rendu à l'élément d'origine, focus qui ne s'échappe
// pas de la boîte, et défilement de la page gelé derrière.
//
// Il l'écrivait une deuxième fois. `useDialogue` porte exactement le même geste,
// et ce fichier en tenait sa propre copie : son sélecteur de focusables, son
// écouteur de touches, son gel du défilement. Deux endroits où décider ce que
// « être une fenêtre » veut dire, donc deux endroits où diverger. Ses deux
// raffinements — entrer sur le premier champ de saisie, ignorer les éléments
// masqués — sont remontés dans le crochet, et il délègue (lot v122).

import { useId } from "react"
import { useDialogue } from "./ui/useDialogue"

const G = "#C9A84C"
const MUTED = "var(--muted)"

export type DialogueProps = {
  ouvert: boolean
  titre: string
  /** Texte d'explication sous le titre. Facultatif. */
  description?: string
  /** Ce que fait la fermeture (Échap, clic hors du cadre, bouton Annuler). */
  onFermer: () => void
  /** Contenu : champs de saisie, message… */
  children?: React.ReactNode
  /** Libellé du bouton de confirmation. Absent = boîte d'information (un seul bouton). */
  libelleConfirmer?: string
  onConfirmer?: () => void
  /** Rend le bouton de confirmation rouge, pour une action irréversible. */
  destructif?: boolean
  confirmerDesactive?: boolean
  libelleAnnuler?: string
}

export default function Dialogue({
  ouvert, titre, description, onFermer, children,
  libelleConfirmer, onConfirmer, destructif = false, confirmerDesactive = false,
  libelleAnnuler = "Annuler",
}: DialogueProps) {
  const idTitre = useId()
  const idDescription = useId()
  const { ref: cadre, props: dialogue } = useDialogue(ouvert, onFermer, {
    labelledBy: idTitre,
    ...(description ? { describedBy: idDescription } : {}),
  })

  if (!ouvert) return null

  return (
    <div
      onClick={onFermer}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,4,4,0.72)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}
    >
      <div
        ref={cadre}
        {...dialogue}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420, background: "#111010", border: "1px solid color-mix(in srgb, var(--accent) 24%, transparent)", borderRadius: 18, padding: "22px 20px 18px", boxSizing: "border-box", boxShadow: "0 24px 70px rgba(0,0,0,0.6)", outline: "none" }}
      >
        <h2 id={idTitre} style={{ color: "var(--ink)", fontSize: 16.5, fontWeight: 700, margin: 0, letterSpacing: -0.2 }}>{titre}</h2>
        {description && (
          <p id={idDescription} style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.5, margin: "8px 0 0" }}>{description}</p>
        )}
        {children && <div style={{ marginTop: 16 }}>{children}</div>}
        <div style={{ display: "flex", gap: 9, marginTop: 20, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onFermer}
            style={{ minHeight: 44, padding: "0 16px", borderRadius: 11, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)", color: "#D8D2C6", fontSize: 13.5, fontWeight: 600 }}
          >
            {libelleConfirmer ? libelleAnnuler : "Fermer"}
          </button>
          {libelleConfirmer && (
            <button
              type="button"
              onClick={onConfirmer}
              disabled={confirmerDesactive}
              style={{
                minHeight: 44, padding: "0 18px", borderRadius: 11,
                cursor: confirmerDesactive ? "not-allowed" : "pointer",
                opacity: confirmerDesactive ? 0.45 : 1,
                background: destructif ? "rgba(255,107,107,0.14)" : G,
                border: destructif ? "1px solid rgba(255,107,107,0.45)" : `1px solid ${G}`,
                color: destructif ? "#FF8F8F" : "#100E09",
                fontSize: 13.5, fontWeight: 700,
              }}
            >
              {libelleConfirmer}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
