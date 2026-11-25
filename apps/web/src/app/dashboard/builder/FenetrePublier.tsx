"use client"
// La fenêtre « Publier » de l'éditeur (sortie de BuilderV4 — vague 4, point 6).
// Rien n'a changé à l'écran : mêmes styles, mêmes libellés, même ordre. Elle
// reçoit l'état de la page et les actions de l'éditeur ; elle ne possède rien.
// La primitive Modal apporte le défilement (le contenu fait ~900 px, il se
// coupait en bas sur 700-768 px de haut), le rôle dialog, Échap et le piège de focus.
import { Modal } from "@/components/ui/Modal"
import { ButtonLink, Button } from "@/components/ui/Button"
import { Check, ExternalLink, Globe, RefreshCw, Send, Smartphone } from "lucide-react"
import QRCanvas from "../qr-codes/QRCanvas"
import { printStudioUrl, type printHandoff } from "../print-studio/handoff"
import { AlertesPublication } from "./AlertesPublication"
import { G, MUTED, IS_UUID } from "./builderConstants"
import { PHRASE_EN_DIRECT, LIBELLE_ENREGISTRER_EN_LIGNE } from "./builderUx"
import type { Block, PageTheme } from "./types"

export type FenetrePublierProps = {
  onClose: () => void
  guest: boolean
  pageStatus: string
  pageSlug: string
  pageName: string
  blocks: Block[]
  theme: PageTheme
  pageStats: { views: number; scans: number }
  liveId: string | undefined
  publishing: boolean
  publishSuccess: boolean
  publishWasUpdate: boolean
  publishError: string
  setPublishError: (m: string) => void
  handlePublish: () => void
  qrTarget: string
  qrShortCode: string
  handoff: ReturnType<typeof printHandoff>
  downloadQrPng: () => void
  /** « Voir » sur une alerte : sélectionne le bloc et ferme la fenêtre. */
  onVoir: (id: string) => void
  onVoirTheme: () => void
  onMasquer: (id: string) => void
}

export function FenetrePublier({
  onClose, guest, pageStatus, pageSlug, pageName, blocks, theme, pageStats, liveId,
  publishing, publishSuccess, publishWasUpdate, publishError, setPublishError, handlePublish,
  qrTarget, qrShortCode, handoff, downloadQrPng, onVoir, onVoirTheme, onMasquer,
}: FenetrePublierProps) {
  return (
    <Modal open onClose={onClose} maxWidth={360}>
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: pageStatus==="published" ? "rgba(57,255,143,0.12)" : "color-mix(in srgb, var(--accent) 12%, transparent)", border: `1px solid ${pageStatus==="published" ? "rgba(57,255,143,0.3)" : "color-mix(in srgb, var(--accent) 30%, transparent)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {pageStatus==="published" ? <Globe size={20} color="var(--success)" /> : <Send size={20} color={G} />}
          </div>
          <div>
            <p style={{ color: "var(--ink)", fontSize: 15, fontWeight: 700, margin: 0 }}>{guest ? "Mettre en ligne" : pageStatus==="published" ? "Page en ligne" : "Publier la page"}</p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{guest ? "Dernière étape : votre compte" : pageStatus==="published" ? PHRASE_EN_DIRECT : "Rendre la page accessible"}</p>
          </div>
        </div>

        {/* Statut */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: pageStatus==="published" ? "rgba(57,255,143,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${pageStatus==="published" ? "rgba(57,255,143,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: pageStatus==="published" ? "var(--success)" : MUTED, boxShadow: pageStatus==="published" ? "0 0 6px var(--success)80" : "none" }} />
          <span style={{ color: pageStatus==="published" ? "var(--success)" : MUTED, fontSize: 12, fontWeight: 600 }}>{guest ? "Brouillon local" : pageStatus==="published" ? "En ligne" : "Brouillon"}</span>
          <span style={{ color: MUTED, fontSize: 11, marginLeft: "auto" }}>{blocks.length} bloc{blocks.length!==1?"s":""}</span>
        </div>

        {/* URL — rien à montrer tant que la page n'a pas d'adresse. */}
        {pageSlug && !guest && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: MUTED, fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1.5 }}>URL de la page</p>
            <div style={{ background: "var(--field)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ color: G, fontSize: 12, margin: 0, fontFamily: "JetBrains Mono, monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {typeof window !== "undefined" ? window.location.origin : ""}/{pageSlug}
              </p>
              <Button onClick={() => { navigator.clipboard.writeText((typeof window !== "undefined" ? window.location.origin : "")+"/"+pageSlug) }} size="sm">Copier</Button>
            </div>
          </div>
        )}

        {/* Stats rapides */}
        <div style={{ display: guest ? "none" : "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ background: "color-mix(in srgb, var(--accent) 6%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <p style={{ color: G, fontSize: 20, fontWeight: 700, margin: 0 }}>{pageStats.views}</p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>👁 Vues</p>
          </div>
          <div style={{ background: "rgba(57,255,143,0.06)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <p style={{ color: "var(--success)", fontSize: 20, fontWeight: 700, margin: 0 }}>{pageStats.scans}</p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0, display: "inline-flex", alignItems: "center", gap: 3 }}><Smartphone size={9} /> Scans</p>
          </div>
        </div>

        {/* Bouton principal — publie (brouillon) ou met à jour la page publique
            (déjà publiée : réenregistre + revalide le cache ISR pour rendre les
            derniers changements visibles immédiatement). */}
        <button onClick={handlePublish} disabled={!guest && (publishing || !IS_UUID(liveId))} aria-busy={publishing}
          className="da-btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: pageSlug ? 10 : 0 }}>
          {guest ? <><Send size={14} /> Créer mon compte et publier</> : publishing ? (
            <span style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
              <span style={{display:"inline-block",width:14,height:14,border:"2px solid #08080880",borderTopColor:"var(--bg)",borderRadius:"50%",animation:"mo-spin 0.7s linear infinite"}} />
              {pageStatus==="published" ? "Enregistrement…" : "Publication…"}
            </span>
          ) : publishSuccess ? (
            <span style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
              <Check size={15} /> {publishWasUpdate ? "Page à jour !" : "Page publiée !"}
            </span>
          ) : pageStatus==="published" ? <><RefreshCw size={14} /> {LIBELLE_ENREGISTRER_EN_LIGNE}</> : <><Send size={14} /> Publier maintenant</>}
        </button>

        {/* Invité : dire exactement ce qui va se passer, sans surprise. */}
        {guest && (
          <p style={{ color: MUTED, fontSize: 11, lineHeight: 1.45, margin: "0 0 10px" }}>
            Votre page est gardée dans ce navigateur. Le compte sert à lui donner une
            adresse et un QR code — vous la retrouverez telle quelle, rien à resaisir.
          </p>
        )}

        {/* Erreur publication */}
        {publishError && (
          <div role="alert" style={{marginBottom:10,padding:"9px 12px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:9,color:"#F87171",fontSize:12,display:"flex",alignItems:"center",gap:6}}>
            <span>⚠</span>
            <span>{publishError}</span>
            <button onClick={()=>setPublishError("")} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#F87171",fontSize:14,lineHeight:1}}>×</button>
          </div>
        )}
        <AlertesPublication blocks={blocks} theme={theme} slug={pageSlug} titre={pageName} onVoir={onVoir} onVoirTheme={onVoirTheme} onMasquer={onMasquer} />
        {/* Voir la page */}
        {pageSlug && pageStatus === "published" && (
          <ButtonLink href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm"><ExternalLink size={13} /> Voir la page</ButtonLink>
        )}
        {/* QR de la page publiée, affiché ICI pour être atteignable aussi sur
            mobile (le panneau QR de la barre du haut est masqué sous 1024 px)
            et parce que c'est le moment où il sert : la page vient d'être mise
            en ligne, l'étape suivante est de l'imprimer. */}
        {/* Invité : voir à quoi ça ressemble avant de s'engager. Le QR n'encode
            pas encore d'adresse réelle — on le dit, et on n'offre pas de le
            télécharger : un QR imprimé qui ne mène nulle part serait pire que rien. */}
        {guest && (
          <div style={{ marginTop: 10, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ color: MUTED, fontSize: 11, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Votre QR code</p>
            <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 10, padding: 8, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ filter: "blur(2.5px)", opacity: 0.55 }} aria-hidden><QRCanvas value="https://qrowg.com" size={132} /></div>
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-on-accent)", fontSize: 11, fontWeight: 700, textAlign: "center", padding: 10 }}>Aperçu</span>
            </div>
            <p style={{ color: MUTED, fontSize: 11, lineHeight: 1.45, margin: 0, textAlign: "center" }}>
              Il sera généré, et téléchargeable, dès que la page aura une adresse.
            </p>
          </div>
        )}

        {pageStatus === "published" && qrTarget && (
          <div style={{ marginTop: 10, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ color: MUTED, fontSize: 11, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>Votre QR code</p>
            <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 8, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QRCanvas value={qrTarget} size={132} />
            </div>
            <Button onClick={downloadQrPng} size="sm" fullWidth>↓ Télécharger le QR (PNG)</Button>

            {/* Un QR en PNG ne sert à rien tant qu'il n'est pas posé quelque part.
                On propose donc les 3 supports les plus évidents pour ce métier, avec
                le studio déjà pré-rempli (métier, usage, nom, message, appel à l'action). */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ color: MUTED, fontSize: 11, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>L'imprimer sur un support</p>
              <p style={{ color: "rgba(245,240,232,0.45)", fontSize: 11.5, margin: "0 0 9px", textAlign: "center", lineHeight: 1.35 }}>
                {handoff.metier !== "Tout" ? `Conseillé pour « ${handoff.metier} »` : "Prêt à imprimer, textes déjà remplis"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {handoff.suggested.map(sg => (
                  <a key={sg.id} href={printStudioUrl(qrShortCode, handoff, sg.id)}
                    style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 10px", textDecoration: "none" }}>
                    <span aria-hidden style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 7, background: "color-mix(in srgb, var(--accent) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: G, fontSize: 12 }}>🖨</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", color: "var(--ink)", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sg.label}</span>
                      <span style={{ display: "block", color: MUTED, fontSize: 11, lineHeight: 1.3 }}>{sg.why}</span>
                    </span>
                    <span aria-hidden style={{ marginLeft: "auto", color: MUTED, fontSize: 13 }}>›</span>
                  </a>
                ))}
              </div>
              <a href={printStudioUrl(qrShortCode, handoff)}
                style={{ display: "block", marginTop: 7, textAlign: "center", color: MUTED, fontSize: 11, textDecoration: "none", padding: "6px" }}>
                Voir tous les supports →
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
