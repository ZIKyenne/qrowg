"use client"

// DefinitionsPanel — ce que chaque chiffre de cet écran veut dire (Q30).
//
// L'audit du 29 septembre : « Documenter la différence entre lecture optique,
// requête de redirection, visite de page, session estimée et clic de lien. Un
// serveur observe une requête ; il ne voit pas chaque ouverture de caméra. »
//
// Rien de tout cela n'était écrit nulle part. Un commerçant lisait « 40 scans »
// sans savoir si c'était quarante personnes, quarante ouvertures de caméra ou
// quarante requêtes — et la réponse n'est aucune des trois exactement.
//
// Ce panneau ne calcule rien : il affiche les définitions de
// `lib/ceQueMesureLeProduit`, la même source que la vitrine. Les chiffres et les
// mots qui les expliquent ne peuvent donc pas diverger.

import { COMPTEURS_ORDONNES, DIMENSIONS_MESUREES, NON_MESURE, limiteMesure } from "@/lib/ceQueMesureLeProduit"

const MUTED = "var(--muted)"

export default function DefinitionsPanel() {
  return (
    // Replié par défaut (20 nov.) : ~1 000 px de texte toujours ouvert sous les
    // chiffres, sur téléphone. Il reste là où on lit les chiffres, à un toucher.
    <details
      aria-labelledby="definitions-titre"
      className="definitions-volet"
      style={{
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16,
        padding: "16px 20px",
      }}
    >
      <summary className="cible-doigt" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, listStyle: "none" }}>
        <h2 id="definitions-titre" style={{ color: "var(--ink)", fontSize: 15, fontWeight: 700, margin: 0, flex: 1 }}>
          Ce que ces chiffres veulent dire
        </h2>
        <span aria-hidden="true" className="definitions-chevron" style={{ color: MUTED, fontSize: 18, lineHeight: 1 }}>›</span>
      </summary>
      <p style={{ color: MUTED, fontSize: 12.5, margin: "10px 0 18px", lineHeight: 1.5 }}>
        {limiteMesure()}
      </p>

      <dl style={{ margin: 0, display: "grid", gap: 14 }}>
        {COMPTEURS_ORDONNES.map(c => (
          <div key={c.nom}>
            <dt style={{ color: "var(--ink)", fontSize: 13, fontWeight: 700, margin: 0 }}>{c.nom}</dt>
            <dd style={{ color: MUTED, fontSize: 12.5, margin: "3px 0 0", lineHeight: 1.55 }}>
              {c.definition}{" "}
              <span style={{ color: "var(--faint)" }}>{c.limite}</span>
            </dd>
          </div>
        ))}
      </dl>

      <h3 style={{ color: "var(--ink)", fontSize: 13, fontWeight: 700, margin: "22px 0 6px" }}>
        Ce qui est enregistré
      </h3>
      <ul style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
        {DIMENSIONS_MESUREES.map(d => (
          <li key={d.cle}>
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{d.nom}</strong> — {d.desc}
            {d.quand === "scan seulement" && (
              <span style={{ color: "var(--faint)" }}> (au scan du QR uniquement)</span>
            )}
          </li>
        ))}
      </ul>

      <h3 style={{ color: "var(--ink)", fontSize: 13, fontWeight: 700, margin: "18px 0 6px" }}>
        Ce qui ne l’est pas
      </h3>
      <ul style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.6, margin: 0, paddingLeft: 18 }}>
        {NON_MESURE.map(n => <li key={n}>{n}</li>)}
      </ul>
    </details>
  )
}
