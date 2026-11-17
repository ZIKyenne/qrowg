"use client"

// Retour de Stripe (?upgraded=true) : on ATTEND que la formule soit active
// (le webhook l'écrit dans profiles.plan) avant de la nommer, puis on dit ce
// qu'elle débloque et quoi faire. Remplace « Bienvenue ! Votre abonnement est
// actif. 🎉 », affiché avant même l'activation, et à chaque actualisation
// (revue du 17 novembre, voir lib/apresAbonnement).

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getPlan } from "@/lib/plans"
import { avantagesEnPlus } from "@/app/dashboard/offreUtile"
import { attente } from "@/lib/reponseAttendue"
import { gestesApresAbonnement, phraseAbonnementActif, ATTENTE_ACTIVATION_MS } from "@/lib/apresAbonnement"

type Etat = { phase: "rien" } | { phase: "attente" } | { phase: "actif"; plan: string } | { phase: "lent" }

export default function AbonnementActive() {
  const [etat, setEtat] = useState<Etat>({ phase: "rien" })

  useEffect(() => {
    let params: URLSearchParams
    try { params = new URLSearchParams(window.location.search) } catch { return }
    if (params.get("upgraded") !== "true") return
    // Le bandeau ne revient pas à chaque actualisation.
    params.delete("upgraded"); params.delete("session_id")
    try { window.history.replaceState(window.history.state, "", window.location.pathname + (params.toString() ? `?${params}` : "")) } catch {}
    setEtat({ phase: "attente" })

    const a = attente()
    const debut = Date.now()
    const sb = createClient()
    const lire = async () => {
      if (!a.encoreAttendue()) return
      try {
        const { data: { user } } = await sb.auth.getUser()
        if (user) {
          const { data } = await sb.from("profiles").select("plan").eq("id", user.id).maybeSingle()
          const plan = (data as { plan?: string } | null)?.plan
          if (plan && plan !== "free") { if (a.encoreAttendue()) setEtat({ phase: "actif", plan }); return }
        }
      } catch { /* on réessaie */ }
      if (Date.now() - debut > ATTENTE_ACTIVATION_MS) { if (a.encoreAttendue()) setEtat({ phase: "lent" }); return }
      setTimeout(lire, 1500)
    }
    void lire()
    return a.abandonner
  }, [])

  if (etat.phase === "rien") return null
  const carte: React.CSSProperties = { background: "color-mix(in srgb, var(--success) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--success) 32%, transparent)", borderRadius: 14, padding: "14px 16px" }

  if (etat.phase === "attente") return (
    <section role="status" style={carte}>
      <p style={{ margin: 0, color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>Paiement reçu. Activation de votre formule…</p>
    </section>
  )
  if (etat.phase === "lent") return (
    <section role="status" style={carte}>
      <p style={{ margin: 0, color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>Paiement reçu.</p>
      <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>L&apos;activation prend parfois une minute. Actualisez la page dans un instant ; si rien ne change, écrivez-nous.</p>
    </section>
  )

  const avantages = avantagesEnPlus("free", getPlan(etat.plan).id).slice(0, 4)
  const gestes = gestesApresAbonnement(etat.plan)
  return (
    <section role="status" aria-label="Votre formule est active" style={carte}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <p style={{ flex: 1, margin: 0, color: "var(--ink)", fontSize: 15, fontWeight: 700 }}>✓ {phraseAbonnementActif(etat.plan)}</p>
        <button type="button" onClick={() => setEtat({ phase: "rien" })} aria-label="Fermer ce message" style={{ minWidth: 44, minHeight: 44, margin: "-12px -10px 0 0", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18 }}>×</button>
      </div>
      {avantages.length > 0 && <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>Débloqué : {avantages.join(" · ")}.</p>}
      {gestes.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {gestes.map(g => <Link key={g.href} href={g.href} className="da-btn-ghost da-btn-ghost--sm qd-btn" style={{ minHeight: 44 }}>{g.libelle}</Link>)}
        </div>
      )}
    </section>
  )
}
