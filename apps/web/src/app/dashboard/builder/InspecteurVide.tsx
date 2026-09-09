// Inspecteur sans bloc sélectionné (revue du 9 septembre, P0) : jamais vide sans
// consigne. La phrase dit l'action attendue, le bouton la fait.
//   - page vide      → « Votre page est vide » + Choisir un bloc (ouvre la bibliothèque)
//   - blocs présents → « Aucun bloc sélectionné » + Modifier le premier bloc (ou Voir la page sur mobile)
import { Settings } from "lucide-react"

export function InspecteurVide({ vide, isMobile, onChoisirBloc, onVoirPage, onPremierBloc }: {
  vide: boolean; isMobile: boolean; onChoisirBloc: () => void; onVoirPage: () => void; onPremierBloc: () => void
}) {
  return (
    <div style={{ textAlign: "center", padding: "40px 14px" }} data-inspecteur-vide={vide ? "page-vide" : "aucune-selection"}>
      <Settings size={28} color="var(--muted)" style={{ margin: "0 auto 8px", opacity: 0.2, display: "block" }} />
      {vide ? (
        <>
          <p style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Votre page est vide</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{isMobile ? "Ajoutez un premier bloc depuis l'onglet Blocs." : "Ajoutez un premier bloc depuis la bibliothèque, à gauche."}</p>
          <button type="button" onClick={onChoisirBloc} className="da-btn-primary da-btn-primary--sm" style={{ marginTop: 14 }}>Choisir un bloc</button>
        </>
      ) : (
        <>
          <p style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Aucun bloc sélectionné</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{isMobile ? "Touchez un bloc de la page pour le modifier." : "Cliquez sur un bloc de la page pour le modifier."}</p>
          {isMobile
            ? <button type="button" onClick={onVoirPage} className="da-btn-neutral da-btn-neutral--sm" style={{ marginTop: 14 }}>Voir la page</button>
            : <button type="button" onClick={onPremierBloc} className="da-btn-neutral da-btn-neutral--sm" style={{ marginTop: 14 }}>Modifier le premier bloc</button>}
        </>
      )}
    </div>
  )
}
