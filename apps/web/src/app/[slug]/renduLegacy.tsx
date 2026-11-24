"use client"

// ─────────────────────────────────────────────────────────────────────────────
// RENDU LEGACY DE LA PAGE PUBLIÉE — chargé À LA DEMANDE.
//
// Mesuré le 6 septembre sur le fichier construit : le morceau de JavaScript que
// tout visiteur télécharge après un scan pesait 143 Ko (33 Ko compressés). Sur
// les 99 Ko de `case` qu'il contenait, 91 Ko concernaient des blocs DÉJÀ servis
// par le renderer partagé : du code que plus personne n'exécute, conservé pour
// pouvoir revenir en arrière — et payé par chaque visiteur, à chaque scan.
//
// L'assurance reste, elle cesse simplement de voyager avec le visiteur. Ce
// module n'est chargé que si un bloc de la page n'est PAS servi par le renderer
// partagé : retirer un type de SHARED_RENDERER_BLOCKS le fait revenir aussitôt.
// `dynamic()` conserve le rendu serveur — le HTML arrive complet, rien ne
// clignote, le référencement est intact.
//
// Après découpe : 143 Ko → 63 Ko (33 → 19 Ko compressés) pour une page dont
// tous les blocs sont migrés.
// ─────────────────────────────────────────────────────────────────────────────

import { fabriqueLisible } from "@/app/dashboard/builder/shared-renderer/renderTypes"
import { etoilesDeLAvis } from "@/app/dashboard/builder/shared-renderer/models/testimonials"
import { type AnchorHTMLAttributes } from "react"
import { ExternalLink } from "lucide-react"
import SmartImage from "@/components/SmartImage"
// Les images de la page publiée : celles qui SONT le contenu (galerie, carrousel,
// bannière sans texte incrusté) reçoivent un texte alternatif ; les vignettes
// posées à côté d'un titre déjà lisible gardent `alt=""` — un lecteur d'écran
// qui annonce deux fois le même nom est plus pénible qu'utile (WCAG H67).
import { altDe } from "@/lib/texteAlternatif"
import { BeforeAfterPublic, ShareButton, StarRow, CountdownPublic, CarouselPublic, TabsPublic, AccordionPublic, RsvpPublic, EventRegisterPublic, LeadFormPublic, SIZES_PLEINE, SIZES_DEMI } from "./blocsPublics"
import { trackLinkClick } from "@/lib/trackLinkClick"
import { contactFormFields, reservationFormFields, quoteFormFields, bookingRequestFields, telephoneDirect } from "@/lib/leadForms"
import { destinationUtile } from "../dashboard/builder/types"
import { hasPublishableContent } from "../dashboard/builder/blockEmptyState"
import { bannerBackgroundStyle, bannerHeight, bannerImageStyle, bannerTitleStyle, bannerOverlayLayers, bannerFrame, paymentBrand, paymentLink, starRow, buildVCard, youtubeId, embedHref, docTypeMeta, docActionLabel, telLink, stickyActionHref, BANNER_ANIM_CSS } from "../dashboard/builder/types"
import { entierDuContenu } from "@/lib/nombreDuContenu"
type Block = { id: string; type: string; content: Record<string, any>; position: number }

/**
 * Un lien qui n'existe pas sans destination.
 *
 * Le rendu public repliait chaque href sur une ancre morte à trente
 * endroits. Le commerçant remplit « Commander », oublie l'adresse — ou en colle
 * une que `extHref` refuse — et la page publiait quand même un bouton bien
 * visible : le visiteur clique, la page se recharge, rien ne se passe. Il en
 * conclut que le commerce ne fonctionne pas. Un bouton absent est moins grave.
 *
 * Rendre `null` plutôt qu'une ancre sans href : une ancre nue se clique aussi.
 */
function LienPublic({ href, children, ...reste }: { href?: string | null } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const cible = destinationUtile(href)
  if (!cible) return null
  return <a href={cible} {...reste}>{children}</a>
}

export function RenduLegacy({ block, theme, pageId, ownerEmail, totalViews, h1Owner, nomCommerce }: { block: Block; theme: any; pageId: string; ownerEmail?: string; totalViews?: number; h1Owner?: string; nomCommerce?: string | null }) {
  const c = block.content
  // ── Lot v169 : le chemin de repli pose la MÊME question que la page ───────
  //
  // Ce module est l'assurance : « retirer un type de SHARED_RENDERER_BLOCKS le
  // fait revenir aussitôt », dit l'en-tête. Sauf que les corrections, elles,
  // n'y sont pas revenues. Comparés bloc à bloc sur un contenu VIDE, six blocs
  // migrés publiaient ici ce que le renderer partagé refuse — dont la carte
  // « 🎧 Écouter sur Spotify » sans bouton, le défaut même que le lot v166 a
  // réparé, et la carte « 📍 Adresse » sans adresse.
  //
  // `hasPublishableContent` est le miroir exact du filtre public, vérifié en
  // l'exécutant sur les cent quarante-six blocs (lots v166 et v167). Poser la
  // question ici, c'est faire dire au repli ce que dit le produit — une fois,
  // pour tous les blocs, y compris ceux qu'aucun lot n'a encore regardés.
  if (!hasPublishableContent(block.type, c)) return null
  const G = theme.primary || "#C9A84C"
  const MUTED = theme.muted || "#8A8478"
  const TEXT = theme.text || "#F5F0E8"
  const FONT_D = theme.fontDisplay || "Fraunces, serif"
  const FONT_B = theme.fontBody || "DM Sans, sans-serif"

  switch (block.type) {

    // Réutilise le formulaire de leads partagé (envoi réel via submitLead → /api/leads,
    // owner résolu côté serveur, honeypot, état d'envoi, anti-double-clic, accusé email).
    // Ancienne version : <form> décorative sans handler ⇒ les messages étaient perdus.
    case "contact_form": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="contact" title={c.title || "Contact"} fields={contactFormFields(c)} button={c.button_label || "Envoyer"} accent={`linear-gradient(90deg,${G},${G}cc)`} buttonTextColor="#080808" subject="Nouveau message de contact" TEXT={TEXT} MUTED={MUTED} />


    case "countdown": return <CountdownPublic c={c} TEXT={TEXT} MUTED={MUTED} FONT_D={FONT_D} FONT_B={FONT_B} pageId={pageId} blockId={block.id} />


    case "visit_counter": {
      const views = typeof totalViews === "number" && totalViews > 0 ? totalViews : 0
      if (views <= 0) return null
      const fmt = String(views).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
      return (
        <div style={{ padding: "12px 24px 16px", textAlign: "center" }}>
          <p style={{ fontFamily: FONT_D, fontSize: 44, color: G, fontWeight: 700, margin: "0 0 3px" }}>{fmt}</p>
          <p style={{ color: MUTED, fontSize: 13, margin: 0, fontFamily: FONT_B }}>{c.label || "visiteurs"}</p>
        </div>
      )
    }

    // Sans adresse de reservation, ce bloc publiait un bouton « Reserver » qui
    // menait a « # ». Un bouton mort est pire qu'un bloc absent.
    case "calendly": return !(c.url || "").trim() ? null : (
      <div style={{ padding: "6px 24px 16px" }}>
        <div style={{ background: `${G}07`, border: `1px solid ${G}20`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📅</div>
            <div>
              {/* `c.label` servait à la fois de titre de la carte ET de texte du
                  bouton, avec deux replis différents : une page en ligne affichait
                  deux fois « Reserver un appel decouverte ». Le titre est celui du
                  commerçant ; le bouton porte son propre libellé. (Vague 24.) */}
              {c.label && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label}</p>}
              {c.description && <p style={{ color: MUTED, fontSize: 13.5, margin: 0, fontFamily: FONT_B }}>{c.description}</p>}
            </div>
          </div>
          <LienPublic href={c.url} onClick={() => trackLinkClick(pageId, block.id, c.url||"calendly")} target="_blank" rel="noopener noreferrer" style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", textAlign: "center", padding: "13px", borderRadius: 9, textDecoration: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{"Réserver un créneau"}</LienPublic>
        </div>
      </div>
    )

    case "cover_banner": {
      // Sans image, sans titre ni sous-titre, la banniere n'etait qu'un rectangle
      // de 167 caracteres de HTML : rien a voir, mais un trou dans la page.
      if (!c.src && !(c.cover_title || "").trim() && !(c.cover_subtitle || "").trim() && (c.banner_type || "") !== "gradient" && (c.banner_type || "") !== "color") return null
      const h = bannerHeight(c, "public")
      const btype = c.banner_type || (c.src ? "image" : "gradient")
      const pos = c.text_position || "bottom-left"
      const anim = c.animation && c.animation !== "none" ? c.animation : null
      const rad = entierDuContenu(c.block_radius, 0, 0, 200)
      const txtColor = c.text_color || "#fff"
      const bannerBg = bannerBackgroundStyle(c, G)
      const ovLayers = bannerOverlayLayers(c, G)
      const frame = bannerFrame(c, G, rad || 0)
      const alignItems = pos === "center" ? "center" : "flex-end"
      const justifyContent = (pos === "bottom-center" || pos === "center") ? "center" : "flex-start"
      const textAlign: any = (pos === "bottom-center" || pos === "center") ? "center" : "left"
      const inner = (
        <div className={anim ? `qfb qfb-${anim}` : undefined} style={{ position: "relative", overflow: "hidden", borderRadius: rad || undefined, boxShadow: frame.boxShadow }}>
          {anim && <style>{BANNER_ANIM_CSS}</style>}
          {btype === "image"
            ? (c.src
              ? <SmartImage width={1600} height={600} sizes={SIZES_PLEINE} onError={e => { e.currentTarget.style.display = 'none' }} className="qfb-media" src={c.src} alt={c.cover_title ? "" : altDe(c.title, "Bannière")} style={{ width: "100%", height: h, display: "block", ...bannerImageStyle(c) }} />
              : <div className="qfb-media" style={{ width: "100%", height: h, background: `linear-gradient(135deg,${G}33,${theme.accent || "var(--success)"}22)` }} />)
            : <div className="qfb-media" style={{ width: "100%", height: h, ...bannerBg }} />}
          {anim === "shimmer" && <div className="qfb-shine" />}
          {ovLayers.map((l, i) => <div key={i} className={l.className} style={l.style} />)}
          {frame.borderLayer && <div style={frame.borderLayer.style} />}
          {(c.cover_title || c.cover_subtitle || c.badge) && (
            <div className="qfb-content" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems, justifyContent, padding: "16px 22px", textAlign, gap: 6 }}>
              {c.badge && <span style={{ alignSelf: pos === "bottom-left" ? "flex-start" : "center", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>{c.badge}</span>}
              {c.cover_title && <p style={bannerTitleStyle(c, "public", txtColor, FONT_D)}>{c.cover_title}</p>}
              {c.cover_subtitle && <p style={{ color: txtColor, opacity: 0.9, fontSize: entierDuContenu(c.subtitle_size, 14, 8, 96), margin: 0, textShadow: "0 1px 8px rgba(0,0,0,0.55)", fontFamily: FONT_B }}>{c.cover_subtitle}</p>}
            </div>
          )}
        </div>
      )
      return c.link_url
        ? <LienPublic href={c.link_url} target={c.link_blank !== "no" && /^https?:/.test(c.link_url) ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.link_url)} style={{ display: "block", textDecoration: "none", cursor: "pointer" }}>{inner}</LienPublic>
        : inner
    }
    case "sticky_bar": {
      const acts = [1, 2, 3, 4, 5].map(i => ({ ...stickyActionHref(c[`a${i}_type`], c[`a${i}_value`]), t: c[`a${i}_type`] })).filter(a => a.t && a.t !== "none" && (a.href || a.share))
      if (acts.length === 0) return null
      const showL = c.show_labels !== "no"
      const barBg = c.bar_style === "solid" ? "#0A0A0A" : c.bar_style === "gold" ? `linear-gradient(90deg,${G},${G}dd)` : "rgba(12,12,12,0.82)"
      const goldStyle = c.bar_style === "gold"
      const pos = c.position === "top" ? { top: 0 } : { bottom: 0 }
      return (
        <>
          <div style={{ height: 68 }} aria-hidden />
          <div style={{ position: "fixed", ...pos, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, zIndex: 60, background: barBg, backdropFilter: c.bar_style === "blur" ? "blur(14px)" : undefined, WebkitBackdropFilter: c.bar_style === "blur" ? "blur(14px)" : undefined, borderTop: c.position === "top" ? "none" : "1px solid rgba(255,255,255,0.1)", borderBottom: c.position === "top" ? "1px solid rgba(255,255,255,0.1)" : "none", boxShadow: c.position === "top" ? "0 8px 24px rgba(0,0,0,0.4)" : "0 -8px 24px rgba(0,0,0,0.4)", display: "flex", justifyContent: "space-around", alignItems: "stretch", padding: `8px 6px calc(8px + env(safe-area-inset-bottom))` }}>
            {acts.slice(0, 5).map((a, i) => {
              const col = goldStyle ? "#080808" : a.color
              const inner = <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}><span style={{ fontSize: 20 }}>{a.icon}</span>{showL && <span style={{ color: col, fontSize: 11, fontWeight: 700 }}>{a.label}</span>}</span>
              const st: any = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "6px 4px", textDecoration: "none", background: "transparent", border: "none", cursor: "pointer" }
              return a.share
                ? <ShareButton key={i} pageId={pageId} blockId={block.id} style={st} inner={inner} />
                : <a key={i} href={a.href} target={/^https?:/.test(a.href || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, `bar:${a.t}`)} style={st}>{inner}</a>
            })}
          </div>
        </>
      )
    }
    case "payment_button": {
      const href = paymentLink(c)
      if (!href) return null
      const br = paymentBrand(c.platform)
      return (
        <div style={{ padding: "6px 24px 10px" }}>
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "payment")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: br.color, borderRadius: 13, padding: "15px 18px", textDecoration: "none", color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: FONT_B, boxShadow: `0 4px 16px ${br.color}44` }}>
            <span>{br.icon}</span> {c.label || "Payer maintenant"}{c.amount ? ` — ${c.amount}` : ""}
          </a>
        </div>
      )
    }
    case "booking_button": return c.url ? (
      <div style={{ padding: "6px 24px 10px" }}>
        <LienPublic href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, "booking")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: `${G}12`, border: `1.5px solid ${G}35`, borderRadius: 13, padding: "15px 18px", textDecoration: "none", color: G, fontSize: 15, fontWeight: 700, fontFamily: FONT_B }}>
          📅 {c.label || "Prendre rendez-vous"}
        </LienPublic>
        {/* La description (« Consultation de 30 min », « Sur rendez-vous uniquement »…)
            était réglable, affichée dans l'aperçu, et n'arrivait jamais au visiteur. */}
        {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "6px 0 0", textAlign: "center", fontFamily: FONT_B }}>{c.description}</p>}
        {/* « Plateforme » (Google Calendar, Microsoft Bookings…) etait reglable et
            affichee nulle part : le commercant la choisissait, rien ne changeait. */}
        {c.platform && <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0", textAlign: "center", fontFamily: FONT_B }}>via {c.platform}</p>}
      </div>
    ) : null
    case "multi_cta": {
      // Le filtre ne retenait que les boutons PORTANT UN TEXTE. Ceux sans adresse
      // passaient donc le filtre, puis LienPublic les effaçait un par un : la
      // grille restait, vide, sur la page du client. On filtre maintenant sur ce
      // qui décide vraiment — la destination. (Vague 25.)
      const btns = Array.from({ length: 50 }, (_, k) => { const i = k + 1; return [(c as any)[`btn${i}_icon`], (c as any)[`btn${i}_label`], (c as any)[`btn${i}_url`]] })
        .filter(([, l, url]) => l && destinationUtile(url as string))
      return btns.length > 0 ? (
        <div style={{ padding: "6px 24px 10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {btns.map(([icon, label, url]: any[], i: number) => (
              <LienPublic key={i} href={url} target={/^https?:/.test(url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, url || "cta")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: `${G}10`, border: `1px solid ${G}22`, borderRadius: 12, padding: "13px 8px", textDecoration: "none" }}>
                <span style={{ fontSize: 22 }}>{icon || "⚡"}</span>
                <span style={{ color: TEXT, fontSize: 12, fontWeight: 600, textAlign: "center", fontFamily: FONT_B }}>{label}</span>
              </LienPublic>
            ))}
          </div>
        </div>
      ) : null
    }
    // Idem : « Recevoir mon cadeau » sans rien au bout.
    case "free_gift": return !(c.url || "").trim() ? null : (
      <div style={{ padding: "6px 24px 12px" }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1.5px solid rgba(236,72,153,0.25)", borderRadius: 13, padding: "16px", textAlign: "center" }}>
          <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>{c.emoji || "🎁"}</span>
          {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 11px", fontFamily: FONT_B }}>{c.description}</p>}
          <LienPublic href={c.url} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "gift")} style={{ display: "block", background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.label || "Recevoir mon guide gratuit"}</LienPublic>
        </div>
      </div>
    )
    case "google_reviews_block": {
      const reviews = Array.from({ length: 50 }, (_, k) => { const i = k + 1; return [(c as any)[`r${i}_name`], (c as any)[`r${i}_text`], (c as any)[`r${i}_stars`]] }).filter(([n]) => n)
      return (reviews.length > 0 || c.avg_rating) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {(c.avg_rating || c.title) && (
            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 13, padding: "12px 14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 11 }}>
              {c.avg_rating && (<div style={{ textAlign: "center" }}>
                <p style={{ color: "#FBBF24", fontSize: 30, fontWeight: 700, margin: 0, fontFamily: FONT_D }}>{c.avg_rating}</p>
                <StarRow fills={starRow(c.avg_rating)} size={11} />
              </div>)}
              <div>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.title || "Avis clients"}</p>
                {c.total_reviews && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.total_reviews} avis</p>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviews.map(([name, txt, stars]: any[], i: number) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}</p>
                  {etoilesDeLAvis(stars) > 0 && <StarRow fills={starRow(etoilesDeLAvis(stars))} size={11} />}
                </div>
                <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>&quot;{txt}&quot;</p>
              </div>
            ))}
          </div>
          {c.google_url && <LienPublic href={c.google_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.google_url)} style={{ marginTop: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "#4285F4", fontSize: 12, fontWeight: 600, textDecoration: "none" }}><span>📍</span> Voir sur Google</LienPublic>}
        </div>
      ) : null
    }
    case "tabs_block": {
      const tabs = Array.from({ length: 50 }, (_, k) => { const i = k + 1; return [(c as any)[`tab${i}_label`], (c as any)[`tab${i}_content`]] }).filter(([l]) => l) as [string, string][]
      return tabs.length > 0 ? <TabsPublic tabs={tabs} G={G} TEXT={TEXT} MUTED={MUTED} FONT_B={FONT_B} /> : null
    }
    case "accordion_block": {
      const items = Array.from({ length: 50 }, (_, k) => { const i = k + 1; return [(c as any)[`a${i}_title`], (c as any)[`a${i}_content`]] }).filter(([t]) => t) as [string, string][]
      return items.length > 0 ? <AccordionPublic items={items} title={c.title} G={G} TEXT={TEXT} MUTED={MUTED} FONT_B={FONT_B} /> : null
    }
    case "image_carousel": {
      const paires = [1,2,3,4,5,6,7,8,9,10,11,12].map(n => [c[`img${n}`], c[`img${n}_alt`]] as const).filter(([u]) => Boolean(u))
      const imgs = paires.map(([u]) => u as string)
      return imgs.length > 0 ? <CarouselPublic imgs={imgs} legendes={paires.map(([, a]) => (a as string) || "")} title={c.title} autoplay={c.auto_play === "yes"} MUTED={MUTED} FONT_B={FONT_B} /> : null
    }
    case "media_before_after": return (c.before_img || c.after_img) ? (
      <div style={{ padding: "10px 24px 14px" }}>
        {c.title && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 11px", textAlign: "center", fontFamily: FONT_B }}>{c.title}</p>}
        {c.mode === "slider" && c.before_img && c.after_img
          ? <BeforeAfterPublic before={c.before_img} after={c.after_img} beforeLabel={c.before_label || "Avant"} afterLabel={c.after_label || "Après"} />
          : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
          <div style={{ borderRadius: 11, overflow: "hidden" }}>
            {c.before_img ? <SmartImage width={1200} height={900} sizes={SIZES_DEMI} onError={e => { e.currentTarget.style.display = 'none' }} src={c.before_img} alt="Avant" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(239,68,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📸</div>}
            <div style={{ background: "rgba(239,68,68,0.15)", padding: "7px", textAlign: "center" }}><p style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, margin: 0 }}>{c.before_label || "Avant"}</p></div>
          </div>
          <div style={{ borderRadius: 11, overflow: "hidden" }}>
            {c.after_img ? <SmartImage width={1200} height={900} sizes={SIZES_DEMI} onError={e => { e.currentTarget.style.display = 'none' }} src={c.after_img} alt="Après" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>✨</div>}
            <div style={{ background: "rgba(57,255,143,0.15)", padding: "7px", textAlign: "center" }}><p style={{ color: "var(--success)", fontSize: 12, fontWeight: 700, margin: 0 }}>{c.after_label || "Après"}</p></div>
          </div>
        </div>}
        {c.description && <p style={{ color: MUTED, fontSize: 13.5, textAlign: "center", margin: "9px 0 0" }}>{c.description}</p>}
      </div>
    ) : null
    case "youtube_gallery": {
      const videos = Array.from({ length: 50 }, (_, k) => { const i = k + 1; return [(c as any)[`video${i}_url`], (c as any)[`video${i}_title`]] }).filter(([u]) => u)
      return videos.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {videos.map(([url, title]: any[], i: number) => {
              const videoId = youtubeId(String(url))
              return (
                <LienPublic key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ display: "block", borderRadius: 11, overflow: "hidden", background: "#000", position: "relative", textDecoration: "none" }}>
                  {videoId ? <SmartImage width={1200} height={900} sizes={SIZES_DEMI} onError={e => { e.currentTarget.style.display = 'none' }} src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} /> : <div style={{ height: 150, background: "rgba(255,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>▶️</div>}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 44, height: 44, background: "rgba(255,0,0,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 16, marginLeft: 3 }}>▶</span></div>
                  </div>
                  {title && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.85))", padding: "24px 12px 10px" }}><p style={{ color: "#fff", fontSize: 12, margin: 0, fontFamily: FONT_B }}>{title}</p></div>}
                </LienPublic>
              )
            })}
          </div>
          {c.cta_label && c.channel_url && <LienPublic href={c.channel_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.channel_url)} style={{ display: "block", marginTop: 11, background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#FF0000", textDecoration: "none" }}>{c.cta_label}</LienPublic>}
        </div>
      ) : null
    }
    case "tiktok_gallery": {
      const vids = [c.video1_url, c.video2_url, c.video3_url].filter(Boolean)
      return (vids.length > 0 || c.cta_url) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          {c.username && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 10px", textAlign: "center" }}>{c.username}</p>}
          {vids.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {/* Trois tuiles identiques portant une note de musique : un lecteur
                  d'écran annonçait « lien », trois fois, sans rien de plus. Le
                  visiteur voyant, lui, ne distinguait pas non plus les vidéos —
                  mais lui pouvait au moins cliquer pour voir. (Vague 26.) */}
              {[c.video1_url, c.video2_url, c.video3_url].map((url, i) => url ? (
                <LienPublic key={i} href={String(url)} target="_blank" rel="noopener noreferrer" aria-label={`${c.username ? `${c.username} — ` : ""}TikTok ${i + 1} sur ${vids.length}`} onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ aspectRatio: "9/16", background: "linear-gradient(135deg,rgba(255,0,80,0.15),rgba(0,242,234,0.15))", border: "1px solid rgba(245,240,232,0.12)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, textDecoration: "none" }}><span aria-hidden>🎵</span></LienPublic>
              ) : <div key={i} style={{ aspectRatio: "9/16", background: "rgba(245,240,232,0.06)", borderRadius: 9 }} />)}
            </div>
          )}
          {c.cta_label && c.cta_url && <LienPublic href={c.cta_url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.cta_url)} style={{ display: "block", marginTop: 11, background: "linear-gradient(90deg,#ff0050,#00f2ea)", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: "none", fontFamily: FONT_B }}>{c.cta_label}</LienPublic>}
        </div>
      ) : null
    }
    case "video_testimonials": {
      const testi = Array.from({ length: 50 }, (_, k) => { const i = k + 1; return [(c as any)[`t${i}_video_url`], (c as any)[`t${i}_name`], (c as any)[`t${i}_company`], (c as any)[`t${i}_quote`]] }).filter(([, n]) => n)
      return testi.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {testi.map(([url, name, company, quote]: any[], i: number) => {
              const videoId = youtubeId(String(url || ""))
              const inner = (
                <>
                  {videoId && (
                    <div style={{ position: "relative" }}>
                      <SmartImage width={1200} height={900} sizes={SIZES_DEMI} onError={e => { e.currentTarget.style.display = 'none' }} src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 40, height: 40, background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 15, marginLeft: 3 }}>▶</span></div>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "12px 14px" }}>
                    {quote && <p style={{ color: TEXT, fontSize: 13, fontStyle: "italic", margin: "0 0 7px", lineHeight: 1.5, fontFamily: FONT_B }}>&quot;{quote}&quot;</p>}
                    <p style={{ color: G, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{name}{company ? <span style={{ color: MUTED, fontWeight: 400 }}> — {company}</span> : null}</p>
                  </div>
                </>
              )
              return videoId
                ? <LienPublic key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={{ display: "block", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 13, overflow: "hidden", textDecoration: "none" }}>{inner}</LienPublic>
                : <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 13, overflow: "hidden" }}>{inner}</div>
            })}
          </div>
        </div>
      ) : null
    }
    case "event_register": return <EventRegisterPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} ownerEmail={ownerEmail} nomCommerce={nomCommerce} />
    case "rsvp": return <RsvpPublic block={block} pageId={pageId} TEXT={TEXT} MUTED={MUTED} nomCommerce={nomCommerce} />

    case "vcard": {
      const vcf = buildVCard(c)
      const href = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`
      return (c.name || c.phone || c.email) ? (
        <div style={{ padding: "6px 24px 12px" }}>
          <div style={{ background: `${G}08`, border: `1.5px solid ${G}25`, borderRadius: 13, padding: "13px 15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${G},${G}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>
              <div>{c.name && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.name}</p>}{c.company && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.company}</p>}</div>
            </div>
            <a href={href} download={`${(c.name || "contact").replace(/\s+/g, "_")}.vcf`} onClick={() => trackLinkClick(pageId, block.id, "vcard")} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808", textDecoration: "none", fontFamily: FONT_B }}>{c.label || "Ajouter à mes contacts"}</a>
          </div>
        </div>
      ) : null
    }
    case "table_booking": {
      // Vague 2 (23 nov.) : rouge en dur (#EF4444), à 3,8:1 sur fond blanc et
      // étranger à tout thème. La couleur du thème, rendue lisible sur le fond de
      // la page par la même règle que les blocs partagés (fabriqueLisible).
      const encre = fabriqueLisible(theme)(G)
      return c.url ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <LienPublic href={c.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url)} data-reserver="" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: `color-mix(in srgb, ${encre} 10%, transparent)`, border: `1.5px solid color-mix(in srgb, ${encre} 35%, transparent)`, borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 17 }}>🍽️</span>
          <span style={{ color: encre, fontSize: 14, fontWeight: 700, fontFamily: FONT_B }}>{c.label || "Réserver une table"}</span>
        </LienPublic>
        {c.platform && <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0", textAlign: "center", fontFamily: FONT_B }}>via {c.platform}</p>}
      </div>
    ) : null
    }
    // Même cadre vide que external_shop, même cause. (Vague 25.)
    case "quote_request": return destinationUtile(c.url) ? (
      <div style={{ padding: "6px 24px 12px" }}>
        <LienPublic href={c.url} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "quote")} style={{ display: "flex", alignItems: "center", gap: 11, background: `${G}08`, border: `1.5px solid ${G}20`, borderRadius: 13, padding: "12px 15px", textDecoration: "none" }}>
          <div style={{ width: 40, height: 40, background: `${G}12`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Demander un devis"}</p>{c.description && <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{c.description}</p>}</div>
          <span style={{ color: G, fontSize: 15 }}>→</span>
        </LienPublic>
      </div>
    ) : null
    case "reservation_form": {
      // Le « Téléphone direct » du panneau : un restaurant qui le renseigne veut
      // qu'on l'appelle. Il était réglable et rendu nulle part (vague 23).
      const ligneDirecte = telephoneDirect(c)
      const appel = telLink(ligneDirecte)
      return (
        <>
          <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="reservation" title={c.title || "Réserver"} fields={reservationFormFields(c)} button={c.button_label || "Réserver"} accent="linear-gradient(90deg,#EF4444,#dc2626)" subject={`Réservation: ${c.title || ""}`} TEXT={TEXT} MUTED={MUTED} />
          {appel && (
            <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 13 }}>
              <a href={appel} onClick={() => trackLinkClick(pageId, block.id, appel)} style={{ color: MUTED, textDecoration: "none" }}>
                ou appelez directement le <strong style={{ color: TEXT }}>{ligneDirecte}</strong>
              </a>
            </p>
          )}
        </>
      )
    }
    case "quote_form": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="quote" title={c.title || "Demander un devis"} description={c.description} fields={quoteFormFields(c)} button={c.button_label || "Envoyer ma demande"} accent={`linear-gradient(90deg,${G},${G}cc)`} buttonTextColor="#080808" subject="Demande de devis" TEXT={TEXT} MUTED={MUTED} />
    case "booking_request": return <LeadFormPublic block={block} pageId={pageId} ownerEmail={ownerEmail} nomCommerce={nomCommerce} leadType="booking" title={c.title || "Réserver pour un événement"} description={c.description} fields={bookingRequestFields(c)} button={c.button_label || "Envoyer ma demande"} accent="linear-gradient(90deg,#9146FF,#7B3FCC)" subject="Demande de réservation événement" TEXT={TEXT} MUTED={MUTED} />
    case "service_area": {
      const cities = [c.city1, c.city2, c.city3, c.city4, c.city5, c.city6].filter(Boolean)
      return (c.area || cities.length > 0) ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: FONT_B }}>{c.title}</p>}
          {c.area && (
            <div style={{ display: "flex", alignItems: "center", gap: 11, background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 11, padding: "12px 15px", marginBottom: cities.length > 0 ? 11 : 0 }}>
              <span style={{ fontSize: 21 }}>📍</span>
              <div><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: FONT_B }}>{c.area}</p>{c.radius && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.radius}</p>}</div>
            </div>
          )}
          {cities.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{cities.map((city: string, i: number) => <span key={i} style={{ background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 20, padding: "6px 13px", color: TEXT, fontSize: 13 }}>📍 {city}</span>)}</div>}
          {c.note && <p style={{ color: MUTED, fontSize: 13.5, margin: "11px 0 0", fontStyle: "italic" }}>{c.note}</p>}
        </div>
      ) : null
    }
    // Sans destination, ce bloc n'avait plus rien à publier — mais la condition
    // regardait le LIBELLÉ. Un commerçant qui posait « Voir la boutique » sans
    // coller son adresse publiait un cadre vide de 41 octets. (Vague 25.)
    case "external_shop": return destinationUtile(c.url) ? (
      <div style={{ padding: "6px 24px 14px" }}>
        {c.description && <p style={{ color: MUTED, fontSize: 13, margin: "0 0 11px", textAlign: "center" }}>{c.description}</p>}
        <LienPublic href={c.url} target={/^https?:/.test(c.url || "") ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, c.url || "shop")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: `${G}10`, border: `1.5px solid ${G}30`, borderRadius: 13, padding: "15px 18px", textDecoration: "none" }}>
          <span style={{ fontSize: 21 }}>🛒</span>
          <div><p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: 0, fontFamily: FONT_B }}>{c.label || "Voir la boutique"}</p>{c.platform && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>via {c.platform}</p>}</div>
          <ExternalLink size={14} color={G} style={{ marginLeft: "auto" }} />
        </LienPublic>
      </div>
    ) : null
    case "popular_products": {
      const tops = Array.from({ length: 50 }, (_, k) => { const i = k + 1; return [(c as any)[`p${i}_rank`], (c as any)[`p${i}_img`], (c as any)[`p${i}_name`], (c as any)[`p${i}_price`], (c as any)[`p${i}_sales`], (c as any)[`p${i}_url`]] }).filter(([, , n]) => n)
      return tops.length > 0 ? (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tops.map(([rank, img, name, price, sales, url]: any[], i: number) => {
              const inner = <>
                {rank && <span style={{ fontSize: 19, flexShrink: 0 }}>{String(rank).split(" ")[0]}</span>}
                {img ? <SmartImage onError={e => { e.currentTarget.style.display = 'none' }} src={String(img)} alt="" width={44} height={44} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 44, height: 44, background: `${G}10`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, flexShrink: 0 }}>🏆</div>}
                <div style={{ flex: 1, minWidth: 0 }}><p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 1px", fontFamily: FONT_B }}>{name}</p>{sales && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{sales}</p>}</div>
                {price && <span style={{ color: G, fontSize: 14, fontWeight: 700, flexShrink: 0, maxWidth: "50%", overflowWrap: "anywhere" }}>{price}</span>}
              </>
              const st: any = { display: "flex", alignItems: "center", gap: 11, background: i === 0 ? `${G}08` : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? `${G}20` : "rgba(255,255,255,0.07)"}`, borderRadius: 11, padding: "11px 13px", textDecoration: "none" }
              return url ? <LienPublic key={i} href={String(url)} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, String(url))} style={st}>{inner}</LienPublic> : <div key={i} style={st}>{inner}</div>
            })}
          </div>
        </div>
      ) : null
    }
    case "documents": {
      const docs = Array.from({ length: 50 }, (_, k) => k + 1)
        .map(i => ({ type: c[`d${i}_type`] as string, title: c[`d${i}_title`] as string, desc: (c[`d${i}_desc`] || "") as string, url: (c[`d${i}_url`] || "").trim() as string, meta: (c[`d${i}_meta`] || "") as string }))
        .filter(d => d.title)
      if (docs.length === 0) return null
      return (
        <div style={{ padding: "10px 24px 14px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", fontFamily: FONT_B }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {docs.map((d, i) => {
              const dm = docTypeMeta(d.type)
              const inner = <>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${dm.color}14`, border: `1px solid ${dm.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{dm.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: TEXT, fontSize: 13.5, fontWeight: 700, margin: "0 0 1px", fontFamily: FONT_B }}>{d.title}</p>
                  {d.desc && <p style={{ color: MUTED, fontSize: 13.5, margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.desc}</p>}
                  {d.meta && <p style={{ color: MUTED, fontSize: 12.5, margin: "3px 0 0", opacity: 0.8 }}>{d.type ? `${d.type} · ` : ""}{d.meta}</p>}
                </div>
                {d.url && <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, color: G, fontSize: 12, fontWeight: 700 }}>{docActionLabel(d.type)} <span aria-hidden>↓</span></span>}
              </>
              const st: any = { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 13px", textDecoration: "none" }
              return d.url
                ? <LienPublic key={i} href={d.url} target="_blank" rel="noopener noreferrer" onClick={() => trackLinkClick(pageId, block.id, d.url)} style={st}>{inner}</LienPublic>
                : <div key={i} style={st}>{inner}</div>
            })}
          </div>
        </div>
      )
    }
    case "embed_block": return c.url ? (
      <div style={{ padding: "10px 24px 14px" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 11, margin: "0 0 9px", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: FONT_B }}>{c.title}</p>}
        {/* Hôte contrôlé : une adresse arbitraire ici s'exécutait sur notre origine. */}
        {embedHref(c.url)
          ? <iframe src={embedHref(c.url)} width="100%" height={entierDuContenu(c.height, 400, 80, 2000)} style={{ border: "none", borderRadius: 13, display: "block" }} loading="lazy" sandbox="allow-scripts allow-forms allow-popups allow-same-origin" referrerPolicy="no-referrer" />
          : null}
      </div>
    ) : null
    case "qr_code_block": return null

    default: return null
  }
}
