import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ─────────────────────────────────────────────────────────────────────────────
// CIBLES AU POUCE — relevé au navigateur (Chromium, 360 px et 390 px, mode
// tactile), en testant chaque commande avec `elementFromPoint` au centre de sa
// boîte : le seul test qui dise « ce doigt-là atteint bien CE bouton ».
//
// Ce qui était mesuré avant ces corrections :
//   /examples            filtres métier ......................  32 px de haut
//   /features            styles Classic / Gold / Neon ........  28 px
//   /generateur-qr-code  pastilles de couleur ................  36 × 36
//   /upgrade             interrupteur Mensuel / Annuel .......  44 × 24
//   /creer + /dashboard/templates  favori ...................  38 × 38
//                                  Aperçu / Utiliser ........  38 px de haut
//                                  Filtrer ..................  37 px
//   éditeur (barre du haut)  Retour ..........................  30 × 24
//                            Annuler / Rétablir ..............  28 × 28
//                            Modèles .........................  32 × 24
//   guide de l'éditeur       pastilles d'étape ...............  14 × 40
//
// 44 px est le minimum tenable au pouce ; 24 px le plancher absolu (WCAG 2.5.8)
// réservé aux commandes qui doublent une action déjà disponible en grand.
// ─────────────────────────────────────────────────────────────────────────────

const ici = dirname(fileURLToPath(import.meta.url))
const lire = (...p: string[]) => readFileSync(join(ici, ...p), "utf8")

describe("tout ce qui se tape au pouce fait au moins 44 px", () => {
  it("les filtres métier d'Exemples ne font plus 32 px", () => {
    const css = lire("examples", "page.tsx")
    const regle = css.split("\n").find(l => l.includes(".filter-btn {"))
    expect(regle, "règle .filter-btn introuvable").toBeTruthy()
    expect(regle).toContain("min-height:44px")
  })

  it("les styles de QR de la page Fonctionnalités ne font plus 28 px", () => {
    const src = lire("features", "page.tsx")
    // La garde citait le style en ligne d'un bouton devenu `<ButtonLink>` au lot
    // v182. Ce qu'elle veut — 44 px au pouce — est maintenant tenu par la
    // primitive elle-même : sa plus petite taille est passée de 38 à 44 px dans
    // le même lot, parce qu'elle était sous le plancher que le produit s'impose.
    // On vérifie donc les deux : la page utilise la primitive, et la primitive
    // tient 44.
    expect(src).toContain("<ButtonLink")
    const css = lire("globals.css")
    expect(css).toMatch(/\.ui-btn--sm \{[^}]*min-height: 44px/)
    expect(css).toMatch(/\.ui-btn--md \{[^}]*min-height: 4[6-9]px/)
  })

  it("les pastilles de couleur du générateur font 44 px", () => {
    const src = lire("generateur-qr-code", "GeneratorClient.tsx")
    expect(src).not.toContain("width: 36, height: 36")
    expect(src.match(/width: 44, height: 44/g)?.length ?? 0).toBeGreaterThanOrEqual(3)
    // Les segments Style et Correction d'erreur montaient à 40 : 44 aussi.
    expect(src).not.toContain("flex: 1, minHeight: 40,")
  })

  it("l'interrupteur annuel de la page Tarifs se tape sur 44 px", () => {
    const src = lire("upgrade", "page.tsx")
    // Le dessin reste 44 × 24 ; c'est le bouton porteur qui fait 44 × 44.
    expect(src).toContain('width: 44, height: 44, margin: "-10px 0"')
    expect(src).toContain('role="switch"')
  })

  it("les commandes des cartes de modèles font 44 px sur téléphone", () => {
    const src = lire("dashboard", "templates", "page.tsx")
    expect(src).toContain("width: isMobile ? 44 : 32, height: isMobile ? 44 : 32")   // favori (32 px sur PC depuis le lot P2)
    expect(src).toContain('{ flex: "none", width: 44, minHeight: 44')                // Aperçu
    expect(src.match(/minHeight: isMobile \? 44 : undefined/g)?.length ?? 0).toBe(2)  // Utiliser (libre + verrouillé)
    expect(src).toContain("gap: 9, minHeight: 44")                                    // Filtrer
  })

  it("la barre du haut de l'éditeur se tape au pouce sur téléphone", () => {
    const src = lire("dashboard", "builder", "BuilderV4.tsx")
    expect(src).toContain("{ width: 44, height: 44, fontSize: 19 }")                   // Retour
    // 40 px au pouce ; 32 px à la souris depuis P2-14 (elles faisaient 28 px).
    expect(src.match(/width: isMobile \? 40 : 32, height: isMobile \? 40 : 32/g)?.length ?? 0).toBe(2)
    expect(src).toContain("{ minHeight: 40, justifyContent: \"center\" }")             // Modèles
    // La barre mesure 50 px sur téléphone (56 sur PC, comme la coquille) : assez haute pour ces cibles.
    expect(src).toContain("style={{ height: isMobile ? 50 : 56, background: \"var(--bg)\"")
  })

  it("« Publier » ne descend pas sous 44 px sur téléphone", () => {
    const css = lire("globals.css")
    const i = css.indexOf(".da-btn-primary--sm { padding")
    expect(i, "classe .da-btn-primary--sm introuvable").toBeGreaterThan(-1)
    const suite = css.slice(i, i + 460)
    expect(suite).toMatch(/@media \(max-width: 1024px\) \{\s*\.da-btn-primary--sm \{ min-height: 44px; \}/)
  })

  it("les mentions de réassurance cliquables de l'accueil font 44 px", () => {
    const src = lire("HomeClient.tsx")
    // « Chiffré » et « Hébergé en Europe » mènent à /security : 15 px de haut.
    expect(src).toContain('const stLien: React.CSSProperties = { ...st, minHeight: 44, margin: "-14px 0" }')
    expect(src).toContain('<Link key={t} href={href} style={stLien}')
  })

  it("le nom de la page garde sa place dans la barre de l'éditeur", () => {
    const src = lire("dashboard", "builder", "BuilderV4.tsx")
    // Le vide extensible partageait la place restante avec le champ du nom :
    // 33 px de large sur un écran de 360 px, soit trois lettres visibles.
    expect(src).toContain('{!isMobile && <div style={{ flex: 1 }} />}')
    expect(src).not.toMatch(/\n {10}<div style=\{\{ flex: 1 \}\} \/>/)
    // « ou partir d'un modèle de page complet » : 14 px de haut.
    expect(src).toContain('style={{ width: "100%", minHeight: 44, display: "flex"')
  })

  it("les appels à l'action de la page Fonctionnalités font 44 px", () => {
    // Trois styles en ligne étaient cités ici. Les trois boutons sont passés sur
    // la primitive au lot v182 ; leur hauteur ne s'écrit plus sur la page, elle
    // vient de `.ui-btn`. La garde vérifie donc la source réelle de la hauteur,
    // et qu'il ne reste aucune hauteur écrite à la main sous 44 px.
    const src = lire("features", "page.tsx")
    expect(src).toContain("<ButtonLink")
    for (const h of src.match(/minHeight:\s*(\d+)/g) ?? []) {
      expect(Number(h.split(":")[1]), `hauteur ${h} sous le plancher du pouce`).toBeGreaterThanOrEqual(44)
    }
  })

  it("les pastilles d'étape du guide font au moins 24 px de large", () => {
    const src = lire("dashboard", "builder", "BuilderWelcome.tsx")
    expect(src).toContain("width: 24, minWidth: 24, height: 40")
    // Elles ne doivent pas se toucher : 4 px d'écart au minimum.
    expect(src).toContain('<div style={{ display: "flex", gap: 4 }}>')
  })
})
