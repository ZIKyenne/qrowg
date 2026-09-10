"use client"

// Rendu d'un modèle avec le moteur public, sous un bandeau qui dit ce que c'est.
// Le bandeau est en haut du document (avant la page) : personne ne peut prendre
// cette démonstration pour la page d'un établissement réel.

import Link from "next/link"
import PublicPageClient from "../../[slug]/PublicPageClient"
import { PAGE_TEMPLATES } from "../../dashboard/builder/page-templates"
import { normalizePageTheme } from "../../dashboard/builder/types"
import { creerUrlSecteur, SECTEUR_PAR_MODELE } from "../../creer/entry"

export function DemoModele({ modeleKey }: { modeleKey: string }) {
  const tpl = PAGE_TEMPLATES.find(t => t.key === modeleKey)
  if (!tpl) return null

  const page = {
    id: `demo-${tpl.key}`,
    title: tpl.label,
    slug: `demo-${tpl.key}`,
    theme: normalizePageTheme(tpl.theme),
    profiles: { plan: "business", email: "demo@qrowg.com" },
  }
  const blocks = tpl.blocks.map((b, i) => ({
    id: `demo-${tpl.key}-${i}`, type: b.type, content: b.content as any, visible: true,
  }))

  return (
    <div data-demo={tpl.key}>
      <style>{`
        .demo-bandeau { position:sticky; top:0; z-index:9999; display:flex; align-items:center; gap:12px;
          flex-wrap:wrap; padding:10px 20px; background:#0B0B0B; border-bottom:1px solid var(--line-strong);
          font-family:"DM Sans", system-ui, sans-serif; }
        .demo-bandeau a { display:inline-flex; align-items:center; min-height:32px; text-decoration:none; }
        .demo-retour { color:var(--muted); font-size:13px; }
        .demo-retour:hover { color:var(--ink); }
        .demo-utiliser { padding:0 16px; border-radius:9px; background:var(--accent);
          color:var(--ink-on-accent); font-size:13px; font-weight:700; }
        .demo-utiliser:hover { opacity:.92; }
        /* Sur téléphone c'est le nom du modèle qui s'efface, jamais la mention :
           elle est ce qui empêche de prendre la démonstration pour un vrai établissement. */
        @media(max-width:600px){ .demo-bandeau { padding:8px 14px; gap:8px; } .demo-nom { display:none; } .demo-mention::after { content:" (démo)"; } }
      `}</style>

      <div className="demo-bandeau" role="region" aria-label="Page de démonstration">
        <Link href="/examples" className="demo-retour">← Tous les exemples</Link>
        <span className="demo-nom" style={{ color: "var(--ink)", fontSize: 13, fontWeight: 600 }}>
          <span aria-hidden="true" style={{ marginRight: 6 }}>{tpl.emoji}</span>{tpl.label}
        </span>
        <span className="demo-mention" style={{ color: "var(--muted)", fontSize: 12.5 }}>
          Page de démonstration — les textes et les photos sont des exemples
        </span>
        <Link href={creerUrlSecteur(SECTEUR_PAR_MODELE[tpl.key])} className="demo-utiliser" style={{ marginLeft: "auto" }}>
          Utiliser ce modèle
        </Link>
      </div>

      <PublicPageClient page={page as any} blocks={blocks as any} showBranding introEligible={false} />
    </div>
  )
}
