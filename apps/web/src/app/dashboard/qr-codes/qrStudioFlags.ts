import { oublier } from "@/lib/memoireDuNavigateur"
// Le Studio compact est le Studio QR de tout le monde depuis le 18 nov.
// L'ancien reste joignable le temps de la vérification, par `?zero=0` seulement —
// jamais retenu : personne ne doit rester coincé dessus sans l'avoir redemandé.
// (À supprimer avec QRStudio.tsx.)
export function ancienStudioDemande(): boolean {
  if (typeof window === "undefined") return false
  try {
    oublier("qrowg-qr-zero")   // l'ancien interrupteur, qui retenait le choix
    return new URL(window.location.href).searchParams.get("zero") === "0"
  } catch { return false }
}
