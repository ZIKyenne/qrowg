"use client"

// PanneauGenerationIa — « Générer ma page avec l'IA », sorti de BuilderV4 (tenu
// sous 3 050 lignes par testsDeterministes).
//
// Deux règles, chacune gardée par un test :
//  · absent tant que la clé serveur n'existe pas (GENERATION_IA_ACTIVE) : on ne
//    fait pas rédiger quelqu'un pour lui répondre « bientôt » ;
//  · la formule se dit AVANT qu'on rédige (lib/generationIa · etatGenerationIa) :
//    revue « client payant » du 17 nov., un compte Gratuit écrivait sa
//    description puis apprenait le refus.

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { GENERATION_IA_ACTIVE, etatGenerationIa } from "@/lib/generationIa"
import { propsAnnonce } from "@/lib/annonceAuLecteur"
import { MUTED } from "./builderConstants"
import type { PageTemplate } from "./page-templates"

export default function PanneauGenerationIa({ session, plan, isMobile, onPage }: {
  session: "unknown" | "guest" | "user"
  plan: string | null
  isMobile: boolean
  /** Applique la page générée (et ferme la fenêtre des modèles). */
  onPage: (t: PageTemplate) => void
}) {
  const [aiGenPrompt, setAiGenPrompt] = useState("")
  const [aiGenLoading, setAiGenLoading] = useState(false)
  const [aiGenError, setAiGenError] = useState<string | null>(null)
  const [aiGenSoon, setAiGenSoon] = useState(false) // true = IA pas encore activee (ton info, pas erreur)
  const [aiGenUpgrade, setAiGenUpgrade] = useState(false) // true = plan insuffisant : on propose les offres

  async function generateWithAI() {
    const description = aiGenPrompt.trim()
    if (description.length < 5) { setAiGenError("Décrivez votre activité en quelques mots."); return }
    setAiGenLoading(true); setAiGenError(null); setAiGenSoon(false); setAiGenUpgrade(false)
    try {
      const res = await fetch("/api/generate-page", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setAiGenSoon(!!data?.soon); setAiGenUpgrade(!!data?.upgrade); setAiGenError(data?.error || "La génération a échoué."); return }
      if (!data?.template?.blocks?.length) { setAiGenError("Aucun contenu généré. Réessayez."); return }
      onPage(data.template as PageTemplate) // applique + ferme la modale
    } catch { setAiGenError("Connexion impossible. Réessayez.") }
    finally { setAiGenLoading(false) }
  }
  const iaPanneau = etatGenerationIa(session, plan)
  if (!GENERATION_IA_ACTIVE || !iaPanneau) return null

  return (
    <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "linear-gradient(120deg,color-mix(in srgb, var(--accent) 9%, transparent),rgba(57,255,143,0.05))" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
      <span style={{ fontSize: 17 }}>🪄</span>
      <p style={{ margin: 0, color: "var(--ink)", fontSize: 13.5, fontWeight: 700 }}>Générer ma page avec l&apos;IA</p>
    </div>
    {iaPanneau.etat === "fermee" ? (
      // Pas de champ à remplir pour rien : la formule se dit d'abord.
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <p style={{ margin: 0, color: MUTED, fontSize: 11.5, lineHeight: 1.4, flex: "1 1 220px" }}>L&apos;IA construit une page complète à partir d&apos;une phrase. {iaPanneau.phrase}</p>
        <a href="/upgrade?reason=ia" className="da-btn-primary da-btn-primary--sm" style={{ display: "inline-flex", minHeight: 44, alignItems: "center" }}>Voir les offres</a>
      </div>
    ) : <>
    <p style={{ margin: "0 0 10px", color: MUTED, fontSize: 11.5, lineHeight: 1.4 }}>Décrivez votre activité en une phrase — l&apos;IA construit une page complète, prête à personnaliser.</p>
    <div style={{ display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 8, alignItems: isMobile ? "stretch" : "flex-start" }}>
      <textarea
        value={aiGenPrompt}
        onChange={e => { setAiGenPrompt(e.target.value); if (aiGenError) { setAiGenError(null); setAiGenSoon(false) } }}
        disabled={aiGenLoading}
        placeholder="Ex : Salon de coiffure haut de gamme à Lyon, coupe, coloration, barbier. Réservation en ligne, ambiance chaleureuse."
        rows={3}
        style={{ flex: 1, resize: "vertical", minHeight: isMobile ? 76 : 60, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, color: "var(--ink)", fontSize: 12.5, padding: "10px 12px", lineHeight: 1.45, fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const }}
      />
      <button onClick={generateWithAI} disabled={aiGenLoading}
        className="da-btn-primary da-btn-primary--sm" style={{ flexShrink: 0, alignSelf: "stretch", minHeight: isMobile ? 48 : undefined, minWidth: isMobile ? undefined : 120, justifyContent: "center" }}>
        {aiGenLoading
          ? <><span style={{ width: 13, height: 13, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "mo-spin 0.7s linear infinite" }} /> Génération…</>
          : <><Sparkles size={14} /> Générer ma page</>}
      </button>
    </div>
    {aiGenError && (aiGenSoon || aiGenUpgrade
      ? <div {...propsAnnonce("info")} style={{ margin: "9px 0 0", padding: "9px 11px", borderRadius: 9, background: "color-mix(in srgb, var(--accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)", color: "#E8D9A8", fontSize: 11.5, lineHeight: 1.45, display: "flex", gap: 7 }}><span style={{ flexShrink: 0 }}>{aiGenUpgrade ? "✨" : "⏳"}</span><span>{aiGenError}</span></div>
      : <p {...propsAnnonce("erreur")} style={{ margin: "7px 0 0", color: "#F87171", fontSize: 11.5 }}>{aiGenError}</p>)}
    {aiGenError && aiGenUpgrade && (
      <a href="/upgrade?reason=ia" className="da-btn-primary da-btn-primary--sm" style={{ marginTop: 8, display: "inline-flex" }}>Voir les offres</a>
    )}
    {aiGenLoading && <p style={{ margin: "7px 0 0", color: MUTED, fontSize: 11 }}>L&apos;IA rédige votre page… (quelques secondes)</p>}
    </>}
    </div>
  )
}
