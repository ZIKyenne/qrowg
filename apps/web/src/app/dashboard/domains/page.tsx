"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Globe, Plus, Trash2, Check, AlertCircle, ExternalLink, Copy } from "lucide-react"

type Domain = { id: string; slug: string; title: string; custom_domain: string | null; status: string }

export default function DomainsPage() {
  const [pages, setPages] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [domains, setDomains] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }
      const { data } = await supabase.from("pages").select("id,slug,title,custom_domain,status").eq("user_id", user.id).order("created_at", { ascending: false })
      if (data) {
        setPages(data)
        const d: Record<string, string> = {}
        data.forEach(p => { d[p.id] = p.custom_domain || "" })
        setDomains(d)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function saveDomain(pageId: string) {
    setSaving(pageId)
    const supabase = createClient()
    const domain = domains[pageId]?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "") || null
    await supabase.from("pages").update({ custom_domain: domain }).eq("id", pageId)
    setPages(p => p.map(pg => pg.id === pageId ? { ...pg, custom_domain: domain } : pg))
    setSaving(null); setSaved(pageId); setTimeout(() => setSaved(null), 2000)
  }

  async function removeDomain(pageId: string) {
    const supabase = createClient()
    await supabase.from("pages").update({ custom_domain: null }).eq("id", pageId)
    setPages(p => p.map(pg => pg.id === pageId ? { ...pg, custom_domain: null } : pg))
    setDomains(d => ({ ...d, [pageId]: "" }))
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 2000)
  }

  const G = "#C9A84C"; const MUTED = "#8A8478"; const SURFACE = "#111009"

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>Domaines personnalisés</h1>
          <p style={{ color: MUTED, marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>Connecte ton propre domaine à chacune de tes pages QRfolio.</p>
        </div>

        {/* DNS Instructions */}
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 16, padding: "24px", marginBottom: 28 }}>
          <h2 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={16} color={G} /> Comment configurer ton domaine
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { step: "1", text: "Chez ton registrar (OVH, Namecheap...), crée un enregistrement CNAME" },
              { step: "2", text: "Pointe ton sous-domaine vers :" },
              { step: "3", text: "Saisis ton domaine ci-dessous et clique Enregistrer" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${G}20`, border: `1px solid ${G}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>{s.step}</span>
                </div>
                <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{s.text}</p>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "10px 14px", marginLeft: 36 }}>
              <code style={{ color: G, fontSize: 13, flex: 1 }}>cname.vercel-dns.com</code>
              <button onClick={() => copyText("cname.vercel-dns.com", "cname")} style={{ background: "none", border: "none", cursor: "pointer", color: copied === "cname" ? "#39FF8F" : MUTED, display: "flex" }}>
                {copied === "cname" ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Pages list */}
        {pages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: SURFACE, borderRadius: 16, border: "1px solid rgba(201,168,76,0.15)" }}>
            <Globe size={40} color={MUTED} style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>Aucune page créée</p>
            <p style={{ color: MUTED, fontSize: 13, margin: "0 0 20px" }}>Crée d'abord une page pour lui assigner un domaine.</p>
            <a href="/dashboard" style={{ background: `linear-gradient(90deg,${G},#b8953f)`, color: "#080808", textDecoration: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>Créer une page →</a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {pages.map(page => (
              <div key={page.id} style={{ background: SURFACE, border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: page.status === "published" ? "#39FF8F" : MUTED }} />
                  <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>{page.title}</p>
                  <span style={{ color: MUTED, fontSize: 12 }}>· qrfolio.app/{page.slug}</span>
                </div>

                {page.custom_domain && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
                    <Check size={13} color="#39FF8F" />
                    <span style={{ color: "#39FF8F", fontSize: 13, fontWeight: 600 }}>Domaine actif :</span>
                    <a href={`https://${page.custom_domain}`} target="_blank" rel="noopener noreferrer" style={{ color: "#39FF8F", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      {page.custom_domain} <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={domains[page.id] || ""}
                    onChange={e => setDomains(d => ({ ...d, [page.id]: e.target.value }))}
                    placeholder="monsite.com ou sous.monsite.com"
                    style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "11px 14px", color: "#F5F0E8", fontSize: 14, outline: "none" }}
                    onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                  />
                  <button onClick={() => saveDomain(page.id)} disabled={saving === page.id}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: saved === page.id ? "rgba(57,255,143,0.12)" : `linear-gradient(90deg,${G},#b8953f)`, border: saved === page.id ? "1px solid rgba(57,255,143,0.3)" : "none", borderRadius: 10, padding: "11px 18px", color: saved === page.id ? "#39FF8F" : "#080808", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {saved === page.id ? <><Check size={13} /> Enregistré</> : saving === page.id ? "..." : <><Plus size={13} /> Enregistrer</>}
                  </button>
                  {page.custom_domain && (
                    <button onClick={() => removeDomain(page.id)} style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 10, padding: "11px", color: "#FF6B6B", cursor: "pointer", display: "flex" }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
