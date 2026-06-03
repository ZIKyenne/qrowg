"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { User, Mail, Globe, FileText, Save, AlertCircle, CheckCircle, Camera, LogOut } from "lucide-react"

type Profile = {
  id: string
  email: string
  full_name: string | null
  username: string | null
  bio: string | null
  website: string | null
  avatar_url: string | null
  plan: string
  total_pages: number
  total_scans: number
}

function InputField({ label, value, onChange, placeholder, icon, disabled = false, hint }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ color: "#8A8478", fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8A8478" }}>
            {icon}
          </div>
        )}
        <input
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%", padding: icon ? "12px 14px 12px 42px" : "12px 14px",
            background: disabled ? "rgba(255,255,255,0.03)" : "#0d0c09",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: 10, color: disabled ? "#8A8478" : "#F5F0E8",
            fontSize: 14, outline: "none", transition: "border 0.2s",
            boxSizing: "border-box"
          }}
          onFocus={e => { if (!disabled) e.target.style.borderColor = "rgba(201,168,76,0.6)" }}
          onBlur={e => { e.target.style.borderColor = "rgba(201,168,76,0.2)" }}
        />
      </div>
      {hint && <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: 16, padding: "28px 32px", marginBottom: 24
    }}>
      <h2 style={{
        fontFamily: "Cormorant Garamond, serif", fontSize: 20,
        color: "#F5F0E8", fontWeight: 700, margin: "0 0 24px",
        paddingBottom: 16, borderBottom: "1px solid rgba(201,168,76,0.1)"
      }}>{title}</h2>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setUsername(data.username || "")
        setBio(data.bio || "")
        setWebsite(data.website || "")
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setStatus("idle")

    // Validation username
    if (username && !/^[a-z0-9_-]{3,30}$/.test(username)) {
      setErrorMsg("Username : 3-30 caractères, lettres minuscules, chiffres, - et _ uniquement")
      setStatus("error")
      setSaving(false)
      return
    }

    const { error } = await supabase.from("profiles").update({
      full_name: fullName || null,
      username: username || null,
      bio: bio || null,
      website: website || null,
    }).eq("id", profile.id)

    setSaving(false)
    if (error) {
      setErrorMsg(error.message.includes("username") ? "Ce username est déjà pris" : error.message)
      setStatus("error")
    } else {
      setStatus("success")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const planColors: Record<string, string> = { free: "#8A8478", pro: "#C9A84C", business: "#39FF8F" }
  const planColor = planColors[profile?.plan || "free"] || "#8A8478"

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>
            Paramètres
          </h1>
          <p style={{ color: "#8A8478", marginTop: 4, fontSize: 14 }}>Gère ton compte et tes préférences</p>
        </div>

        {/* Avatar + Plan */}
        <Section title="Mon profil">
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #C9A84C, #39FF8F)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 700, color: "#080808",
                fontFamily: "Cormorant Garamond, serif"
              }}>
                {(fullName || profile?.email || "?")[0].toUpperCase()}
              </div>
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                background: "#C9A84C", borderRadius: "50%", width: 22, height: 22,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", border: "2px solid #080808"
              }}>
                <Camera size={11} color="#080808" />
              </div>
            </div>
            <div>
              <p style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, margin: 0 }}>{fullName || "Sans nom"}</p>
              <p style={{ color: "#8A8478", fontSize: 13, margin: "4px 0" }}>{profile?.email}</p>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: `${planColor}18`, border: `1px solid ${planColor}40`,
                borderRadius: 20, padding: "3px 10px"
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: planColor }} />
                <span style={{ color: planColor, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                  Plan {profile?.plan}
                </span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 16, textAlign: "center" }}>
              {[
                { label: "Pages", value: profile?.total_pages || 0 },
                { label: "Scans", value: profile?.total_scans || 0 },
              ].map((s, i) => (
                <div key={i}>
                  <p style={{ color: "#C9A84C", fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{s.value}</p>
                  <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <InputField label="Nom complet" value={fullName} onChange={setFullName} placeholder="Jean Dupont" icon={<User size={15} />} />
            <InputField label="Username" value={username} onChange={setUsername} placeholder="jean-dupont"
              hint="qrfolio.app/jean-dupont" />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: "#8A8478", fontSize: 13, fontWeight: 500, display: "block", marginBottom: 8 }}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Décris-toi en quelques mots..."
                rows={3} style={{
                  width: "100%", padding: "12px 14px", background: "#0d0c09",
                  border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10,
                  color: "#F5F0E8", fontSize: 14, outline: "none", resize: "vertical",
                  fontFamily: "DM Sans, sans-serif", boxSizing: "border-box"
                }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
              />
            </div>
            <InputField label="Site web" value={website} onChange={setWebsite} placeholder="https://monsite.com" icon={<Globe size={15} />} />
            <InputField label="Email" value={profile?.email} onChange={() => {}} disabled icon={<Mail size={15} />} hint="Non modifiable" />
          </div>
        </Section>

        {/* Abonnement */}
        <Section title="Abonnement">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, textTransform: "capitalize" }}>
                  Plan {profile?.plan}
                </span>
                <div style={{ background: `${planColor}18`, border: `1px solid ${planColor}40`, borderRadius: 20, padding: "2px 10px" }}>
                  <span style={{ color: planColor, fontSize: 12, fontWeight: 600 }}>Actif</span>
                </div>
              </div>
              <p style={{ color: "#8A8478", fontSize: 14, margin: 0 }}>
                {profile?.plan === "free" && "1 page · 500 vues/mois · QR code basique"}
                {profile?.plan === "pro" && "Pages illimitées · Analytics avancés · Domaine perso"}
                {profile?.plan === "business" && "Tout Pro · Équipe · API · Support prioritaire"}
              </p>
            </div>
            {profile?.plan !== "business" && (
              <a href="/upgrade" style={{
                background: "linear-gradient(90deg, #C9A84C, #b8953f)",
                color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700,
                padding: "10px 20px", borderRadius: 10, display: "inline-block"
              }}>
                {profile?.plan === "free" ? "Passer Pro →" : "Passer Business →"}
              </a>
            )}
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Zone de danger">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Se déconnecter</p>
              <p style={{ color: "#8A8478", fontSize: 13, margin: 0 }}>Tu seras redirigé vers la page d'accueil</p>
            </div>
            <button onClick={handleLogout} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
              borderRadius: 10, padding: "10px 20px", color: "#FF6B6B",
              fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>
              <LogOut size={15} /> Déconnexion
            </button>
          </div>
        </Section>

        {/* Save button + status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
          {status === "error" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FF6B6B", fontSize: 14 }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}
          {status === "success" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#39FF8F", fontSize: 14 }}>
              <CheckCircle size={16} /> Sauvegardé !
            </div>
          )}
          <button onClick={handleSave} disabled={saving} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(90deg, #C9A84C, #b8953f)",
            border: "none", borderRadius: 10, padding: "12px 28px",
            color: "#080808", fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1
          }}>
            <Save size={15} /> {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>

      </div>
    </div>
  )
}
