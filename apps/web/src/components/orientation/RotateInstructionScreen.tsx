"use client"

import { ArrowLeft, RotateCw } from "lucide-react"
import QrRotateAnimation from "./QrRotateAnimation"

export default function RotateInstructionScreen({
  title = "Tournez votre téléphone",
  subtitle = "QR Print Studio fonctionne mieux en mode paysage.",
  micro = "Votre espace de création va se déverrouiller automatiquement.",
  onExit,
  allowContinueAnyway = false,
  onContinue,
}: {
  title?: string
  subtitle?: string
  micro?: string
  onExit?: () => void
  allowContinueAnyway?: boolean
  onContinue?: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "fixed", inset: 0, zIndex: 4000, overflow: "hidden",
        background: "radial-gradient(120% 90% at 50% 44%, #101016 0%, #08080c 46%, #040405 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "24px 22px calc(24px + env(safe-area-inset-bottom))", textAlign: "center",
        fontFamily: "DM Sans, sans-serif", animation: "rgFade .35s ease both",
      }}
    >
      <style>{`
        @keyframes rgFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rgGlow { 0%,100% { opacity:.4 } 50% { opacity:.7 } }
        @keyframes rgRotateHint { 0%,55% { transform: rotate(0deg) } 78%,100% { transform: rotate(90deg) } }
      `}</style>

      {/* Grille QR discrète */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
        WebkitMaskImage: "radial-gradient(72% 62% at 50% 46%, #000 0%, transparent 80%)",
        maskImage: "radial-gradient(72% 62% at 50% 46%, #000 0%, transparent 80%)" }} />
      {/* Halo accent */}
      <div aria-hidden style={{ position: "absolute", zIndex: 0, left: "50%", top: "42%", width: "72vmin", height: "72vmin", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 62%)", filter: "blur(34px)", animation: "rgGlow 6s ease-in-out infinite", pointerEvents: "none" }} />

      {/* Logo discret */}
      <div style={{ position: "absolute", top: "calc(18px + env(safe-area-inset-top))", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 2 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)", boxShadow: "0 0 10px var(--accent)" }} /> QRowg · Print Studio
        </span>
      </div>

      {/* Animation 3D — la star */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: 30 }}>
        <QrRotateAnimation size="min(42vmin, 240px)" />
      </div>

      {/* Indication portrait -> paysage */}
      <div style={{ position: "relative", zIndex: 2, display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 16, color: "var(--accent)" }}>
        <RotateCw size={16} style={{ animation: "rgRotateHint 2.6s ease-in-out infinite" }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Portrait → Paysage</span>
      </div>

      {/* Textes */}
      <h1 style={{ position: "relative", zIndex: 2, fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(26px, 7vw, 34px)", fontWeight: 700, color: "#F8F4EC", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
        {title}
      </h1>
      <p style={{ position: "relative", zIndex: 2, color: "#C9C3B6", fontSize: 15, lineHeight: 1.55, margin: "0 0 8px", maxWidth: 360 }}>
        {subtitle}
      </p>
      <p style={{ position: "relative", zIndex: 2, color: "rgba(245,240,232,0.45)", fontSize: 12.5, lineHeight: 1.5, margin: "0 0 28px", maxWidth: 320 }}>
        {micro}
      </p>

      {/* Actions */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%", maxWidth: 320 }}>
        {onExit && (
          <button type="button" onClick={onExit} aria-label="Retour au QR Studio"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 46, padding: "12px 22px", borderRadius: 12, cursor: "pointer", width: "100%",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#F5F0E8", fontSize: 14, fontWeight: 600 }}>
            <ArrowLeft size={16} /> Retour au QR Studio
          </button>
        )}
        {allowContinueAnyway && onContinue && (
          <button type="button" onClick={onContinue} aria-label="Continuer quand même en portrait"
            style={{ minHeight: 44, padding: "10px 18px", background: "none", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.5)", fontSize: 12.5, textDecoration: "underline", textUnderlineOffset: 3 }}>
            Continuer quand même
          </button>
        )}
      </div>
    </div>
  )
}
