"use client"

// Outillage interne : juger une liste d'établissements avant d'en faire quoi
// que ce soit.
//
// ── Pourquoi cet écran existe ─────────────────────────────────────────────
//
// Le moteur de croissance avait quatre lots de code et aucune porte : la seule
// façon d'y toucher était un banc de développement. Un moteur qu'on ne peut pas
// regarder tourner n'est pas un outil, c'est une promesse.
//
// ── Ce que l'écran ne fait pas ────────────────────────────────────────────
//
// Il n'enregistre rien. On colle, on lit le verdict, on ferme — et la liste
// n'existe plus nulle part. C'est écrit à l'écran, parce que « où sont passées
// les données que j'ai collées » est une question légitime et qu'il vaut mieux
// y répondre avant qu'elle soit posée.

import { useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { LectureRatee } from "@/components/ui/LectureRatee"
import { Textarea } from "@/components/ui/Input"
import { lireDe } from "@/lib/lectureQuiSeSait"

type Retenu = { numero: number; nom?: string; commune?: string; activite: string | null; siren?: string }
type Ecarte = { numero: number; nom?: string; refus: string[] }
type Doublon = { numero: number; nom?: string; siren?: string }
type Bilan = {
  raison: "vide" | "sans en-tête" | "colonnes inconnues" | null
  colonnes: Record<string, number>
  tronque: boolean
  lues: number
  maxLignes: number
  retenus: Retenu[]
  ecartes: Ecarte[]
  parRaison: { raison: string; nombre: number }[]
  doublons: Doublon[]
}

/** Ce que l'écran répond quand la lecture n'a rien donné, et pourquoi. */
const EXPLICATION: Record<string, string> = {
  "vide": "Rien à lire : collez au moins une ligne d'en-tête et une ligne d'établissement.",
  "sans en-tête": "Il manque la ligne d'en-tête. Sans elle, impossible de savoir quelle colonne est le nom, laquelle la commune — et une colonne mal attribuée donnerait un verdict faux sans le dire.",
  "colonnes inconnues": "Aucune colonne de nom reconnue. Nommez-la « Nom », « Enseigne » ou « Raison sociale ».",
}

const EXEMPLE = [
  "Nom\tCode NAF\tÉtat\tCommune\tSIREN",
  "Chez Mariette\t56.10A\tA\tChâlons-en-Champagne\t111111111",
  "Le Comptoir Express\t5610C\tActif\tReims\t222222222",
].join("\n")

export default function CroissanceClient() {
  const [texte, setTexte] = useState("")
  const [bilan, setBilan] = useState<Bilan | null>(null)
  const [erreur, setErreur] = useState("")
  const [occupe, setOccupe] = useState(false)

  const analyser = async () => {
    setOccupe(true)
    setErreur("")
    const { valeur, refus } = await lireDe<Bilan>(
      "/api/growth/import",
      "La liste n'a pas pu être analysée.",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texte }) },
    )
    // Le refus remplit l'état d'erreur, jamais le résultat : un écran qui garde
    // le bilan précédent après un échec montre un verdict qui ne correspond
    // plus à ce qui est dans le champ.
    if (refus) { setErreur(refus); setBilan(null) }
    else setBilan(valeur)
    setOccupe(false)
  }

  return (
    <div style={{ padding: "26px 0 60px" }}>
      <PageHeader
        kicker="Outillage interne"
        title="Croissance"
        sub="Collez une liste d'établissements pour voir qui serait retenu, et pourquoi les autres ne le sont pas."
      />

      <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 18px", maxWidth: 720 }}>
        Rien n&apos;est enregistré : la liste est jugée puis oubliée. Constituer un fichier
        d&apos;établissements demande une base légale qui n&apos;est pas arrêtée, et tant
        qu&apos;elle ne l&apos;est pas, cet écran sert à regarder, pas à stocker.
      </p>

      {/* La primitive, pas un champ dessiné à la main : `.ui-textarea` pose
          16 px, seule taille qui empêche iOS de zoomer la page au focus — et le
          cliquet de `champQuiNeZoomePas` a attrapé la première version, qui
          était en 13,5 px. Elle associe aussi le label au champ (htmlFor/id). */}
      <Textarea
        label="Votre liste"
        hint="Une ligne d'en-tête, puis un établissement par ligne. Tabulation, point-virgule ou virgule — le séparateur est reconnu tout seul."
        value={texte}
        onChange={e => setTexte(e.target.value)}
        placeholder={EXEMPLE}
        rows={8}
        spellCheck={false}
        style={{ minHeight: 160, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0 26px" }}>
        <button
          type="button"
          onClick={() => { void analyser() }}
          disabled={occupe || texte.trim() === ""}
          className="da-btn-primary"
        >
          {occupe ? "Analyse…" : "Analyser la liste"}
        </button>
        <button
          type="button"
          onClick={() => { setTexte(EXEMPLE); setBilan(null); setErreur("") }}
          className="da-btn-neutral da-btn-neutral--sm"
        >
          Remplir un exemple
        </button>
      </div>

      {erreur ? <LectureRatee message={erreur} reessayer={() => { void analyser() }} /> : null}

      {bilan ? <Resultat bilan={bilan} /> : null}
    </div>
  )
}

function Resultat({ bilan }: { bilan: Bilan }) {
  if (bilan.raison) {
    return (
      <div role="status" style={encadre()}>
        <p style={{ margin: 0, color: "var(--fg)", fontSize: 14, lineHeight: 1.6 }}>
          {EXPLICATION[bilan.raison] ?? "Liste illisible."}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div role="status" style={{ ...encadre(), display: "flex", gap: 22, flexWrap: "wrap" }}>
        <Compteur nombre={bilan.retenus.length} libelle="retenus" />
        <Compteur nombre={bilan.ecartes.length} libelle="écartés" />
        {bilan.doublons.length > 0 ? <Compteur nombre={bilan.doublons.length} libelle="doublons de SIREN" /> : null}
      </div>

      {bilan.tronque ? (
        <div role="alert" style={encadre()}>
          <p style={{ margin: 0, color: "var(--fg)", fontSize: 13.5, lineHeight: 1.6 }}>
            Seules les {bilan.maxLignes} premières lignes ont été lues. Le reste
            n&apos;a pas été jugé — traitez la liste par lots.
          </p>
        </div>
      ) : null}

      {bilan.parRaison.length > 0 ? (
        <section style={encadre()}>
          <h2 style={titre()}>Ce qui a écarté le plus d&apos;établissements</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {bilan.parRaison.map(r => (
              <li key={r.raison} style={ligne()}>
                <span>{r.raison}</span>
                <strong style={{ color: "var(--fg)" }}>{r.nombre}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bilan.retenus.length > 0 ? (
        <section style={encadre()}>
          <h2 style={titre()}>Retenus</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {bilan.retenus.map(r => (
              <li key={r.numero} style={ligne()}>
                <span>
                  <strong style={{ color: "var(--fg)" }}>{r.nom}</strong>
                  {r.commune ? ` — ${r.commune}` : ""}
                </span>
                <span>{r.activite}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bilan.ecartes.length > 0 ? (
        <section style={encadre()}>
          <h2 style={titre()}>Écartés</h2>
          {/* Le numéro de ligne est là pour que la correction se fasse dans le
              tableau d'origine : « quatre écartés » sans dire lesquels est
              inexploitable. */}
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
            {bilan.ecartes.map(e => (
              <li key={e.numero} style={ligne()}>
                <span>
                  <span style={{ color: "var(--muted)" }}>ligne {e.numero} — </span>
                  <strong style={{ color: "var(--fg)" }}>{e.nom || "sans nom"}</strong>
                </span>
                <span>{e.refus.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function Compteur({ nombre, libelle }: { nombre: number; libelle: string }) {
  return (
    <div>
      <div style={{ color: "var(--fg)", fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{nombre}</div>
      <div style={{ color: "var(--muted)", fontSize: 13 }}>{libelle}</div>
    </div>
  )
}

const encadre = () => ({
  padding: "18px 20px", border: "1px solid var(--line-strong)",
  borderRadius: 14, background: "var(--surface)",
})
const titre = () => ({
  margin: "0 0 12px", color: "var(--fg)", fontSize: 15, fontWeight: 700,
})
const ligne = () => ({
  display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" as const,
  color: "var(--muted)", fontSize: 13.5, lineHeight: 1.6,
  paddingBottom: 6, borderBottom: "1px solid var(--line)",
})
