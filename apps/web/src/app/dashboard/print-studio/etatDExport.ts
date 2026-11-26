// L'état d'export annoncé par la pastille de la barre de l'atelier (Prêt / À
// vérifier / À corriger). Sorti de PrintStudioClient en v393, où il ne
// regardait que les contrôles de MISE EN PAGE : sans QR, il n'y a rien à
// signaler sur la mise en page, et la pastille disait « Prêt à imprimer » —
// au-dessus d'une fenêtre qui, elle, disait « Il manque votre QR » et refusait
// tout export.

export type EtatDExport = "a-corriger" | "sans-qr" | "a-verifier" | "pret"

export function etatDExport(controles: readonly { status: string }[], qrPret: boolean): { etat: EtatDExport; libelle: string } {
  const aCorriger = controles.filter(c => c.status === "fail").length
  const aVerifier = controles.filter(c => c.status === "warn").length
  // Un point bloquant reste le plus urgent ; puis le QR manquant, qui bloque l'export.
  if (aCorriger) return { etat: "a-corriger", libelle: `${aCorriger} à corriger` }
  if (!qrPret) return { etat: "sans-qr", libelle: "Il manque votre QR" }
  if (aVerifier) return { etat: "a-verifier", libelle: `À vérifier · ${aVerifier}` }
  return { etat: "pret", libelle: "Prêt à imprimer" }
}
