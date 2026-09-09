// Banc d'essai de la primitive SettingsSection (captures, tests) : la forme commune des
// écrans Réglages, avec un contenu de démonstration explicite. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { Shield, Bell, Users, Globe } from "lucide-react"
import { harnessAutorise } from "../gate"
import { PageHeader } from "@/components/ui/PageHeader"
import { SettingsSection, champStyle, etiquetteStyle } from "@/components/ui/SettingsSection"

export const dynamic = "force-dynamic"

export default async function E2EReglagesPage() {
  if (!harnessAutorise()) notFound()
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px 60px", fontFamily: "DM Sans, sans-serif" }}>
      <PageHeader kicker="Espace" title="Paramètres (démo)" sub="Gérez votre compte et vos préférences" gap={24} />
      <SettingsSection title="Informations du compte" sub="Email et identifiant" icon={<Shield size={15} />}>
        <label style={etiquetteStyle}>Email</label>
        <input readOnly value="demo@qrowg.fr" style={champStyle} />
      </SettingsSection>
      <SettingsSection title="Notifications" sub="Gérez les e-mails que vous recevez" icon={<Bell size={15} />} tag="Pro">
        {["Nouveau message reçu", "Rapport hebdomadaire", "Premier scan d'un QR"].map((l, i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 0", borderBottom: i < 2 ? "1px solid var(--line)" : "none" }}>
            <p style={{ color: "var(--ink)", fontSize: 13.5, fontWeight: 500, margin: 0 }}>{l}</p>
            <span aria-hidden="true" style={{ width: 40, height: 22, borderRadius: 11, background: i ? "var(--surface-2)" : "var(--accent)", position: "relative", display: "inline-block" }}><span style={{ position: "absolute", top: 3, left: i ? 3 : 21, width: 16, height: 16, borderRadius: "50%", background: "#fff" }} /></span>
          </div>
        ))}
      </SettingsSection>
      <SettingsSection title="Équipe" sub="2 membres · plan Business" icon={<Users size={15} />} action={<button type="button" className="da-btn-primary da-btn-primary--sm">Inviter</button>} flush>
        {["Studio Horizon (démo) · Propriétaire", "Léa (démo) · Éditrice"].map((m, i) => (
          <div key={m} style={{ padding: "12px 18px", borderBottom: i === 0 ? "1px solid var(--line)" : "none", color: "var(--ink)", fontSize: 13.5 }}>{m}</div>
        ))}
      </SettingsSection>
      <SettingsSection title="Domaines" sub="Votre propre adresse" icon={<Globe size={15} />} action={<button type="button" className="da-btn-ghost da-btn-ghost--sm">Ajouter</button>}>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>Aucun domaine relié pour l'instant.</p>
      </SettingsSection>
    </div>
  )
}
