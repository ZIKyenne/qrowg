"use client"

// Print Center — contrôle qualité avant impression. Affiche le score du pré-vol (printPreflight)
// + la liste des contrôles. Purement présentatif : reçoit un PreflightResult déjà calculé.
import type { PreflightResult, CheckStatus } from "./printPreflight"

const G = "#C9A84C"
const INK = "#1A1A1A"
const MUTED = "#7A7365"
const OK = "#1E8A5C"
const WARN = "#B8801E"
const FAIL = "#C0392B"

const statusColor = (s: CheckStatus) => s === "ok" ? OK : s === "warn" ? WARN : s === "fail" ? FAIL : MUTED
const statusMark = (s: CheckStatus) => s === "ok" ? "✓" : s === "warn" ? "!" : s === "fail" ? "×" : "–"

export default function PrintCenterPanel({ result, onClose, onExport }: {
  result: PreflightResult
  onClose: () => void
  onExport?: () => void
}) {
  const { score, stars, grade, checks, applicable } = result
  const scoreColor = score >= 90 ? OK : score >= 75 ? G : score >= 55 ? WARN : FAIL
  const hasFail = checks.some(c => c.status === "fail")

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 4300, background: "rgba(10,8,4,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18, fontFamily: "DM Sans, sans-serif" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", background: "#FFFFFF", borderRadius: 18, boxShadow: "0 30px 90px rgba(0,0,0,0.35)", border: "1px solid rgba(0,0,0,0.08)" }}>

        {/* En-tête score */}
        <div style={{ display: "flex", gap: 18, padding: "22px 24px", borderBottom: "1px solid rgba(0,0,0,0.07)", alignItems: "center" }}>
          <div style={{ flexShrink: 0, width: 108, textAlign: "center" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: MUTED, fontWeight: 700 }}>Qualité</div>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 52, fontWeight: 700, lineHeight: 1, color: scoreColor, fontVariantNumeric: "tabular-nums" }}>
              {applicable === 0 ? "—" : `${score}%`}
            </div>
            <div style={{ color: G, fontSize: 16, letterSpacing: 2 }} aria-hidden>
              {"★".repeat(stars)}<span style={{ color: "rgba(0,0,0,0.14)" }}>{"★".repeat(5 - stars)}</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: INK }}>{grade}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>
              Contrôle automatique du fichier avant impression : contraste, taille du QR, zone silencieuse, logo, résolution et marges.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ flexShrink: 0, alignSelf: "flex-start", width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.03)", color: MUTED, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>

        {/* Liste des contrôles */}
        <div style={{ padding: "8px 24px 4px" }}>
          {checks.map(c => (
            <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 0", borderBottom: "1px solid rgba(0,0,0,0.05)", opacity: c.status === "na" ? 0.55 : 1 }}>
              <span aria-hidden style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: `${statusColor(c.status)}1A`, color: statusColor(c.status), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                {statusMark(c.status)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: INK }}>{c.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: MUTED, lineHeight: 1.45 }}>{c.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pied : actions */}
        <div style={{ display: "flex", gap: 10, padding: "16px 24px 22px", alignItems: "center" }}>
          <button type="button" onClick={onClose}
            style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: INK, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {hasFail ? "Corriger" : "Continuer l'édition"}
          </button>
          {onExport && (
            <button type="button" onClick={() => { onClose(); onExport() }}
              style={{ marginLeft: "auto", padding: "10px 18px", borderRadius: 10, border: "none", background: hasFail ? "rgba(0,0,0,0.08)" : "linear-gradient(90deg,#C9A84C,#b8953f)", color: hasFail ? MUTED : "#080808", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              {hasFail ? "Exporter quand même" : "Exporter"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
