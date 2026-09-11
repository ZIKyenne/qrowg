"use client"

import { getPlan } from "@/lib/plans"
import { useState, useEffect } from "react"
import {
  Globe, Star, StarOff, Crown, Plus, Trash2,
  CheckCircle, AlertCircle, Clock, ExternalLink,
  ArrowUpRight, Loader, Shield
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
type DomainRecord = {
  id:            string
  domain:        string
  page_id:       string
  is_primary:    boolean
  verified:      boolean
  vercel_status: string
  created_at:    string
  pages:         { title: string; slug: string } | null
}

interface Props {
  /** Vue compacte (v56) : entête (plan, compteur, ajout) et rappel du domaine principal,
      SANS cartes — la liste détaillée de l'écran parent les affiche déjà, avec le
      marqueur « Principal » et « Définir principal ». Fini le même domaine deux fois. */
  vueCompacte?: boolean
  domains:    DomainRecord[]
  pages:      { id: string; title: string; slug: string }[]
  plan:       string
  onSetPrimary: (domain: string) => Promise<void>
  onDelete:     (id: string) => Promise<void>
  onAddClick:   () => void
}

const PLAN_LIMITS: Record<string, { max: number; label: string }> = {
  free:     { max: 0,  label: "Non disponible" },
  starter:  { max: 0,  label: "Non disponible" },
  pro:      { max: 1,  label: "1 domaine" },
  business: { max: -1, label: "Illimité" },
}

const G     = "var(--accent)"
const MUTED = "var(--muted)"

function StatusBadge({ status, verified }: { status: string; verified: boolean }) {
  if (!verified) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.25)", borderRadius:6, padding:"2px 8px", fontSize:11.5, color:"#F97316", fontWeight:600 }}>
      <Clock size={10}/> En attente
    </span>
  )
  if (status === "active") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(57,255,143,0.1)", border:"1px solid rgba(57,255,143,0.25)", borderRadius:6, padding:"2px 8px", fontSize:11.5, color:"var(--success)", fontWeight:600 }}>
      <CheckCircle size={10}/> Actif
    </span>
  )
  if (status === "error") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:6, padding:"2px 8px", fontSize:11.5, color:"var(--danger)", fontWeight:600 }}>
      <AlertCircle size={10}/> Erreur
    </span>
  )
  if (status === "verified") return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(57,255,143,0.1)", border:"1px solid rgba(57,255,143,0.25)", borderRadius:6, padding:"2px 8px", fontSize:11.5, color:"var(--success)" }}>
      <CheckCircle size={10}/> Vérifié
    </span>
  )
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"2px 8px", fontSize:11.5, color:MUTED, fontWeight:600 }}>
      <Clock size={10}/> {status}
    </span>
  )
}

export default function MultiBrandDomainsPanel({ domains, pages, plan, onSetPrimary, onDelete, onAddClick, vueCompacte = false }: Props) {
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)
  const [deleting,       setDeleting]       = useState<string | null>(null)

  const planInfo  = PLAN_LIMITS[plan?.toLowerCase()] ?? PLAN_LIMITS.free
  const isBusiness = plan?.toLowerCase() === "business"
  const primary   = domains.find(d => d.is_primary)
  const secondary = domains.filter(d => !d.is_primary)
  const canAdd    = planInfo.max === -1 || domains.length < planInfo.max
  const atLimit   = planInfo.max !== -1 && domains.length >= planInfo.max && planInfo.max > 0

  async function handleSetPrimary(domain: string) {
    setSettingPrimary(domain)
    await onSetPrimary(domain)
    setSettingPrimary(null)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  function DomainCard({ rec, isPrimary, hasPrimary }: { rec: DomainRecord; isPrimary: boolean; hasPrimary: boolean }) {
    return (
      <div style={{ background: isPrimary ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "rgba(255,255,255,0.02)", border: isPrimary ? "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" : "1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", transition:"all 0.15s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>

          {/* Icône */}
          <div style={{ width:38, height:38, background: isPrimary ? "color-mix(in srgb, var(--accent) 12%, transparent)" : rec.verified ? "rgba(57,255,143,0.08)" : "rgba(255,255,255,0.04)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {isPrimary ? <Star size={17} color={G}/> : <Globe size={17} color={rec.verified ? "var(--success)" : MUTED}/>}
          </div>

          {/* Infos */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3, flexWrap:"wrap" }}>
              <span style={{ color:"var(--ink)", fontSize:13, fontWeight:700 }}>{rec.domain}</span>
              {isPrimary && (
                <span style={{ background:"color-mix(in srgb, var(--accent) 15%, transparent)", border:"1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius:6, padding:"2px 8px", fontSize:11, color:G, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
                  ⭐ Principal
                </span>
              )}
              {!isPrimary && rec.verified && hasPrimary && (
                <span style={{ background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:6, padding:"2px 8px", fontSize:11.5, color:"var(--action)", fontWeight:600 }}>
                  → 301 vers principal
                </span>
              )}
              <StatusBadge status={rec.vercel_status} verified={rec.verified}/>
            </div>
            <p style={{ color:MUTED, fontSize:11, margin:0 }}>
              → {rec.pages?.title ?? pages.find(p => p.id === rec.page_id)?.title ?? "Page non liée"} · {new Date(rec.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
            {rec.verified && (
              <a href={`https://${rec.domain}`} target="_blank" rel="noopener noreferrer"
                style={{ width:30, height:30, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:MUTED, textDecoration:"none" }}>
                <ExternalLink size={12}/>
              </a>
            )}

            {/* Définir comme principal (Business uniquement, si pas déjà principal) */}
            {isBusiness && !isPrimary && rec.verified && (
              <button type="button" onClick={() => handleSetPrimary(rec.domain)} disabled={settingPrimary === rec.domain}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"color-mix(in srgb, var(--accent) 8%, transparent)", border:"1px solid var(--line-strong)", borderRadius:8, color:G, fontSize:11, fontWeight:600, cursor:settingPrimary===rec.domain?"wait":"pointer", opacity:settingPrimary===rec.domain?0.6:1 }}>
                {settingPrimary === rec.domain ? <Loader size={11} style={{ animation:"mo-spin 0.8s linear infinite" }}/> : <Star size={11}/>}
                Définir principal
              </button>
            )}

            {/* Supprimer */}
            <button type="button" onClick={() => handleDelete(rec.id)} disabled={deleting === rec.id}
              style={{ width:30, height:30, background:"rgba(255,100,100,0.08)", border:"1px solid rgba(255,100,100,0.15)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--danger)", cursor:deleting===rec.id?"wait":"pointer", opacity:deleting===rec.id?0.5:1 }}>
              {deleting === rec.id ? <Loader size={12} style={{ animation:"mo-spin 0.8s linear infinite" }}/> : <Trash2 size={12}/>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily:"DM Sans, sans-serif" }}>

      {/* Header plan + compteur */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", background: isBusiness ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "rgba(255,255,255,0.04)", border: isBusiness ? "1px solid color-mix(in srgb, var(--accent) 25%, transparent)" : "1px solid rgba(255,255,255,0.08)", borderRadius:8 }}>
            {isBusiness && <Crown size={12} color={G}/>}
            <span style={{ color: isBusiness ? G : MUTED, fontSize:11, fontWeight:700 }}>
              {getPlan(plan).label} — {planInfo.label}
            </span>
          </div>
          <span style={{ color:MUTED, fontSize:12 }}>
            {domains.length} domaine{domains.length !== 1 ? "s" : ""}
            {planInfo.max !== -1 && ` / ${planInfo.max}`}
          </span>
        </div>

        {/* Action dupliquée : secondaire tant qu'un état vide (avec son primaire) est affiché,
            redevient primaire dès qu'une liste existe. */}
        {canAdd && (
          <button type="button" onClick={onAddClick} className={domains.length === 0 ? "da-btn-ghost da-btn-ghost--sm" : "da-btn-primary da-btn-primary--sm"}>
            <Plus className="da-ic da-ic-plus" size={13}/> Ajouter un domaine
          </button>
        )}
      </div>

      {/* Barre de progression (plan Pro uniquement) */}
      {planInfo.max !== -1 && planInfo.max > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ color:MUTED, fontSize:11 }}>Utilisation</span>
            <span style={{ color: atLimit ? "var(--danger)" : G, fontSize:11, fontWeight:700 }}>
              {domains.length}/{planInfo.max}
            </span>
          </div>
          <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.min((domains.length/planInfo.max)*100, 100)}%`, background: atLimit ? "var(--danger)" : "linear-gradient(90deg,#c9a24d,#e8c877)", borderRadius:3, transition:"width 0.5s" }}/>
          </div>
          {atLimit && (
            <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:7, padding:"8px 12px", background:"color-mix(in srgb, var(--accent) 6%, transparent)", border:"1px solid var(--line-strong)", borderRadius:8 }}>
              <Crown size={13} color={G}/>
              <span style={{ color:MUTED, fontSize:11 }}>
                Limite atteinte · <a href="/upgrade" style={{ color:G, textDecoration:"none", fontWeight:600 }}>Passer au Business pour des domaines illimités →</a>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Domaine principal */}
      {domains.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <p style={{ color:MUTED, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>
            Domaine principal
          </p>
          {primary ? (
            vueCompacte
              ? <p style={{ color:"var(--ink)", fontSize:13, margin:0, display:"flex", alignItems:"center", gap:7 }}><Star size={13} color={G}/> {primary.domain}{isBusiness && secondary.length > 0 && <span style={{ color:MUTED, fontSize:12 }}>· {secondary.length} secondaire{secondary.length > 1 ? "s" : ""} redirigé{secondary.length > 1 ? "s" : ""} (301)</span>}</p>
              : <DomainCard rec={primary} isPrimary={true} hasPrimary={true}/>
          ) : (
            <div style={{ padding:"12px 14px", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)", borderRadius:10 }}>
              <p style={{ color:MUTED, fontSize:12, margin:0 }}>
                {isBusiness
                  ? "Aucun domaine principal défini — cliquez sur \"Définir principal\" sur un domaine vérifié"
                  : "Votre domaine vérifié sera le domaine principal"
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Domaines secondaires (Business) */}
      {!vueCompacte && isBusiness && secondary.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <p style={{ color:MUTED, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>
              Domaines secondaires ({secondary.length})
            </p>
            {primary && (
              <span style={{ color:G, fontSize:11.5 }}>301 → {primary.domain}</span>
            )}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {secondary.map(rec => (
              <DomainCard key={rec.id} rec={rec} isPrimary={false} hasPrimary={!!primary}/>
            ))}
          </div>
        </div>
      )}

      {/* Domaines (plan Pro: liste simple) */}
      {!vueCompacte && !isBusiness && domains.length > 0 && !primary && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {domains.map(rec => (
            <DomainCard key={rec.id} rec={rec} isPrimary={false} hasPrimary={!!primary}/>
          ))}
        </div>
      )}

      {/* État vide : porté par l'écran parent (un seul, avec l'exemple et le bouton) — plus de doublon ici. */}

      {/* CTA upgrade pour Business si plan Pro limité */}
      {!isBusiness && plan?.toLowerCase() === "pro" && domains.length > 0 && (
        <div style={{ marginTop:14, padding:"12px 14px", background:"color-mix(in srgb, var(--accent) 5%, transparent)", border:"1px solid var(--line-strong)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Crown size={14} color={G}/>
            <span style={{ color:MUTED, fontSize:12 }}>
              Domaines illimités + multi-marques avec le plan <strong style={{ color:"var(--ink)" }}>Business</strong>
            </span>
          </div>
          <a href="/upgrade"
            style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"6px 14px", background:"color-mix(in srgb, var(--accent) 10%, transparent)", border:"1px solid color-mix(in srgb, var(--accent) 25%, transparent)", borderRadius:8, color:G, fontSize:11, fontWeight:700, textDecoration:"none" }}>
            Upgrade <ArrowUpRight size={11}/>
          </a>
        </div>
      )}

      <style>{``}</style>
    </div>
  )
}
