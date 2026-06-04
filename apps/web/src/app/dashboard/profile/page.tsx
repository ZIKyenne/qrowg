"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Copy, Check, Gift, Star, TrendingUp, Users, QrCode, Eye, Crown, Zap, Camera, Save, ExternalLink } from "lucide-react"

type Profile = {
  id: string; email: string; full_name: string | null; username: string | null
  bio: string | null; avatar_url: string | null; plan: string
  total_pages: number; total_scans: number; created_at: string; ref_code: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [form, setForm] = useState({ full_name: "", username: "", bio: "" })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }
      const [{ data: prof }, { data: refs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ])
      if (prof) {
        setProfile(prof)
        setForm({ full_name: prof.full_name || "", username: prof.username || "", bio: prof.bio || "" })
      }
      if (refs) setReferrals(refs)
      setLoading(false)
    }
    load()
  }, [])

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("profiles").update({
      full_name: form.full_name,
      username: form.username || null,
      bio: form.bio,
    }).eq("id", profile.id)
    setProfile(p => p ? { ...p, ...form } : p)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function uploadAvatar(file: File) {
    if (!profile) return
    if (file.size > 5 * 1024 * 1024) { alert("Image trop lourde (max 5MB)"); return }
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop()
    const path = `avatars/${profile.id}.${ext}`
    const { error } = await supabase.storage.from("page-assets").upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("page-assets").getPublicUrl(path)
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id)
      setProfile(p => p ? { ...p, avatar_url: publicUrl } : p)
    }
    setUploadingAvatar(false)
  }

  function copyReferral() {
    const link = `https://qrfolio.app?ref=${profile?.ref_code || profile?.id?.slice(0, 8)}`
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function getMemberSince(d: string) {
    return new Date(d).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  const G = "#C9A84C"; const MUTED = "#8A8478"
  const planColors: Record<string, string> = { free: MUTED, pro: G, business: "#39FF8F" }
  const planIcons: Record<string, React.ReactNode> = { free: <Star size={14} />, pro: <Zap size={14} />, business: <Crown size={14} /> }
  const pc = planColors[profile?.plan || "free"]
  const validatedRefs = referrals.filter(r => r.status === "validated" || r.status === "rewarded").length
  const totalMonths = referrals.reduce((s, r) => s + r.reward_months, 0)
  const referralLink = `https://qrfolio.app?ref=${profile?.ref_code || profile?.id?.slice(0, 8) || ""}`

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: 10, padding: "11px 14px", color: "#F5F0E8", fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif"
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "2px solid rgba(201,168,76,0.15)", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 28px", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} input:focus,textarea:focus,select:focus{border-color:rgba(201,168,76,0.5)!important;background:#111009!important}`}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>Mon Profil</h1>
          <p style={{ color: MUTED, fontSize: 14, margin: "4px 0 0" }}>Gere ton compte, ton plan et tes recompenses</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* ── Colonne gauche ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Identite + Avatar */}
            <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${pc}12,transparent 70%)`, pointerEvents: "none" }} />

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: profile?.avatar_url ? "transparent" : `linear-gradient(135deg,${pc},${pc}80)`, border: `2px solid ${pc}40`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${pc}20` }}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 30, fontWeight: 700, color: "#080808", fontFamily: "Cormorant Garamond, serif" }}>{(form.full_name || profile?.email || "?")[0]?.toUpperCase()}</span>}
                  </div>
                  <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
                    style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: G, border: "2px solid #080808", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    {uploadingAvatar ? <div style={{ width: 10, height: 10, border: "1.5px solid #080808", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <Camera size={11} color="#080808" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: "0 0 2px", fontFamily: "Cormorant Garamond, serif" }}>{form.full_name || "Sans nom"}</p>
                  <p style={{ color: MUTED, fontSize: 12, margin: "0 0 6px" }}>{profile?.email}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: pc + "15", border: `1px solid ${pc}30`, borderRadius: 12, padding: "3px 9px" }}>
                    <span style={{ color: pc }}>{planIcons[profile?.plan || "free"]}</span>
                    <span style={{ color: pc, fontSize: 11, fontWeight: 700 }}>Plan {profile?.plan || "free"}</span>
                  </div>
                  {profile?.created_at && <p style={{ color: MUTED, fontSize: 11, margin: "6px 0 0" }}>Membre depuis {getMemberSince(profile.created_at)}</p>}
                </div>
              </div>

              {/* Formulaire */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 }}>Nom complet</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Jean Dupont" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 }}>Nom d'utilisateur</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED, fontSize: 14 }}>@</span>
                    <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                      placeholder="jean-dupont" style={{ ...inputStyle, paddingLeft: 28 }} />
                  </div>
                  <p style={{ color: MUTED, fontSize: 10, margin: "3px 0 0" }}>3-30 caracteres, lettres, chiffres, _ et -</p>
                </div>
                <div>
                  <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 }}>Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Decris-toi en quelques mots..." rows={3}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
                </div>
                <button onClick={saveProfile} disabled={saving}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: saved ? "rgba(57,255,143,0.1)" : `linear-gradient(90deg,${G},#b8953f)`, border: saved ? "1px solid rgba(57,255,143,0.3)" : "none", borderRadius: 10, padding: "12px", color: saved ? "#39FF8F" : "#080808", fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer", transition: "all 0.2s" }}>
                  {saved ? <><Check size={14} /> Sauvegarde !</> : saving ? "Sauvegarde..." : <><Save size={14} /> Sauvegarder</>}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { icon: <Eye size={16} />, label: "Pages", value: profile?.total_pages || 0, color: G },
                { icon: <QrCode size={16} />, label: "Scans", value: profile?.total_scans || 0, color: "#39FF8F" },
                { icon: <Users size={16} />, label: "Parrainages", value: validatedRefs, color: "#7B61FF" },
                { icon: <Gift size={16} />, label: "Mois Pro", value: totalMonths, color: "#EC4899" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ color: s.color, background: s.color + "15", borderRadius: 7, padding: 7 }}>{s.icon}</div>
                  <div>
                    <p style={{ color: "#F5F0E8", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{s.value}</p>
                    <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Colonne droite ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Plan */}
            <div style={{ background: "#111009", border: `1px solid ${pc}25`, borderRadius: 16, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle,${pc}10,transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ color: pc, background: pc + "15", borderRadius: 8, padding: 8 }}>{planIcons[profile?.plan || "free"]}</div>
                <div>
                  <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>Plan {profile?.plan || "free"}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#39FF8F", animation: "pulse 2s infinite" }} />
                    <span style={{ color: "#39FF8F", fontSize: 11 }}>Actif</span>
                  </div>
                </div>
                {profile?.plan !== "business" && (
                  <a href="/upgrade" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 8, padding: "6px 12px", color: G, textDecoration: "none", fontSize: 11, fontWeight: 700 }}>
                    Upgrade <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(profile?.plan === "free"
                  ? ["1 page", "500 vues/mois", "QR code basique", "Analytics de base"]
                  : profile?.plan === "pro"
                  ? ["Pages illimitees", "Vues illimitees", "Domaine personnalise", "Analytics avances", "Sans branding QRfolio"]
                  : ["Tout Plan Pro inclus", "Gestion d'equipe", "Acces API", "Support 24/7 dedie"]
                ).map((perk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ color: "#39FF8F", fontSize: 12 }}>✓</span>
                    <span style={{ color: MUTED, fontSize: 13 }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Parrainage */}
            <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Gift size={16} color={G} />
                <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>Programme de parrainage</p>
              </div>

              {/* Steps */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[["🔗", "Partage"], ["👤", "S'inscrit"], ["🎁", "Tu gagnes"]].map(([icon, label], i) => (
                  <div key={i} style={{ flex: 1, background: `${G}06`, border: `1px solid ${G}12`, borderRadius: 9, padding: "10px 8px", textAlign: "center" }}>
                    <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{icon}</span>
                    <span style={{ color: MUTED, fontSize: 10 }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Reward */}
              <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 9, padding: "10px 14px", marginBottom: 14, textAlign: "center" }}>
                <p style={{ color: G, fontSize: 13, fontWeight: 700, margin: 0 }}>1 mois Pro offert par parrainage valide</p>
              </div>

              {/* Stats parrainage */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.15)", borderRadius: 9, padding: "10px", textAlign: "center" }}>
                  <p style={{ color: "#7B61FF", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{validatedRefs}</p>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Valides</p>
                </div>
                <div style={{ flex: 1, background: "rgba(57,255,143,0.06)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 9, padding: "10px", textAlign: "center" }}>
                  <p style={{ color: "#39FF8F", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{totalMonths}</p>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Mois Pro</p>
                </div>
                {profile?.ref_code && (
                  <div style={{ flex: 1, background: `${G}08`, border: `1px solid ${G}15`, borderRadius: 9, padding: "10px", textAlign: "center" }}>
                    <p style={{ color: G, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{profile.ref_code}</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Code perso</p>
                  </div>
                )}
              </div>

              {/* Lien */}
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 9, padding: "10px 12px", color: G, fontSize: 11, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {referralLink}
                </div>
                <button onClick={copyReferral}
                  style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, background: copied ? "rgba(57,255,143,0.1)" : `${G}12`, border: `1px solid ${copied ? "rgba(57,255,143,0.3)" : G + "25"}`, borderRadius: 9, padding: "10px 14px", color: copied ? "#39FF8F" : G, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {copied ? <><Check size={12} /> Copie !</> : <><Copy size={12} /> Copier</>}
                </button>
              </div>

              {/* Historique */}
              {referrals.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 8px" }}>Historique</p>
                  {referrals.slice(0, 4).map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color: MUTED, fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                      <span style={{ color: r.status === "validated" || r.status === "rewarded" ? "#39FF8F" : MUTED, fontSize: 11, fontWeight: 600 }}>
                        {r.status === "pending" ? "En attente" : r.status === "validated" ? "Valide" : "Recompense"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
