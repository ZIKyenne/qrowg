"use client"

import { etoilesDeLAvis } from "@/app/dashboard/builder/shared-renderer/models/testimonials"
import Vignette from "@/components/Vignette"
import { Button } from "@/components/ui/Button"
import { ExternalLink } from "lucide-react"
import { paymentBrand, paymentLink, starRow, youtubeId, type Block, type PageTheme, embedHref } from "./types"
import { BLOCK_DEFS } from "./blockDefs"
import { hasPublishableContent, HIDDEN_WHEN_EMPTY_NOTE } from "./blockEmptyState"
import { boutonsSansLien, mentionBoutonSansLien } from "./boutonSansLien"
import { CHAMPS_FORMULAIRE, telephoneDirect, type LeadField } from "@/lib/leadForms"

// Les cases grises d'un formulaire dans l'aperçu. Elles étaient écrites en toutes
// lettres, bloc par bloc, et avaient dérivé de la page publiée (vague 23) : le
// commerçant activait « Champ téléphone » ou « Délai souhaité » et l'aperçu ne
// bougeait pas. Une seule liste, partagée avec le rendu public.
function champsDe(type: string, c: Record<string, any>): LeadField[] {
  return (CHAMPS_FORMULAIRE[type] ?? (() => []))(c)
}
import { resolveEditorBlock } from "./shared-renderer/editorRegistry"
  // Rangee d'etoiles a remplissage partiel precis (gere les demi/decimales).
  function StarRow({ fills, size = 12, color = "#FBBF24", empty = "rgba(255,255,255,0.18)", gap = 2 }: { fills: number[]; size?: number; color?: string; empty?: string; gap?: number }) {
    return (
      <div style={{ display: "inline-flex", gap }}>
        {fills.map((f, i) => (
          <span key={i} style={{ position: "relative", display: "inline-block", color: empty, fontSize: size, lineHeight: 1 }}>★
            <span style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", width: `${Math.round(f * 100)}%`, color }}>★</span>
          </span>
        ))}
      </div>
    )
  }

  export function BlockPreview({ block, theme, dayMode, editable = false, onEditField }: { block: Block; theme: PageTheme; dayMode: boolean; editable?: boolean; onEditField?: (blockId: string, key: string, value: string) => void }) {
    const c = block.content
    // Édition inline : n'est active que dans le canvas (editable), jamais si verrouillé.
    const canEdit = editable && !block.locked
    const edit = (key: string) => (v: string) => onEditField?.(block.id, key, v)
    const bg = "transparent"
    const text = dayMode ? "#1A1A1A" : theme.text
    const muted = dayMode ? "#6B7280" : theme.muted
    const primary = theme.primary
    const accent = theme.accent
    const s = { background: bg, fontFamily: theme.fontBody || "DM Sans, sans-serif" }
    // État vide harmonisé (aperçu builder) : invite claire quand un bloc n'a pas encore de
    // contenu. `sub` (optionnel) = mention du comportement en ligne (ex. « invisible tant
    // qu'il est vide ») pour les blocs qui rendent `null` en public quand ils sont vides.
    const emptyHint = (icon: string, label: string, sub?: string) => (
      <div role="note" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 12px", border: `1.5px dashed ${muted}40`, borderRadius: 12, color: muted, textAlign: "center" }}>
        <span style={{ fontSize: 22, opacity: 0.7 }} aria-hidden>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        {sub && <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.75 }}>{sub}</span>}
      </div>
    )

    // Un bouton sans destination n'est plus publié : la page le retire. L'aperçu
    // le garde — le commerçant doit pouvoir le composer — mais il le dit.
    //
    // Cette mention était calculée APRÈS l'aiguillage vers le renderer partagé,
    // donc elle ne s'affichait que sur les blocs restés legacy. Trente-quatre
    // blocs déjà migrés — dont `cta_button`, le bouton principal de la moitié des
    // pages — la perdaient en silence : le commerçant nommait son bouton, oubliait
    // l'adresse, voyait un bouton normal dans son aperçu, publiait, et le bouton
    // n'existait pas. (Vague 27.)
    const mention = mentionBoutonSansLien(boutonsSansLien(block.type, c))
    const avecMention = (contenu: any) => mention
      ? <>{contenu}<p role="note" style={{ margin: "0 16px 8px", padding: "6px 9px", borderRadius: 8, border: `1px dashed ${muted}40`, color: muted, fontSize: 11.5, textAlign: "center" }}>⚠︎ {mention}</p></>
      : contenu

    // Renderer PARTAGÉ (pilotes derrière flag). Flag vide en prod → null → `case` legacy.
    // Rollback = retirer le type de SHARED_RENDERER_BLOCKS ; aucune donnée touchée.
    const SharedEditor = resolveEditorBlock(block.type)
    if (SharedEditor) return avecMention(<SharedEditor content={c} ctx={{ theme, primary, text, muted, accent, surfaceStyle: s, canEdit, edit }} />)

    return avecMention((() => {
    switch (block.type) {
      case "reservation_form": { const ligneDirecte = telephoneDirect(c); return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Réserver"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {champsDe("reservation_form", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "7px 10px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: "linear-gradient(90deg,#EF4444,#dc2626)", borderRadius: 7, padding: "9px", textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Réserver"}</div>
          </div>
          {ligneDirecte && <p style={{ textAlign: "center", margin: "8px 0 0", color: muted, fontSize: 11 }}>ou appelez directement le <strong style={{ color: text }}>{ligneDirecte}</strong></p>}
        </div>
      ) }
      case "contact_form": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Contact"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {champsDe("contact_form", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: f.area ? "7px 10px 32px" : "7px 10px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 7, padding: "9px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Envoyer"}</div>
          </div>
        </div>
      )
      // Sans nom, telephone ni e-mail, la page publiee ne rend rien : la fiche de
      // contact n'aurait aucune donnee a enregistrer. L'apercu dessinait quand
      // meme la carte, avec un avatar et un bouton qui ne serviraient jamais.
      case "vcard": return !hasPublishableContent("vcard", c)
        ? <div style={{ padding: "10px 16px", ...s }}>{emptyHint("👤", "Ajoutez un nom, un téléphone ou un e-mail", HIDDEN_WHEN_EMPTY_NOTE)}</div>
        : (
        <div style={{ padding: "4px 16px 10px", ...s }}>
          <div style={{ background: primary+"08", border: `1.5px solid ${primary}25`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${primary}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
              <div>{c.name && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.name}</p>}{c.company && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.company}</p>}</div>
            </div>
            <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#080808" }}>{c.label||"Ajouter à mes contacts"}</div>
          </div>
        </div>
      )
      case "table_booking":
        if (!hasPublishableContent("table_booking", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("🍽️", "Ajoutez le lien de réservation", HIDDEN_WHEN_EMPTY_NOTE)}</div>
        return (
        <div style={{ padding: "4px 16px 10px", ...s }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "13px 18px" }}>
            <span style={{ fontSize: 16 }}>🍽️</span>
            <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Réserver une table"}</p>
          </div>
          {c.platform && <p style={{ color: muted, fontSize: 10, margin: "4px 0 0", textAlign: "center" }}>via {c.platform}</p>}
        </div>
      )
      case "booking_button":
        if (!hasPublishableContent("booking_button", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("📅", "Ajoutez le lien de prise de rendez-vous", HIDDEN_WHEN_EMPTY_NOTE)}</div>
        return (
        <div style={{ padding: "4px 16px 10px", ...s }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(56,189,248,0.08)", border: "1.5px solid rgba(56,189,248,0.25)", borderRadius: 12, padding: "11px 14px" }}>
            <div style={{ width: 38, height: 38, background: "rgba(56,189,248,0.12)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📅</div>
            <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Prendre rendez-vous"}</p>{c.description && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{c.description}</p>}</div>
          </div>
          {c.platform && <p style={{ color: muted, fontSize: 10, margin: "4px 0 0", textAlign: "center" }}>via {c.platform}</p>}
        </div>
      )
      case "payment_button": if (!hasPublishableContent("payment_button", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("💳", "Choisissez la plateforme et son lien", HIDDEN_WHEN_EMPTY_NOTE)}</div>
 return (() => {
        const br = paymentBrand(c.platform)
        const href = paymentLink(c)
        return (
          <div style={{ padding: "4px 16px 10px", ...s }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `${br.color}18`, border: `1.5px solid ${br.color}55`, borderRadius: 12, padding: "13px 18px" }}>
              <span style={{ fontSize: 16 }}>{br.icon}</span>
              <p style={{ color: br.color, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Payer maintenant"}{c.amount ? ` — ${c.amount}` : ""}</p>
            </div>
            {!href && <p style={{ color: "#F59E0B", fontSize: 9, margin: "4px 0 0", textAlign: "center" }}>⚠ {br.handleBased ? "Ajoutez votre pseudo" : "Ajoutez le lien de paiement"} pour activer le bouton</p>}
          </div>
        )
      })()
      case "quote_request": return (
        <div style={{ padding: "4px 16px 10px", ...s }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: primary+"08", border: `1.5px solid ${primary}20`, borderRadius: 12, padding: "11px 14px" }}>
            <div style={{ width: 38, height: 38, background: primary+"12", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📋</div>
            <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Demander un devis"}</p>{c.description && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{c.description}</p>}</div>
            <span style={{ color: primary, fontSize: 14 }}>→</span>
          </div>
        </div>
      )

      case "google_reviews_block": {
        if (!hasPublishableContent("google_reviews_block", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("⭐", "Ajoutez un avis ou une note", HIDDEN_WHEN_EMPTY_NOTE)}</div>
        const reviews = Array.from({length:50},(_,k)=>{const i=k+1;return [c[`r${i}_name`],c[`r${i}_text`],c[`r${i}_stars`]]}).filter(([n])=>n)
        return (
          <div style={{ padding: "10px 16px", ...s }}>
            {(c.avg_rating || c.title) && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 12px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#FBBF24", fontSize: 28, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay }}>{c.avg_rating||"5.0"}</p>
                  <StarRow fills={starRow(c.avg_rating || 5)} size={10} />
                </div>
                <div>
                  <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{c.title||"Avis clients"}</p>
                  {c.total_reviews && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.total_reviews} avis</p>}
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {reviews.map(([name,text_review,stars],i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{name}</p>
                    {etoilesDeLAvis(stars) > 0 && <StarRow fills={starRow(etoilesDeLAvis(stars))} size={10} />}
                  </div>
                  <p style={{ color: muted, fontSize: 11, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{text_review}"</p>
                </div>
              ))}
            </div>
            {c.google_url && <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#4285F4", fontSize: 11, fontWeight: 600 }}>
              <span>📍</span> Voir sur Google
            </div>}
          </div>
        )
      }

      case "external_shop": if (!hasPublishableContent("external_shop", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("🛒", "Ajoutez le lien de votre boutique", HIDDEN_WHEN_EMPTY_NOTE)}</div>
 return (
        <div style={{ padding: "4px 16px 12px", ...s }}>
          {c.description && <p style={{ color: muted, fontSize: 12, margin: "0 0 10px", textAlign: "center" }}>{c.description}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: primary+"10", border: `1.5px solid ${primary}30`, borderRadius: 12, padding: "14px 18px" }}>
            <span style={{ fontSize: 20 }}>🛒</span>
            <div>
              <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Voir la boutique"}</p>
              {c.platform && <p style={{ color: muted, fontSize: 9, margin: 0 }}>via {c.platform}</p>}
            </div>
            <ExternalLink size={13} color={primary} style={{ marginLeft: "auto" }} />
          </div>
        </div>
      )


      case "image_carousel": if (!hasPublishableContent("image_carousel", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("🎠", "Ajoutez au moins une photo", HIDDEN_WHEN_EMPTY_NOTE)}</div>
 {
        const imgs = [c.img1,c.img2,c.img3,c.img4,c.img5,c.img6,c.img7,c.img8,c.img9,c.img10,c.img11,c.img12].filter(Boolean)
        return (
          <div style={{ padding: "10px 16px", ...s }}>
            {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="iphone-scroll">
              {imgs.length===0
                ? [0,1,2].map(i => <div key={i} style={{ width: 120, height: 120, flexShrink: 0, background: "rgba(78,205,196,0.06)", border: "1px solid rgba(78,205,196,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div>)
                : imgs.map((img, i) => <Vignette key={i} src={String(img)} alt="" style={{ width: 120, height: 120, flexShrink: 0, objectFit: "cover", borderRadius: 10 }} />)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
              {Array.from({length: Math.max(imgs.length, 3)}).map((_,i) => <div key={i} style={{ width: i===0 ? 16 : 6, height: 6, borderRadius: 3, background: i===0 ? primary : "rgba(255,255,255,0.2)" }} />)}
            </div>
          </div>
        )
      }

      case "media_before_after": if (!hasPublishableContent("media_before_after", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("🪞", "Ajoutez la photo avant ou après", HIDDEN_WHEN_EMPTY_NOTE)}</div>
 return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>{c.title}</p>}
                    {/* Le mode « curseur » etait reglable et servi au visiteur ; l'apercu
              montrait toujours les deux images cote a cote, sans le dire. */}
          {c.mode === "slider" && c.before_img && c.after_img && (
            <p style={{ color: muted, fontSize: 9, margin: "0 0 6px", textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>↔ Curseur glissant en ligne</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ borderRadius: 10, overflow: "hidden" }}>
              {c.before_img
                ? <Vignette src={c.before_img} alt="Avant" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                : <div style={{ height: 130, background: "rgba(239,68,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📸</div>}
              <div style={{ background: "rgba(239,68,68,0.15)", padding: "6px", textAlign: "center" }}>
                <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.before_label||"Avant"}</p>
              </div>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden" }}>
              {c.after_img
                ? <Vignette src={c.after_img} alt="Après" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                : <div style={{ height: 130, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✨</div>}
              <div style={{ background: "rgba(57,255,143,0.15)", padding: "6px", textAlign: "center" }}>
                <p style={{ color: "var(--success)", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.after_label||"Après"}</p>
              </div>
            </div>
          </div>
          {c.description && <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: "8px 0 0" }}>{c.description}</p>}
        </div>
      )

      case "youtube_gallery": if (!hasPublishableContent("youtube_gallery", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("▶️", "Ajoutez le lien d’une vidéo", HIDDEN_WHEN_EMPTY_NOTE)}</div>
 {
        const videos = Array.from({length:50},(_,k)=>{const i=k+1;return [c[`video${i}_url`],c[`video${i}_title`]]}).filter(([u])=>u)
        return (
          <div style={{ padding: "10px 16px", ...s }}>
            {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {videos.length===0
                ? [0,1,2].map(i => <div key={i} style={{ height: 90, background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span style={{ fontSize: 24 }}>▶️</span><p style={{ color: muted, fontSize: 11, margin: 0 }}>Vidéo YouTube {i+1}</p></div>)
                : videos.map(([url, title], i) => {
                    const videoId = youtubeId(String(url))
                    return (
                      <div key={i} style={{ borderRadius: 10, overflow: "hidden", background: "#000", position: "relative" }}>
                        {videoId
                          ? <Vignette src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                          : <div style={{ height: 90, background: "rgba(255,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>▶️</div>}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 32, height: 32, background: "rgba(255,0,0,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: "#fff", fontSize: 12, marginLeft: 2 }}>▶</span>
                          </div>
                        </div>
                        {title && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.8))", padding: "20px 10px 8px" }}><p style={{ color: "#fff", fontSize: 10, margin: 0 }}>{title}</p></div>}
                      </div>
                    )
                  })}
            </div>
            {c.cta_label && <div style={{ marginTop: 10, background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#FF0000" }}>{c.cta_label}</div>}
          </div>
        )
      }

      case "tiktok_gallery": if (!hasPublishableContent("tiktok_gallery", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("🎵", "Ajoutez le lien d’une vidéo", HIDDEN_WHEN_EMPTY_NOTE)}</div>
 return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          {c.username && <p style={{ color: muted, fontSize: 11, margin: "0 0 10px", textAlign: "center" }}>{c.username}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
            {[c.video1_url, c.video2_url, c.video3_url].map((url, i) => (
              <div key={i} style={{ aspectRatio: "9/16", background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {url ? "🎵" : "📱"}
              </div>
            ))}
          </div>
          {c.cta_label && <div style={{ marginTop: 10, background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.15)", borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: text }}>{c.cta_label}</div>}
        </div>
      )

      case "video_testimonials": {
        // Livré vide : le produit ne met pas de témoignage dans la bouche d'un client.
        if (!hasPublishableContent("video_testimonials", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("🎥", "Ajoutez une vidéo de client", HIDDEN_WHEN_EMPTY_NOTE)}</div>
        const testi = Array.from({length:50},(_,k)=>{const i=k+1;return [c[`t${i}_video_url`],c[`t${i}_name`],c[`t${i}_company`],c[`t${i}_quote`]]}).filter(([,n])=>n)
        return (
          <div style={{ padding: "10px 16px", ...s }}>
            {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {testi.length===0
                ? <div style={{ height: 80, background: "rgba(78,205,196,0.06)", border: "1px dashed rgba(78,205,196,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 11 }}>Ajoutez vos témoignages vidéo</div>
                : testi.map(([url, name, company, quote], i) => {
                  const videoId = youtubeId(String(url||""))
                  return (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
                      {videoId
                        ? <div style={{ position: "relative" }}>
                            <Vignette src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <div style={{ width: 36, height: 36, background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 14, marginLeft: 2 }}>▶</span></div>
                            </div>
                          </div>
                        : <div style={{ height: 80, background: "rgba(78,205,196,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
                      <div style={{ padding: "10px 12px" }}>
                        {quote && <p style={{ color: muted, fontSize: 11, fontStyle: "italic", margin: "0 0 7px" }}>"{quote}"</p>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: primary+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</div>
                          <div><p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{name}</p>{company && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{company}</p>}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )
      }

      case "quote_form": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Demander un devis"}</p>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {champsDe("quote_form", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: f.area ? "8px 11px 36px" : "8px 11px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808" }}>{c.button_label||"Envoyer ma demande"}</div>
          </div>
        </div>
      )

      case "booking_request": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Réserver pour un événement"}</p>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {champsDe("booking_request", c).map(f => (
              <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: f.area ? "8px 11px 32px" : "8px 11px", color: muted, fontSize: 11 }}>{f.label}</div>
            ))}
            <div style={{ background: "linear-gradient(90deg,#9146FF,#7B3FCC)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Envoyer ma demande"}</div>
          </div>
        </div>
      )

      case "event_register": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"S'inscrire gratuitement"}</p>
          {c.description && <p style={{ color: "#EC4899", fontSize: 11, margin: "0 0 12px", fontWeight: 600 }}>⚡ {c.description}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {champsDe("event_register", c).map(f => <div key={f.key} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f.label}</div>)}
            <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Je m'inscris"}</div>
          </div>
        </div>
      )

      case "rsvp": return (
        <div style={{ padding: "10px 16px", ...s }}>
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Serez-vous présent ?"}</p>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 14px" }}>{c.description}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="sm">{c.yes_label||"✅ Oui, je viens"}</Button>
            <Button variant="secondary" size="sm">{c.maybe_label||"🤔 Peut-être"}</Button>
            <Button variant="secondary" size="sm">{c.no_label||"❌ Non"}</Button>
          </div>
        </div>
      )


      case "qr_code_block": return (
        <div style={{ padding: "16px", textAlign: "center", ...s }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#FFFFFF", border: `3px solid ${primary}30`, borderRadius: 14, padding: c.size==="lg" ? 14 : c.size==="sm" ? 7 : 10, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
              <div style={{ width: c.size==="lg" ? 160 : c.size==="sm" ? 80 : 120, height: c.size==="lg" ? 160 : c.size==="sm" ? 80 : 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 2, width: "100%", height: "100%" }}>
                  {Array.from({length:25}).map((_,i) => {
                    const corners = [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24]
                    return <div key={i} style={{ background: corners.includes(i) ? "#111" : Math.random()>0.4 ? "#111" : "transparent", borderRadius: 1 }} />
                  })}
                </div>
              </div>
            </div>
            {c.label && <p style={{ color: text, fontSize: 12, fontWeight: 600, margin: 0 }}>{c.label}</p>}
            {c.show_url!=="no" && <p style={{ color: muted, fontSize: 10, margin: 0, fontFamily: "monospace" }}>/q/...</p>}
            {/* Vérité UX : ce bloc ne s'affiche PAS sur la page publiée (le renderer
                public renvoie null). On le signale pour ne pas laisser croire à un rendu. */}
            <p style={{ color: muted, fontSize: 9, margin: "4px 0 0", fontStyle: "italic", maxWidth: 200, lineHeight: 1.4 }}>
              Aperçu éditeur — ce bloc n'apparaît pas sur la page publiée.
            </p>
          </div>
        </div>
      )

      case "embed_block":
        if (!hasPublishableContent("embed_block", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("🔗", "Ajoutez l'adresse à intégrer", HIDDEN_WHEN_EMPTY_NOTE)}</div>
        return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.url
            ? <div>
                {c.title && <p style={{ color: muted, fontSize: 10, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.title}</p>}
                <iframe src={embedHref(c.url)} width="100%" height={parseInt(c.height||"400")} style={{ border: "none", borderRadius: 12, display: "block" }} loading="lazy" />
              </div>
            : <div style={{ background: "rgba(201,168,76,0.06)", border: "1.5px dashed rgba(201,168,76,0.25)", borderRadius: 12, padding: "30px", textAlign: "center" }}>
                <span style={{ fontSize: 32, display: "block", marginBottom: 10 }}>🔗</span>
                <p style={{ color: text, fontSize: 13, fontWeight: 600, margin: "0 0 5px" }}>{c.title||"Embed externe"}</p>
                <p style={{ color: muted, fontSize: 11, margin: 0 }}>Google Forms, Typeform, Notion…</p>
              </div>}
        </div>
      )

      case "calendly": if (!hasPublishableContent("calendly", c)) return <div style={{ padding: "10px 16px", ...s }}>{emptyHint("📅", "Ajoutez le lien de votre agenda", HIDDEN_WHEN_EMPTY_NOTE)}</div>

        return (
        <div style={{ padding: "8px 16px", ...s }}>
          <div style={{ background: `${primary}08`, border: `1px solid ${primary}20`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, background: `${primary}14`, border: `1px solid ${primary}25`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📅</div>
              <div>{c.label && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label}</p>}{c.description && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.description}</p>}</div>
            </div>
            <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, color: "#080808", textAlign: "center", padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{"Réserver un créneau"}</div>
          </div>
        </div>
      )
      default: {
        const def = BLOCK_DEFS[block.type]
        return <div style={{ padding: "12px 16px", textAlign: "center", ...s }}><span style={{ fontSize: 22 }}>{def?.icon||"📦"}</span><p style={{ color: muted, fontSize: 11, margin: "5px 0 0" }}>{def?.label||block.type}</p></div>
      }
    }
    })())
  }

