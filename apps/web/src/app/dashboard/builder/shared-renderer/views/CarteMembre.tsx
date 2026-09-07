"use client"
// Carte d'une personne : photo (ou initiale), nom, role, texte, moyens de la
// joindre. Partagee par `team` et `multi_contact`, qui dessinaient jusqu'ici la
// meme carte de quatre façons differentes.
//
// L'avatar sans photo n'etait pas le meme des deux cotes : un « 👤 » gris dans
// l'apercu, l'initiale du nom sur un degrade en ligne. C'est l'initiale qui
// gagne — elle distingue les membres les uns des autres.
import { sharedImageModel } from "../models/sharedImage"
import { initiale, type Jointure } from "../models/equipeEtContacts"
import { PublicSharedImage } from "../primitives/PublicImage"
import { EditorSharedImage } from "../primitives/EditorImage"
import { SmartCta } from "../primitives/LayoutSurface"
import { sz, type UnifiedCtx } from "../renderTypes"

export function Avatar({ u, photo, nom, taille, accent }: { u: UnifiedCtx; photo: string; nom: string; taille: number; accent: string }) {
  const cote = sz(u, taille)
  const m = sharedImageModel(photo, { alt: nom })
  const base = { width: cote, height: cote, borderRadius: "50%", objectFit: "cover" as const, flexShrink: 0, border: `2px solid ${u.G}40` }
  if (m.src) {
    return u.mode === "public"
      ? <PublicSharedImage model={m} width={taille * 2} height={taille * 2} sizes={`${taille}px`} style={base} />
      : <EditorSharedImage model={m} width={taille * 2} height={taille * 2} sizes={`${taille}px`} style={base} />
  }
  return (
    <div aria-hidden style={{ ...base, border: "none", background: `linear-gradient(135deg,${u.G},${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(cote * 0.42), fontWeight: 700, color: "#080808" }}>
      {initiale(nom)}
    </div>
  )
}

export function BoutonsJointure({ u, jointures, centre }: { u: UnifiedCtx; jointures: Jointure[]; centre?: boolean }) {
  if (jointures.length === 0) return null
  const cote = sz(u, 30)
  return (
    <div style={{ display: "flex", gap: sz(u, 7), marginTop: sz(u, 8), justifyContent: centre ? "center" : "flex-start" }}>
      {jointures.map((j, k) => (
        <SmartCta key={k} u={u} href={j.lien.href || "#"} external={j.lien.external} trackTarget={j.lien.trackTarget}
          label={<span aria-label={j.libelle} style={{ fontSize: sz(u, 14) }}>{j.icone}</span>}
          style={{ width: cote, height: cote, minHeight: cote, borderRadius: sz(u, 8), background: `${u.G}12`, border: `1px solid ${u.G}25`, display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }} />
      ))}
    </div>
  )
}

/** Le fond des cartes : jeton adaptatif, pas un blanc en dur. */
export function styleCarte(u: UnifiedCtx, rayon = 13, pad = "13px 15px") {
  const [y, x] = pad.split(" ").map(v => sz(u, parseInt(v)))
  return { background: u.FILL, border: `1px solid ${u.LINE}`, borderRadius: sz(u, rayon), padding: `${y}px ${x}px` } as const
}
