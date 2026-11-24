// relectureQr.ts — chaque fichier exporté est relu par un décodeur avant d'être
// téléchargé (vague 3, revue du 23 nov.).
//
// La jauge de lisibilité est une ESTIMATION tirée des réglages. Un fichier peut
// être joli, bien noté, et illisible : un dégradé trop pâle, des yeux colorés,
// un logo trop grand. Ici, on lit le fichier lui-même, comme un téléphone :
//  · à sa résolution d'export ;
//  · RÉDUIT à ~3 pixels par module — ce qu'une caméra capte d'un QR imprimé
//    petit ou vu de loin. Un code qui ne passe que grand ne passe pas dans la rue.
// Le décodeur (jsQR, déjà au projet pour le testeur public) doit rendre EXACTEMENT
// l'adresse encodée. Un fond transparent est relu sur blanc (là où il sera posé).
//
// Le décodeur est plus exigeant qu'un téléphone récent sur certains styles
// (points, néon, logo) : un échec n'interdit donc pas le téléchargement — il
// prévient, et l'on peut passer outre en connaissance de cause.

export type EssaiDeLecture = { pixels: number; lu: string | null }
export type Relecture = { ok: boolean; essais: EssaiDeLecture[] }

/** Pixels par module de la lecture « vue de loin ». */
export const PIXELS_PAR_MODULE_DE_LOIN = 3

/** Les tailles de lecture : celle du fichier, et la petite (zone silencieuse comprise). */
export function taillesDeLecture(taillePx: number, modules: number): number[] {
  const loin = Math.round((modules + 8) * PIXELS_PAR_MODULE_DE_LOIN)
  const grande = Math.min(Math.max(taillePx, loin), 1200)
  return loin < grande ? [grande, loin] : [grande]
}

/** Le verdict (pur) : chaque lecture a rendu EXACTEMENT l'adresse attendue. */
export function verdict(essais: readonly EssaiDeLecture[], attendu: string): boolean {
  return essais.length > 0 && essais.every(e => e.lu === attendu)
}

async function chargerImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    img.decoding = "async"
    await new Promise<void>((ok, ko) => { img.onload = () => ok(); img.onerror = () => ko(new Error("image illisible")); img.src = url })
    return img
  } finally {
    // L'image est décodée : l'adresse temporaire peut partir après le prochain tour.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

/** Relit un fichier (PNG ou SVG) comme un téléphone. Navigateur uniquement. */
export async function relireUnFichier(blob: Blob, attendu: string, modules: number): Promise<Relecture> {
  const essais: EssaiDeLecture[] = []
  try {
    const img = await chargerImage(blob)
    const { default: jsQR } = await import("jsqr")
    const naturelle = Math.max(img.naturalWidth || 0, img.naturalHeight || 0) || 1024
    for (const px of taillesDeLecture(naturelle, modules)) {
      const c = document.createElement("canvas")
      c.width = px; c.height = px
      const ctx = c.getContext("2d", { willReadFrequently: true })
      if (!ctx) { essais.push({ pixels: px, lu: null }); continue }
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, px, px)     // un fond transparent est relu sur blanc
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, 0, 0, px, px)
      const d = ctx.getImageData(0, 0, px, px)
      const lu = jsQR(d.data, px, px, { inversionAttempts: "attemptBoth" })
      essais.push({ pixels: px, lu: lu?.data ?? null })
    }
  } catch { /* image ou décodeur indisponible : pas d'essai réussi */ }
  return { ok: verdict(essais, attendu), essais }
}

/** La phrase à montrer quand la relecture échoue. */
export function phraseDeRelecture(r: Relecture): string {
  const grand = r.essais[0], petit = r.essais[1]
  if (grand && grand.lu !== null && petit && petit.lu === null)
    return "Notre décodeur lit ce QR en grand, mais plus quand il est petit ou vu de loin. Imprimez-le plus grand, ou simplifiez son style (dégradé, yeux colorés, logo)."
  return "Notre décodeur n'arrive pas à lire ce fichier. Un téléphone récent y parviendra peut-être, mais vérifiez avant d'imprimer : contraste, dégradé, couleur des yeux, taille du logo."
}
