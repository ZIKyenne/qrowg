"use client"

// Exemples — refonte du 10 septembre.
//
// Cette page montrait six entreprises inventées (« Brasserie Le Moulin »,
// « Thomas Dupont · Dev ») avec des aperçus dessinés qui ne s'ouvraient sur rien :
// un visiteur venu voir à quoi ressemble une page QRowg repartait sans en avoir
// vu une seule, et le site affichait des clients qui n'existent pas.
//
// Désormais elle liste les MODÈLES RÉELS du produit (page-templates.ts, la même
// source que la galerie et l'éditeur), et chacun s'ouvre sur une vraie page rendue
// par le moteur public — /examples/<clé>.

import { useMemo, useState } from "react"
import Link from "next/link"
import QrowgLogo from "@/components/QrowgLogo"
import { PAGE_TEMPLATES } from "../dashboard/builder/page-templates"
import { creerUrl, creerUrlSecteur, SECTEUR_PAR_MODELE } from "../creer/entry"

const G = "#C9A84C"
const INK = "#F5F0E8"
const MUT = "rgba(138,132,120,0.9)"
const BG = "#080808"

const GROUPES = ["Tous", ...Array.from(new Set(PAGE_TEMPLATES.map(t => t.group)))]

/** Vignette du modèle : ses vraies couleurs de thème, rien d'inventé. */
function Vignette({ theme }: { theme: { bg: string; surface: string; primary: string; text: string } }) {
  return (
    <div aria-hidden="true" style={{
      height: 92, borderRadius: 10, overflow: "hidden", background: theme.bg,
      border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column",
    }}>
      <div style={{ height: 30, background: theme.surface, display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
        <span style={{ width: 14, height: 14, borderRadius: "50%", background: theme.primary, flexShrink: 0 }} />
        <span style={{ height: 5, width: "42%", borderRadius: 3, background: theme.text, opacity: 0.5 }} />
      </div>
      <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5, justifyContent: "center" }}>
        <span style={{ height: 5, width: "72%", borderRadius: 3, background: theme.text, opacity: 0.22 }} />
        <span style={{ height: 5, width: "54%", borderRadius: 3, background: theme.text, opacity: 0.14 }} />
        <span style={{ height: 13, width: "48%", borderRadius: 4, background: theme.primary, opacity: 0.85, marginTop: 3 }} />
      </div>
    </div>
  )
}

export default function ExamplesPage() {
  const [groupe, setGroupe] = useState("Tous")
  const liste = useMemo(
    () => groupe === "Tous" ? PAGE_TEMPLATES : PAGE_TEMPLATES.filter(t => t.group === groupe),
    [groupe],
  )

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        * { box-sizing:border-box; }
        body { background:${BG}; }
        .filter-btn { display:inline-flex; align-items:center; min-height:44px; padding:0 16px; border-radius:10px;
          font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap;
          background:transparent; border:1px solid var(--line); color:var(--muted); transition:border-color .2s, color .2s, background .2s; }
        .filter-btn:hover { border-color:var(--line-strong); color:var(--ink); }
        .filter-btn[aria-pressed="true"] { background:var(--surface-2); border-color:var(--line-strong); color:var(--ink); box-shadow:inset 0 -2px 0 var(--accent); }
        .filter-btn:focus-visible { outline:2px solid rgba(201,168,76,0.6); outline-offset:3px; }
        .ex-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; max-width:1100px; margin:0 auto; }
        @media(max-width:900px){ .ex-grid { grid-template-columns:repeat(2,1fr); } }
        @media(max-width:600px){ .ex-grid { grid-template-columns:1fr; } .ex-hero { padding:110px 22px 44px !important; } .ex-sec { padding:0 22px 56px !important; } }
        .ex-card { display:flex; flex-direction:column; gap:12px; padding:14px; border-radius:14px;
          background:var(--surface); border:1px solid var(--line); transition:border-color .2s, background .2s; }
        .ex-card:hover { border-color:var(--line-strong); background:var(--surface-2); }
        .ex-voir { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:36px; flex:1;
          border-radius:9px; background:var(--surface-2); border:1px solid var(--line-strong); color:var(--ink);
          font-size:12.5px; font-weight:600; text-decoration:none; }
        .ex-voir:hover { border-color:color-mix(in srgb, var(--accent) 50%, transparent); color:var(--accent); }
        .ex-utiliser { display:inline-flex; align-items:center; justify-content:center; min-height:36px; padding:0 14px;
          border-radius:9px; background:var(--accent); color:var(--ink-on-accent); font-size:12.5px; font-weight:700; text-decoration:none; }
        .ex-utiliser:hover { opacity:.92; }
      `}</style>

      {/* En-tête public */}
      <nav className="nav-page qf-entete" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        background: "rgba(8,8,8,0.93)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px",
      }}>
        <Link href="/" aria-label="QRowg — accueil" style={{ textDecoration: "none", display: "inline-flex" }}>
          <QrowgLogo size={20} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/auth/login" style={{ color: MUT, textDecoration: "none", fontSize: 13 }}>Connexion</Link>
          <Link href={creerUrl()} style={{
            background: "var(--accent)", color: "var(--ink-on-accent)", textDecoration: "none",
            fontSize: 13, fontWeight: 700, padding: "8px 20px", borderRadius: 9,
          }}>Composer ma page</Link>
        </div>
      </nav>

      {/* Titre */}
      <section className="ex-hero" style={{ padding: "126px 48px 44px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ color: G, fontSize: 11.5, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", margin: "0 0 14px" }}>
            Exemples
          </p>
          <h1 style={{
            fontFamily: "Fraunces,serif", fontSize: "clamp(30px,3.8vw,52px)", color: INK,
            fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 18px",
          }}>
            Ouvrez une page,<br /><span style={{ color: G }}>puis reprenez-la.</span>
          </h1>
          <p style={{ color: MUT, fontSize: 16.5, lineHeight: 1.7, margin: "0 auto", maxWidth: 560 }}>
            Chaque exemple ci-dessous est un modèle du produit, affiché tel qu'un visiteur le verrait après avoir scanné votre QR code. Ouvrez-le, faites défiler, puis partez de lui.
          </p>
          <p style={{ color: "var(--faint)", fontSize: 12.5, margin: "14px 0 0" }}>
            {PAGE_TEMPLATES.length} modèles · contenus de démonstration, à remplacer par les vôtres
          </p>
        </div>
      </section>

      {/* Filtres */}
      <section className="ex-sec" style={{ padding: "0 48px 20px" }}>
        <div role="group" aria-label="Filtrer par métier" style={{
          display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 1100, margin: "0 auto",
        }}>
          {GROUPES.map(g => (
            <button key={g} type="button" className="filter-btn" aria-pressed={groupe === g} onClick={() => setGroupe(g)}>
              {g}
              {g !== "Tous" && <span style={{ marginLeft: 6, opacity: 0.6, fontVariantNumeric: "tabular-nums" }}>{PAGE_TEMPLATES.filter(t => t.group === g).length}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Grille */}
      <section className="ex-sec" style={{ padding: "0 48px 72px" }}>
        <div className="ex-grid">
          {liste.map(t => (
            <article key={t.key} className="ex-card" aria-labelledby={`ex-${t.key}`}>
              <Vignette theme={t.theme as any} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden="true" style={{ fontSize: 18 }}>{t.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <h2 id={`ex-${t.key}`} style={{ color: INK, fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>{t.label}</h2>
                  <p style={{ color: "var(--faint)", fontSize: 11.5, margin: "2px 0 0" }}>{t.group} · {t.blocks.length} blocs</p>
                </div>
              </div>
              <p style={{ color: MUT, fontSize: 13, lineHeight: 1.55, margin: 0, flex: 1 }}>{t.desc}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/examples/${t.key}`} className="ex-voir">Voir la page</Link>
                <Link href={creerUrlSecteur(SECTEUR_PAR_MODELE[t.key])} className="ex-utiliser">Utiliser</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Fin */}
      <section style={{ padding: "0 48px 88px", textAlign: "center" }}>
        <div style={{
          maxWidth: 620, margin: "0 auto", background: "var(--surface)",
          border: "1px solid var(--line-strong)", borderRadius: 18, padding: "36px 32px",
        }}>
          <h2 style={{ fontFamily: "Fraunces,serif", fontSize: "clamp(22px,2.6vw,32px)", color: INK, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.2 }}>
            La vôtre ressemblera à ça, avec vos mots.
          </h2>
          <p style={{ color: MUT, fontSize: 14.5, lineHeight: 1.7, margin: "0 0 24px" }}>
            Partez d'un modèle, remplacez les textes et les photos, publiez. Le QR code se génère avec la page.
          </p>
          <Link href={creerUrl()} style={{
            display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 26px",
            borderRadius: 11, background: "var(--accent)", color: "var(--ink-on-accent)",
            fontSize: 14.5, fontWeight: 700, textDecoration: "none",
          }}>
            Composer ma page — sans compte <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
