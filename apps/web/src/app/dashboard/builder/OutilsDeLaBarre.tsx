"use client"

// Trois outils de la barre du haut de l'éditeur, sortis de BuilderV4 (v386),
// leur JSX recopié tel quel :
//   · Annuler / Rétablir ;
//   · l'aide « ? » des raccourcis — sa liste vient désormais de la table pure
//     `AIDE_DES_RACCOURCIS` (raccourcisClavier.ts), jouée par une garde dans
//     `actionClavier` : elle ne peut plus annoncer un raccourci qui n'existe pas ;
//   · le panneau « QR Code » de la page, qui tient lui-même son ouverture.

import { useState } from "react"
import { Undo2, Redo2, QrCode } from "lucide-react"
import { Button, ButtonLink } from "@/components/ui/Button"
import QRCanvas from "../qr-codes/QRCanvas"
import { G, MUTED } from "./builderConstants"
import { AIDE_DES_RACCOURCIS } from "./raccourcisClavier"
import { useFermetureEchap } from "@/components/ui/useDialogue"

export function AnnulerRetablir({ isMobile, peutAnnuler, peutRetablir, onAnnuler, onRetablir }: {
  isMobile: boolean; peutAnnuler: boolean; peutRetablir: boolean; onAnnuler: () => void; onRetablir: () => void
}) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      <button onClick={onAnnuler}
        disabled={!peutAnnuler}
        title="Annuler — Ctrl+Z"
        style={{ width: isMobile ? 40 : 32, height: isMobile ? 40 : 32, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, cursor: peutAnnuler ? "pointer" : "default", color: peutAnnuler ? "var(--ink)" : "var(--faint)", fontSize: 13, transition: "all 0.15s" }}
        onMouseEnter={e => { if(peutAnnuler) { e.currentTarget.style.background="var(--surface)"; e.currentTarget.style.borderColor="color-mix(in srgb, var(--accent) 40%, transparent)" }}}
        onMouseLeave={e => { e.currentTarget.style.background="var(--surface-2)"; e.currentTarget.style.borderColor="var(--line-strong)" }}>
        <Undo2 size={15} />
      </button>
      <button onClick={onRetablir}
        disabled={!peutRetablir}
        title="Rétablir — Ctrl+Shift+Z"
        style={{ width: isMobile ? 40 : 32, height: isMobile ? 40 : 32, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, cursor: peutRetablir ? "pointer" : "default", color: peutRetablir ? "var(--ink)" : "var(--faint)", fontSize: 13, transition: "all 0.15s" }}
        onMouseEnter={e => { if(peutRetablir) { e.currentTarget.style.background="var(--surface)"; e.currentTarget.style.borderColor="color-mix(in srgb, var(--accent) 40%, transparent)" }}}
        onMouseLeave={e => { e.currentTarget.style.background="var(--surface-2)"; e.currentTarget.style.borderColor="var(--line-strong)" }}>
        <Redo2 size={15} />
      </button>
    </div>

  )
}

export function AideDesRaccourcis({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ position: "relative", display: isMobile ? "none" : "block" }}>
      <button
        style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, cursor: "pointer", color: MUTED, fontSize: 12, fontWeight: 700 }}
        title="Raccourcis clavier" aria-label="Raccourcis clavier" type="button"
        onFocus={e => { const t = e.currentTarget.nextElementSibling as HTMLElement; if (t) { t.style.opacity = "1"; t.style.transform = "translateY(0)" } }}
        onBlur={e => { const t = e.currentTarget.nextElementSibling as HTMLElement; if (t) { t.style.opacity = "0"; t.style.transform = "translateY(4px)" } }}
        onMouseEnter={e => { const t = e.currentTarget.nextElementSibling as HTMLElement; if(t) t.style.opacity = "1"; if(t) t.style.pointerEvents = "none" }}
        onMouseLeave={e => { const t = e.currentTarget.nextElementSibling as HTMLElement; if(t) t.style.opacity = "0" }}>
        ?
      </button>
      <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 12, padding: "12px 14px", zIndex: 200, opacity: 0, transition: "opacity 0.15s", pointerEvents: "none", minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
        <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Raccourcis</p>
        {AIDE_DES_RACCOURCIS.map(({ touches: k, libelle: v }) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ color: MUTED, fontSize: 12 }}>{v}</span>
            <kbd style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "2px 7px", color: G, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{k}</kbd>
          </div>
        ))}
      </div>
    </div>

  )
}

export function PanneauQrDeLaPage({ qrTarget, pageStatus, qrShortCode, onPng }: {
  qrTarget: string; pageStatus: string; qrShortCode: string | null | undefined; onPng: () => void
}) {
  const [showQrPanel, setShowQrPanel] = useState(false)
  // Il se fermait au clic à côté, jamais à Échap : sa garde lisait BuilderV4 en
  // entier, où d'autres couches ont leur crochet (relevé en v386, une fois isolé).
  useFermetureEchap(showQrPanel, () => setShowQrPanel(false))
  return (
      <div style={{ position: "relative" }}>
        <Button onClick={() => setShowQrPanel(p => !p)} size="sm"><QrCode size={11} /> QR Code</Button>
        {showQrPanel && (
          <>
            <div onClick={() => setShowQrPanel(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 16, padding: "18px", zIndex: 200, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", width: 200 }}>
              <p style={{ color: "var(--ink)", fontSize: 12, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>Mon QR Code</p>
              {pageStatus !== "published" && <p style={{ color: "var(--warning)", fontSize: 11, fontWeight: 700, textAlign: "center", margin: "0 0 8px", lineHeight: 1.35 }}>Publiez votre page pour activer ce QR (sinon il mène à une page vide).</p>}
              <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <QRCanvas value={qrTarget} size={120} />
              </div>
              <div style={{ background: "var(--field)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", borderRadius: 7, padding: "6px 9px", marginBottom: 8 }}>
                <p style={{ color: MUTED, fontSize: 11, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: 1 }}>URL de scan</p>
                <p style={{ color: G, fontSize: 11, margin: 0, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/q/{qrShortCode}</p>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <Button onClick={onPng} size="sm">↓ PNG</Button>
                <ButtonLink href="/dashboard/qr-codes" variant="ghost" size="sm">Perso →</ButtonLink>
              </div>
            </div>
          </>
        )}
      </div>
  )
}
