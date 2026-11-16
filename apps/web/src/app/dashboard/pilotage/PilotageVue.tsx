// La vue du pilotage — sans état, rendue côté serveur.
import { PageHeader } from "@/components/ui/PageHeader"
import { PLANS } from "@/lib/plans"
import type { Pilotage } from "@/lib/pilotage"

const MUTED = "var(--muted)"
const cellule = { padding: "10px 12px", borderBottom: "1px solid var(--line)", fontSize: 14, textAlign: "left" as const }

export default function PilotageVue({ pilotage, erreur }: { pilotage: Pilotage | null; erreur?: string }) {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 48px" }}>
      <PageHeader kicker="Interne" title="Pilotage"
        sub="L'entonnoir mesuré depuis la base : des succès enregistrés, pas des clics." />
      {erreur || !pilotage ? (
        <p role="alert" style={{ color: "var(--danger)", fontSize: 14 }}>{erreur}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="qd-carte" aria-labelledby="t-activation" style={{ overflowX: "auto" }}>
            <h2 id="t-activation" style={{ fontSize: 16, margin: "16px 16px 4px", color: "var(--ink)" }}>Activation · comptes créés sur {pilotage.fenetreJours} jours</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead><tr style={{ color: MUTED }}>
                <th scope="col" style={cellule}>Étape</th><th scope="col" style={cellule}>Comptes</th>
                <th scope="col" style={cellule}>Passage (payant : sur comptes créés)</th><th scope="col" style={cellule}>Délai médian</th>
              </tr></thead>
              <tbody>
                {pilotage.etapes.map(e => (
                  <tr key={e.cle}>
                    <th scope="row" style={{ ...cellule, fontWeight: 600, color: "var(--ink)" }}>{e.libelle}</th>
                    <td style={{ ...cellule, fontVariantNumeric: "tabular-nums" }}>{e.nombre}</td>
                    <td style={{ ...cellule, color: MUTED }}>{e.surPrecedente === null ? "—" : e.taux === null ? e.surPrecedente : `${e.taux} % (${e.surPrecedente})`}</td>
                    <td style={{ ...cellule, color: MUTED }}>{e.delaiMedianJours === null ? "—" : `${String(e.delaiMedianJours).replace(".", ",")} j après inscription`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ color: MUTED, fontSize: 13, margin: "10px 16px 16px" }}>Sous 10 comptes à l&apos;étape précédente, le passage s&apos;écrit « n sur m » : un pourcentage n&apos;y voudrait rien dire.</p>
          </section>

          <section className="qd-carte" aria-labelledby="t-retention" style={{ padding: 16 }}>
            <h2 id="t-retention" style={{ fontSize: 16, margin: "0 0 6px", color: "var(--ink)" }}>Rétention</h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>
              {pilotage.retention.actifsSur30j} sur {pilotage.retention.comptesDePlusDe30j} comptes de plus de 30 jours ont reçu au moins un scan dans les 30 derniers jours
              {pilotage.retention.taux !== null && ` (${pilotage.retention.taux} %)`}.
            </p>
          </section>

          <section className="qd-carte" aria-labelledby="t-revenu" style={{ padding: 16 }}>
            <h2 id="t-revenu" style={{ fontSize: 16, margin: "0 0 6px", color: "var(--ink)" }}>Revenu</h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "var(--ink)", lineHeight: 1.8 }}>
              <li>{pilotage.revenu.payants} abonnement{pilotage.revenu.payants > 1 ? "s" : ""} en cours
                {Object.keys(pilotage.revenu.parPlan).length > 0 && ` — ${Object.entries(pilotage.revenu.parPlan).map(([p, n]) => `${(PLANS as any)[p]?.label ?? p} ${n}`).join(", ")}`}</li>
              <li>{pilotage.revenu.resiliationsProgrammees} résiliation{pilotage.revenu.resiliationsProgrammees > 1 ? "s" : ""} programmée{pilotage.revenu.resiliationsProgrammees > 1 ? "s" : ""}</li>
              <li>{pilotage.revenu.impayes} paiement{pilotage.revenu.impayes > 1 ? "s" : ""} refusé{pilotage.revenu.impayes > 1 ? "s" : ""}</li>
            </ul>
          </section>

          <section className="qd-carte" aria-labelledby="t-non" style={{ padding: 16 }}>
            <h2 id="t-non" style={{ fontSize: 16, margin: "0 0 6px", color: "var(--ink)" }}>Non mesuré ici</h2>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
              {pilotage.nonMesure.map(n => <li key={n}>{n}</li>)}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
