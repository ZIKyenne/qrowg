"use client"
// ChampDestination — Site · Appel · WhatsApp · E-mail, puis la saisie au bon clavier.
// La logique (lire / écrire le lien) est dans destinationDuBouton.ts, testée seule.

import { useEffect, useRef, useState, type ComponentType } from "react"
import { ecrireDestination, lireDestination, saisieApresChangement, SORTES_DE_DESTINATION, type SorteDeDestination } from "./destinationDuBouton"

type Segmente = ComponentType<{ value: string; options: string[]; onChange: (v: string) => void; ariaLabel?: string }>

// Le segmenteur de l'inspecteur est passé par l'appelant (builderPanels) : l'importer
// d'ici ferait un cycle entre les deux fichiers.
export function ChampDestination({ valeur, onChange, nom, blocId, Segmented }: {
  Segmented: Segmente
  valeur: string
  onChange: (lien: string) => void
  nom: string
  /** Change de bloc = on relit le lien enregistré. */
  blocId: string
}) {
  const [etat, setEtat] = useState(() => lireDestination(valeur))
  // La saisie vit ici pendant la frappe : relire le lien à chaque touche
  // effacerait les espaces d'un numéro qu'on est en train d'écrire.
  const dernier = useRef(valeur)
  useEffect(() => {
    if (valeur !== dernier.current) { setEtat(lireDestination(valeur)); dernier.current = valeur }
  }, [valeur, blocId])

  const sorte = SORTES_DE_DESTINATION.find(s => s.id === etat.sorte)!
  const ecrire = (s: SorteDeDestination, saisie: string) => {
    setEtat({ sorte: s, saisie })
    const lien = ecrireDestination(s, saisie)
    dernier.current = lien
    onChange(lien)
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <Segmented ariaLabel={`${nom} : type de destination`} value={sorte.libelle}
        options={SORTES_DE_DESTINATION.map(s => s.libelle)}
        onChange={l => {
          const vers = SORTES_DE_DESTINATION.find(s => s.libelle === l)!.id
          if (vers !== etat.sorte) ecrire(vers, saisieApresChangement(etat.sorte, vers, etat.saisie))
        }} />
      <input aria-label={`${nom} — ${sorte.libelle}`}
        type={sorte.inputMode === "url" ? "url" : sorte.inputMode === "tel" ? "tel" : "email"}
        inputMode={sorte.inputMode} autoCapitalize="off" autoCorrect="off" spellCheck={false}
        value={etat.saisie} placeholder={sorte.placeholder}
        onChange={e => ecrire(etat.sorte, e.target.value)}
        className="ui-input" />
    </div>
  )
}
