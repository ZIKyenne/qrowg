"use client"
// Bouton « Partager » de la page publiée : feuille de partage native quand le
// téléphone en a une, sinon un petit menu (réseaux + copier le lien).
//
// Vivait dans `[slug]/blocsPublics.tsx` sous le nom `ShareButton`, pour la
// seule barre fixe. Il rejoint le renderer partagé avec elle (rendu unique,
// lot 3) ; le suivi passe par le contexte du bloc (`trackClick`) au lieu
// d'appeler l'API de suivi directement.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { shareLinks } from "../../types"
import { useFermetureEchap } from "@/components/ui/useDialogue"
import type { UnifiedCtx } from "../renderTypes"

// Le menu prend les couleurs du commerçant : il était noir et or QROWG en dur,
// y compris sur une page claire ou rose. (Relevé par unSeulBouton au lot 3.)
//
// `barreEnHaut` : le menu s'ouvre du côté de l'écran, pas au-dessus du bouton.
// Centré sur son bouton, il débordait à droite quand « Partager » était la
// dernière action — et s'ouvrait HORS de l'écran quand la barre était en haut
// (vu au banc, lot 3 ; les deux anciens rendus faisaient pareil).
export function BoutonPartager({ u, style, contenu, barreEnHaut = false }: { u: UnifiedCtx; style: CSSProperties; contenu: ReactNode; barreEnHaut?: boolean }) {
  const suivre = u.trackClick
  const [ouvert, setOuvert] = useState(false)
  const [copie, setCopie] = useState(false)
  // Le menu se fermait au clic à côté, pas à Échap : au clavier, il fallait
  // tabuler jusqu'au dernier lien. (Relevé par coucheQuiSeFerme au lot 3.)
  useFermetureEchap(ouvert, () => setOuvert(false))
  // Toucher ailleurs ferme le menu. C'était un voile `position: fixed` — mais la
  // barre est décalée par un `transform`, qui fait d'elle le cadre de tout
  // descendant fixe : le voile ne couvrait que la barre, et toucher la page ne
  // fermait rien. On écoute le document à la place.
  const racine = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ouvert) return
    const dehors = (e: PointerEvent) => { if (!racine.current?.contains(e.target as Node)) setOuvert(false) }
    document.addEventListener("pointerdown", dehors, true)
    return () => document.removeEventListener("pointerdown", dehors, true)
  }, [ouvert])
  const url =() => (typeof window !== "undefined" ? window.location.href : "")
  const titre = () => (typeof document !== "undefined" ? document.title : "QRowg")
  const trace = (cible: string) => { try { suivre(cible) } catch { /* le suivi ne bloque jamais le geste */ } }
  const auClic = async () => {
    trace("share")
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : undefined
    if (nav?.share) {
      try { await nav.share({ title: titre(), text: titre(), url: url() }) } catch { /* partage annulé */ }
    } else {
      setOuvert(o => !o)
    }
  }
  const copier = async () => {
    try { await navigator.clipboard?.writeText(url()); setCopie(true); setTimeout(() => setCopie(false), 1800) } catch { /* presse-papiers refusé */ }
  }
  return (
    <div ref={racine} style={{ position: "relative", flex: 1, display: "flex" }}>
      <button type="button" onClick={auClic} style={style} aria-haspopup="menu" aria-expanded={ouvert}>{contenu}</button>
      {ouvert && (
        <>
          <div role="menu" style={{ position: "fixed", ...(barreEnHaut ? { top: 78 } : { bottom: "calc(78px + env(safe-area-inset-bottom))" }), left: "50%", transform: "translateX(-50%)", zIndex: 71, maxWidth: "calc(100vw - 24px)", boxSizing: "border-box", background: u.SURFACE, border: `1px solid ${u.LINE}`, borderRadius: 14, padding: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.6)", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6, width: 252 }}>
            {shareLinks(url(), titre()).map(t => (
              <a key={t.key} role="menuitem" href={t.href} target="_blank" rel="noopener noreferrer" onClick={() => { setOuvert(false); trace(`share:${t.key}`) }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px", borderRadius: 9, textDecoration: "none", background: u.FILL }}>
                <span aria-hidden style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ color: u.TEXT, fontSize: 11, fontWeight: 600, fontFamily: u.FONT_B }}>{t.label}</span>
              </a>
            ))}
            <button type="button" role="menuitem" onClick={copier} style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer", background: copie ? "rgba(57,255,143,0.14)" : `${u.G}1f`, color: copie ? "var(--success)" : u.G, fontSize: 11, fontWeight: 700 }}>
              {copie ? "✓ Lien copié" : "🔗 Copier le lien"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
