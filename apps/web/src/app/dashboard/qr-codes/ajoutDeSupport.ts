// Ajouter un support à une page : l'appel réseau, hors du composant.
//
// QRStudio.tsx est un fichier déjà découpé une fois, tenu sous 3 000 lignes par
// `testsDeterministes`. Le lot v83 y ajoutait une action : elle vit ici, et
// l'écran ne garde que ce qui le regarde — l'état du bouton et le message.
import { messageDeRoute } from "@/lib/messageDeRoute"

import { phraseSupportEnBrouillon } from "@/lib/qrEnBrouillon"

export type ResultatSupport =
  | { ok: true; qr: any; brouillon: boolean }
  | { ok: false; phrase: string }

/** Un QR de plus vers LA MÊME page. Ne lève jamais. */
export async function ajouterUnSupport(pageId: string): Promise<ResultatSupport> {
  try {
    const res = await fetch("/api/qr-support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: pageId }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok || d?.error || !d?.qr) {
      // Déjà traduite ici : le champ s'appelle `phrase`, jamais `message` — un
      // `r.message` ressemblerait à la chaîne brute d'une réponse (garde v71).
      return { ok: false, phrase: messageDeRoute(res.status, d, "Ce support n'a pas pu être ajouté.") }
    }
    return { ok: true, qr: d.qr, brouillon: !!d.brouillon }
  } catch {
    return { ok: false, phrase: "Ajout impossible : erreur réseau" }
  }
}

/** Ce qu'on dit une fois le support posé. */
export function messageDeSupport(r: Extract<ResultatSupport, { ok: true }>): string {
  return r.brouillon
    ? phraseSupportEnBrouillon()
    : `Support « ${r.qr.label} » ajouté — il mène à la même page et compte ses scans à part.`
}
