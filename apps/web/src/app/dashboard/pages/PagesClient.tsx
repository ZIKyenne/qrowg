"use client"

// Mes pages — chaque projet, et ce qu'on peut en faire selon son état.
//
// Audit du 14 novembre 2026 (C1/C2) : « Pages » ouvrait la galerie de modèles,
// « Tout voir » le studio de QR. Ici, la liste. Les modèles restent dans le
// parcours de création (bouton « Partir d'un modèle »). Les actions par ligne
// viennent de lib/actionsDePage : un brouillon se reprend, une page en ligne
// s'ouvre, se partage, a son QR et ses stats.

import { useState } from "react"
import Link from "next/link"
import { Pencil, ExternalLink, Share2, QrCode, BarChart2, Check, Search, FileText, Printer, UtensilsCrossed, MoreHorizontal, ChevronUp } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { ButtonLink } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { actionsDePage, separerActions, filtrerPages, estEnLigne, type FiltrePages, type ActionDePage } from "@/lib/actionsDePage"
import { phraseVues } from "@/lib/comptesDuTableauDeBord"
import { useIsMobile } from "@/lib/useIsMobile"

type Page = { id: string; title: string | null; slug: string; status: string | null; total_views: number | null; updated_at: string | null; qr: string | null; carte?: boolean }

const MUTED = "var(--qd-muted, var(--muted))"
const ICONES: Record<ActionDePage["cle"], typeof Pencil> = { modifier: Pencil, ouvrir: ExternalLink, partager: Share2, qr: QrCode, stats: BarChart2, imprimer: Printer, carte: UtensilsCrossed }
const FILTRES: { cle: FiltrePages; libelle: string }[] = [
  { cle: "toutes", libelle: "Toutes" },
  { cle: "en_ligne", libelle: "En ligne" },
  { cle: "brouillons", libelle: "Brouillons" },
]

function modifieeIlYA(iso: string | null): string {
  if (!iso) return ""
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (!Number.isFinite(s) || s < 0) return ""
  if (s < 3600) return "modifiée à l'instant"
  if (s < 86400) return `modifiée il y a ${Math.floor(s / 3600)} h`
  if (s < 2592000) return `modifiée il y a ${Math.floor(s / 86400)} j`
  return `modifiée il y a ${Math.floor(s / 2592000)} mois`
}

export default function PagesClient({ pages }: { pages: Page[] }) {
  const isMobile = useIsMobile(620)
  const [filtre, setFiltre] = useState<FiltrePages>("toutes")
  const [recherche, setRecherche] = useState("")
  const [partagee, setPartagee] = useState<string | null>(null)
  // Téléphone : la page dont les actions repliées sont dépliées (une à la fois).
  const [depliee, setDepliee] = useState<string | null>(null)

  const visibles = filtrerPages(pages, filtre, recherche)
  const compte = (f: FiltrePages) => filtrerPages(pages, f).length

  async function partager(p: Page) {
    const url = `${window.location.origin}/${p.slug}`
    try {
      if (navigator.share) { await navigator.share({ title: p.title || p.slug, url }); return }
    } catch { return /* partage annulé : rien à signaler */ }
    try { await navigator.clipboard?.writeText(url) } catch { /* presse-papiers refusé */ }
    setPartagee(p.id); setTimeout(() => setPartagee(c => (c === p.id ? null : c)), 1600)
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: isMobile ? "16px 16px 130px" : "24px 24px 48px" }}>
      <PageHeader kicker="Construire" title="Mes pages"
        sub="Vos pages, en ligne ou en brouillon — modifiez, partagez, ouvrez leur QR et leurs statistiques."
        actions={<>
          <ButtonLink href="/dashboard/templates" variant="secondary" size="sm">Partir d&apos;un modèle</ButtonLink>
          <ButtonLink href="/dashboard/onboarding" size="sm">Créer une page</ButtonLink>
        </>} />

      {pages.length === 0 ? (
        <section className="qd-carte" style={{ padding: "40px 20px", textAlign: "center" }}>
          <FileText size={22} color="var(--qd-gold, var(--accent))" strokeWidth={1.6} aria-hidden="true" />
          <p style={{ color: "var(--ink)", fontSize: 15, fontWeight: 600, margin: "10px 0 6px" }}>Aucune page pour l&apos;instant</p>
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px" }}>Créez votre première page : guidée en quelques questions, ou à partir d&apos;un modèle.</p>
          <ButtonLink href="/dashboard/onboarding" size="sm">Créer ma première page</ButtonLink>
        </section>
      ) : (
        <section className="qd-carte" aria-label="Liste de mes pages">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--qd-line-fine, var(--line))" }}>
            <div role="group" aria-label="Filtrer par état" style={{ display: "flex", gap: 4 }}>
              {FILTRES.map(f => (
                <button key={f.cle} type="button" aria-pressed={filtre === f.cle} onClick={() => setFiltre(f.cle)}
                  style={{ minHeight: 44, padding: "0 14px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: filtre === f.cle ? 600 : 500,
                    border: `1px solid ${filtre === f.cle ? "var(--line-strong)" : "transparent"}`,
                    background: filtre === f.cle ? "var(--surface-2)" : "transparent", color: filtre === f.cle ? "var(--ink)" : MUTED }}>
                  {f.libelle} <span style={{ color: MUTED, fontVariantNumeric: "tabular-nums" }}>{compte(f.cle)}</span>
                </button>
              ))}
            </div>
            <div style={{ flex: "1 1 200px", maxWidth: 320, marginLeft: isMobile ? 0 : "auto" }}>
              <Input type="search" inputMode="search" enterKeyHint="search" aria-label="Rechercher une page" placeholder="Rechercher une page"
                value={recherche} onChange={e => setRecherche(e.target.value)}
                rightSlot={<Search size={15} aria-hidden="true" style={{ color: MUTED }} />} />
            </div>
          </div>

          {visibles.length === 0 ? (
            <p role="status" style={{ color: MUTED, fontSize: 13, padding: "28px 16px", margin: 0, textAlign: "center" }}>Aucune page ne correspond.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {visibles.map(p => {
                const nom = p.title || p.slug
                const pub = estEnLigne(p)
                return (
                  <li key={p.id} className="qd-ligne" style={{ flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                      <p style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600, margin: 0, overflowWrap: "anywhere" }}>{nom}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 3, fontSize: 12, color: MUTED }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 600, color: pub ? "var(--qd-ok, var(--success))" : MUTED }}>
                          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />{pub ? "En ligne" : "Brouillon"}
                        </span>
                        <span aria-hidden="true" className="qd-sep">·</span>
                        <span>/{p.slug}</span>
                        {pub && <><span aria-hidden="true" className="qd-sep">·</span><span>{phraseVues(p.total_views ?? 0)}</span></>}
                        {modifieeIlYA(p.updated_at) && <><span aria-hidden="true" className="qd-sep">·</span><span>{modifieeIlYA(p.updated_at)}</span></>}
                      </div>
                    </div>
                    {/* Mobile : une rangée de trois — deux gestes et « Plus » (relevé du
                        16 nov. : six boutons faisaient deux rangées pleines par page). */}
                    <div style={isMobile
                      ? { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, width: "100%" }
                      : { display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(() => {
                        const bouton = (a: ActionDePage) => {
                          const Icone = a.cle === "partager" && partagee === p.id ? Check : ICONES[a.cle]
                          const libelle = a.cle === "partager" && partagee === p.id ? "Lien copié" : a.libelle
                          const contenu = <><Icone size={14} strokeWidth={1.8} aria-hidden="true" /><span>{libelle}</span></>
                          const classe = a.cle === "modifier" ? "da-btn-neutral da-btn-neutral--sm qd-btn" : "da-btn-ghost da-btn-ghost--sm qd-btn"
                          const aria = `${libelle} — ${nom}`
                          const style = { minHeight: 44, ...(isMobile ? { justifyContent: "center", paddingInline: 6 } : {}) }
                          if (a.cle === "partager") return <button key={a.cle} type="button" className={classe} onClick={() => partager(p)} aria-label={aria} style={style}>{contenu}</button>
                          if (a.cle === "ouvrir") return <a key={a.cle} href={a.href} target="_blank" rel="noopener noreferrer" className={classe} aria-label={`${aria} (nouvel onglet)`} style={style}>{contenu}</a>
                          return <Link key={a.cle} href={a.href} className={classe} aria-label={aria} style={style}>{contenu}</Link>
                        }
                        const actions = actionsDePage(p)
                        // Ordinateur : tout est visible, la place ne manque pas.
                        if (!isMobile) return actions.map(bouton)
                        const { principales, autres } = separerActions(actions)
                        const ouvert = depliee === p.id
                        const idAutres = `autres-${p.id}`
                        return <>
                          {principales.map(bouton)}
                          {autres.length > 0 && (
                            <button type="button" className="da-btn-ghost da-btn-ghost--sm qd-btn" aria-expanded={ouvert} aria-controls={idAutres}
                              aria-label={`${ouvert ? "Moins" : "Plus"} d'actions — ${nom}`}
                              onClick={() => setDepliee(ouvert ? null : p.id)} style={{ minHeight: 44, justifyContent: "center", paddingInline: 6 }}>
                              {ouvert ? <ChevronUp size={14} strokeWidth={1.8} aria-hidden="true" /> : <MoreHorizontal size={14} strokeWidth={1.8} aria-hidden="true" />}
                              <span>{ouvert ? "Moins" : "Plus"}</span>
                            </button>
                          )}
                          {autres.length > 0 && ouvert && (
                            <div id={idAutres} style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6 }}>
                              {autres.map(bouton)}
                            </div>
                          )}
                        </>
                      })()}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
