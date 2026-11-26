import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// L'atelier, puis ses champs (sortis en v382) — dans cet ordre, pour que les
// mesures d'ordre du DOM ne lisent que l'atelier.
const SRC = readFileSync(join(__dirname, "PrintStudioClient.tsx"), "utf8")
  + readFileSync(join(__dirname, "champsDuStudio.tsx"), "utf8")
  // Le rendu du support et son vocabulaire (sortis en v383).
  + readFileSync(join(__dirname, "renduDuSupport.tsx"), "utf8")
  + readFileSync(join(__dirname, "vocabulaireDuSupport.ts"), "utf8")
  // Les bibliothèques et l'éditeur à plat (sortis en v384).
  + readFileSync(join(__dirname, "bibliothequesDuStudio.tsx"), "utf8")
  + readFileSync(join(__dirname, "editeurAPlat.tsx"), "utf8")

// « Trop de défauts partout, l'interface doit être méga simplifiée, pas 30 onglets
// à ouvrir et à faire défiler. » Cinq accordéons empilés dans une colonne de
// 372 px : pour changer une couleur puis une marge, il fallait replier l'un,
// déplier l'autre, et retrouver sa place dans le défilement.

// « L'atelier : créer à gauche, régler à droite » : JOUÉ depuis v395
// (e2e/atelierDisposition.spec.ts) — rail à gauche de l'aperçu, réglages à
// droite, trois onglets sans accordéon, la sélection qui amène ses réglages,
// des rangées de choix qui s'enroulent.

// « Le contenu ne déborde plus du support » : RENDU depuis v395
// (supportAjuste.test.tsx, jsdom) — textes réduits ensemble, puis sous-titre
// retiré, puis QR réduit en dernier, jamais sous 24 px.

// « Un modèle remplace le design, il ne se pose pas dessus » : JOUÉ dans
// l'atelier depuis v392 (e2e/modeleQuiRemplace.spec.ts) — design retravaillé,
// texte et composition ajoutés, retour aux modèles : le rendu redevient celui
// du modèle, les ajouts restent. Les citations qui vivaient ici exigeaient le
// filtre fautif (il effaçait les compositions ajoutées à la main).

// « Le support rond est traité comme un rond » : RENDU depuis v394
// (supportRond.test.tsx, jsdom) — le vrai composant du support compte ses
// équerres et ses filets sur un rond et sur un carré témoin.

// « Print Studio mobile » — l'aperçu passait DERRIÈRE la feuille de réglages :
// on réglait « Taille du QR » et « Pastille » sans jamais voir le QR. Capturé au
// téléphone (390 × 844) avant/après.
describe("mobile : la feuille ne cache jamais le support", () => {
  it("l'aperçu se dimensionne sur la bande, plus de 320 × 400 en dur", () => {
    expect(SRC, "taille d'aperçu figée encore présente").not.toMatch(/isMobile \? 320 : 500/)
    expect(SRC).toContain("dimensionsApercuMobile(")
    expect(SRC).toContain("bandeApercuMobile(")
  })

  it("la feuille ET l'aperçu partagent la MÊME hauteur calculée", () => {
    // Deux valeurs indépendantes finissent toujours par diverger : c'est comme ça
    // que le plafond du panneau (72 %) et celui du rendu (44 %) s'étaient
    // contredits sur le curseur de taille du QR.
    expect(SRC).toMatch(/const vhFeuille = isMobile/)
    expect(SRC).toMatch(/height: kb \? `calc\(74vh - \$\{kb\}px\)` : `\$\{vhFeuille\}vh`/)
    expect(SRC).toMatch(/bandeApercuMobile\(hauteurEcran, sheetOpen, vhFeuille, paysage, chrome\)/)
    // La hauteur brute de la position ne doit plus servir directement à la feuille.
    expect(SRC).not.toMatch(/`\$\{SHEET_VH\[sheetPos\]\}vh`/)
  })

  it("le nom du support est visible sur mobile aussi", () => {
    // L'entête ne disait que « Bibliothèque » : impossible de savoir ce qu'on réglait.
    expect(SRC).not.toMatch(/\{!isMobile && <span[^>]*>\{item\.name\}/)
  })

  it("le bouton plein écran ne se pose plus SUR le support", () => {
    // Ancré en haut à droite du conteneur, il recouvrait le coin des supports
    // larges (carte de visite, chevalet). Sur mobile il rejoint la légende.
    expect(SRC).toMatch(/\{!isMobile && <button onClick=\{e => \{ e\.stopPropagation\(\); setFsOpen\(true\) \}\}/)
  })

  it("plus de réserve de 172 px sous un aperçu déjà dimensionné", () => {
    expect(SRC).not.toContain('isMobile ? "0 12px 172px"')
  })
})

// Audit mobile complet (captures 375×667, 390×844, 430×932 et 844×390 couché).
describe("mobile : ce que l'audit a trouvé", () => {
  it("les hauteurs de l'entête et de la barre sont MESURÉES, pas devinées", () => {
    // 52 px annoncés pour un entête qui en fait 72 : la légende de l'aperçu
    // passait sous la barre d'action sur les trois formats testés.
    expect(SRC).toContain("useHauteurMesuree")
    expect(SRC).toContain("ResizeObserver")
    expect(SRC).toMatch(/bandeApercuMobile\(hauteurEcran, sheetOpen, vhFeuille, paysage, chrome\)/)
  })

  it("couché, les réglages passent dans un tiroir latéral", () => {
    // Ancrés en bas sur 390 px de haut, ils ne pouvaient monter qu'à ~148 px
    // dont la barre d'action en masquait 117 : rien n'était atteignable.
    expect(SRC).toContain("estPaysage(largeurEcran, hauteurEcran)")
    expect(SRC).toMatch(/paysage\s*$\s*\?\s*\{ position: "fixed", top: 0, right: 0, bottom: 0/m)
  })

  it("l'aperçu réserve la place du tiroir au lieu de passer dessous", () => {
    expect(SRC).toMatch(/paysage && sheetOpen \? tiroirW \+ 12 : 12/)
  })

  it("le plein écran vit dans l'entête, donc reste atteignable panneau ouvert", () => {
    const debut = SRC.indexOf('className="ps-hdr"')
    expect(debut, "l'entête du studio est introuvable").toBeGreaterThan(0)
    const entete = SRC.slice(debut, SRC.indexOf("</header>", debut))
    expect(entete).toContain('aria-label="Voir en situation (plein écran)"')
    // ...et il ne traîne plus dans la ligne de légende, où il disparaissait dès
    // que le panneau s'ouvrait.
    const legende = SRC.slice(SRC.indexOf("supportHint(item)"), SRC.indexOf("supportHint(item)") + 700)
    expect(legende).not.toContain('aria-label="Voir en situation (plein écran)"')
  })

  it("aucune cible tactile sous 36 px dans les commandes du studio", () => {
    // Mesuré au navigateur : retour « Bibliothèque » 16 px, fermeture 22 px,
    // pastille de statut 32 px, suggestions de titre 24 px.
    for (const sonde of ['minHeight: 44, padding: "0 6px 0 0"', "minWidth: 44, minHeight: 44", "minHeight: 36"]) {
      expect(SRC, `garde-fou tactile manquant : ${sonde}`).toContain(sonde)
    }
  })

  // « L'export ne se dit pas prêt quand il manque le QR » : JOUÉ depuis v393
  // (e2e/exportSansQr.spec.ts, bureau + mobile ; etatDExport.test.ts). En le
  // jouant, la pastille de la barre disait « Prêt à imprimer » sans QR.
})
