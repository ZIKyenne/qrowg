import { test, expect, type Page } from "@playwright/test"
import { collect } from "./helpers/collect"

// QA navigateur de la galerie de modèles, sur /creer — la MÊME galerie que
// /dashboard/templates, servie en public (aucun compte, aucune base).
//
// Ce que cette suite vérifie, et pourquoi. Un visiteur a relevé le 29 septembre :
//
//   filtre « Restaurant »   n'affichait pas « Bistrot français »
//   filtre « Bar »          n'affichait ni « Bar à cocktails » ni « Bar de nuit »
//   filtre « Café »         n'affichait pas « Coffee shop »
//   recherche « cafe »      ne trouvait pas « Coffee shop »
//   aperçu d'un modèle      s'ouvrait EN BAS, focus sur un lien Instagram
//   vignettes               la même silhouette pour les quarante-huit modèles
//
// Les tables sont couvertes par les tests unitaires ; ici on vérifie ce qui ne se
// lit pas dans un fichier : ce que l'écran affiche, où va le focus, où en est le
// défilement, et ce que rend vraiment une miniature.
//
// Toutes les attentes passent par les assertions qui RÉESSAYENT. Filtrer redessine
// jusqu'à quarante-huit cartes, miniatures comprises : lire la grille aussitôt
// après le clic renvoyait l'état d'avant, et un `waitForTimeout` aurait rendu la
// suite instable sur une machine chargée.

const URL_GALERIE = "/creer"
const TITRES = 'article.tpl-card h2[id^="tpl-nom-"]'

const carteNommee = (page: Page, nom: string) => page.locator(`${TITRES}:text-is(${JSON.stringify(nom)})`)

/** Attend que ce modèle soit affiché. */
const attendreModele = (page: Page, nom: string) =>
  // `.first()` : deux modèles peuvent porter le même nom — c'est justement un des
  // points vérifiés plus bas.
  expect(carteNommee(page, nom).first(), `« ${nom} » devrait être affiché`).toBeVisible({ timeout: 20_000 })

/** Attend que ce modèle ne soit PLUS affiché. */
const attendreSansModele = (page: Page, nom: string) =>
  expect(carteNommee(page, nom), `« ${nom} » ne devrait pas être affiché`).toHaveCount(0, { timeout: 20_000 })

const champRecherche = (page: Page) => page.getByLabel(/Rechercher un modèle par nom/)

/** Déroule la galerie complète : l'accueil ne montre que les 8 recommandés. */
async function toutAfficher(page: Page) {
  const bouton = page.getByRole("button", { name: /Voir les \d+ autres modèles/ })
  if (await bouton.count()) await bouton.first().click()
}

/**
 * Ouvre la galerie et attend qu'elle soit BRANCHÉE, pas seulement dessinée.
 * `data-galerie="prete"` n'est écrit qu'après l'hydratation : cliquer avant, c'est
 * cliquer dans du HTML inerte, et la mesure accuse alors le produit à tort.
 */
async function ouvrirGalerie(page: Page) {
  await page.goto(URL_GALERIE, { waitUntil: "networkidle" })
  await expect(page.locator('[data-galerie="prete"]')).toBeAttached({ timeout: 30_000 })
  await expect(page.locator("article.tpl-card").first()).toBeVisible({ timeout: 30_000 })
}

test.describe("galerie de modèles — filtres et recherche", () => {
  test.beforeEach(async ({ page }) => { await ouvrirGalerie(page) })

  test("« Restaurant » affiche le Bistrot français, et pas un salon de coiffure", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "chips en ligne = desktop")
    await page.getByRole("button", { name: /^Restaurant/ }).click()
    await attendreModele(page, "Bistrot français")
    await attendreSansModele(page, "Salon de coiffure")
    expect(await page.locator("article.tpl-card").count()).toBeGreaterThan(1)
  })

  test("« Bar » affiche les deux bars", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "chips en ligne = desktop")
    await page.getByRole("button", { name: /^Bar/ }).click()
    await attendreModele(page, "Bar à cocktails")
    await attendreModele(page, "Bar de nuit")
  })

  test("« Café » affiche le Coffee shop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "chips en ligne = desktop")
    await page.getByRole("button", { name: /^Café/ }).click()
    await attendreModele(page, "Coffee shop")
  })

  test("le compteur d'une chip vaut le nombre de cartes qu'elle affiche", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "chips en ligne = desktop")
    for (const secteur of [/^Restaurant/, /^Bar/, /^Café/, /^Beauté/, /^Immobilier/, /^Artisan/, /^Association/, /^Sport/]) {
      const chip = page.getByRole("button", { name: secteur }).first()
      const annonce = Number(((await chip.innerText()).match(/(\d+)\s*$/) || [])[1])
      expect(annonce, `chip ${secteur} sans compteur`).toBeGreaterThan(0)
      await chip.click()
      await expect(page.locator("article.tpl-card"), `chip ${secteur} annonce ${annonce}`)
        .toHaveCount(annonce, { timeout: 20_000 })
    }
  })

  test("« cafe » sans accent trouve le Coffee shop ; « café » et « CAFÉ » aussi", async ({ page }) => {
    for (const q of ["cafe", "café", "CAFÉ"]) {
      await champRecherche(page).fill(q)
      await attendreModele(page, "Coffee shop")
    }
  })

  test("« cocktail » et « plombier » trouvent par synonyme", async ({ page }) => {
    await champRecherche(page).fill("cocktail")
    await attendreModele(page, "Bar à cocktails")
    await champRecherche(page).fill("plombier")
    await attendreModele(page, "Artisan du bâtiment")
  })

  test("le champ de recherche a un nom, distinct du bouton d'effacement", async ({ page }) => {
    const champ = champRecherche(page)
    await expect(champ).toBeVisible()
    await champ.fill("cafe")
    // Deux commandes, deux noms : le champ n'emprunte plus celui du bouton.
    const effacer = page.getByRole("button", { name: "Effacer la recherche" })
    await expect(effacer).toBeVisible({ timeout: 20_000 })
    await effacer.click()
    await expect(champ).toHaveValue("")
  })

  test("une recherche sans résultat le dit, et propose de revenir", async ({ page }) => {
    await champRecherche(page).fill("zzzzqwxyz")
    await expect(page.getByText("Aucun modèle trouvé")).toBeVisible({ timeout: 20_000 })
    await page.getByRole("button", { name: "Voir tous les modèles" }).click()
    await expect(page.locator("article.tpl-card").first()).toBeVisible()
  })

  test("aucun secteur affiché ne rend une galerie vide", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "chips en ligne = desktop")
    const chips = page.locator("button.dat-chip")
    const n = await chips.count()
    expect(n).toBeGreaterThan(5)
    for (let i = 0; i < n; i++) {
      const libelle = (await chips.nth(i).innerText()).replace(/\s+/g, " ")
      await chips.nth(i).click()
      await expect(page.locator("article.tpl-card").first(), `secteur ${libelle} vide`).toBeVisible({ timeout: 20_000 })
    }
  })
})

test.describe("galerie de modèles — aperçu", () => {
  test.beforeEach(async ({ page }) => { await ouvrirGalerie(page) })

  for (const modele of ["Bistrot français", "Freelance / Consultant"]) {
    test(`« ${modele} » s'ouvre EN HAUT, sans focus dans la maquette`, async ({ page }) => {
      await toutAfficher(page)
      const carte = page.locator("article.tpl-card", { has: page.locator(`h2:text-is(${JSON.stringify(modele)})`) }).first()
      await carte.scrollIntoViewIfNeeded()
      await carte.getByRole("button", { name: `Aperçu de ${modele}` }).first().click()
      await expect(page.getByRole("dialog")).toBeVisible()

      // 1. La page simulée est en haut.
      expect(await page.locator(".preview-scroll").first().evaluate(el => el.scrollTop),
        "la page simulée ne s'ouvre pas en haut").toBe(0)

      // 2. Le focus est DANS la fenêtre, et pas dans la maquette inerte.
      const ou = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null
        return {
          dansLaFenetre: !!a?.closest('[role="dialog"]'),
          dansLaMaquette: !!a?.closest("[inert]"),
          nom: a?.getAttribute("aria-label") || a?.textContent?.trim().slice(0, 40) || a?.tagName || "",
        }
      })
      expect(ou.dansLaFenetre, `focus hors fenêtre (${ou.nom})`).toBe(true)
      expect(ou.dansLaMaquette, `focus dans la maquette (${ou.nom})`).toBe(false)
      expect(ou.nom.toLowerCase()).not.toContain("instagram")

      // 3. La maquette EST bien inerte (React 18 écrivait l'attribut à faux).
      expect(await page.locator('[role="dialog"] [inert]').count(),
        "la page simulée n'est pas inerte").toBeGreaterThan(0)
    })
  }

  test("la tabulation reste dans la fenêtre, et Échap rend le focus au déclencheur", async ({ page }) => {
    const carte = page.locator("article.tpl-card").first()
    const nom = await carte.locator('h2[id^="tpl-nom-"]').innerText()
    await carte.getByRole("button", { name: `Aperçu de ${nom}` }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()

    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab")
      const etat = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null
        return {
          dedans: !!a?.closest('[role="dialog"]'),
          maquette: !!a?.closest("[inert]"),
          nom: a?.getAttribute("aria-label") || a?.textContent?.trim().slice(0, 30) || "",
        }
      })
      expect(etat.dedans, `sortie de la fenêtre au Tab n°${i + 1} (${etat.nom})`).toBe(true)
      expect(etat.maquette, `tabulation entrée dans la maquette au Tab n°${i + 1}`).toBe(false)
    }

    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    const rendu = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute("aria-label") || "")
    expect(rendu, "le focus n'est pas revenu au bouton d'origine").toContain("Aperçu de")
  })

  test("la page simulée reste DÉFILABLE : au doigt, à la molette et au clavier", async ({ page, context }) => {
    // L'inertie posée sur la COQUE emportait le cadre de défilement qui est
    // dedans : mesuré sur le build de production, la page simulée ne bougeait
    // plus d'un pixel alors qu'elle mesure le double du hublot. On ne voyait donc
    // plus un modèle au-delà de son premier écran. L'inertie porte désormais sur
    // le CONTENU ; le cadre, lui, défile.
    const carte = page.locator("article.tpl-card").first()
    await carte.getByRole("button", { name: /^Aperçu de / }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()

    const cadre = page.locator(".preview-scroll").first()
    const mesures = await cadre.evaluate(el => ({ haut: el.scrollHeight, hublot: el.clientHeight, dansInert: !!el.closest("[inert]") }))
    expect(mesures.haut, "la page simulée tient dans le hublot : rien à défiler").toBeGreaterThan(mesures.hublot + 100)
    expect(mesures.dansInert, "le cadre de défilement est lui-même inerte").toBe(false)

    // 1. Au doigt (événements tactiles réels).
    const bx = (await cadre.boundingBox())!
    const cdp = await context.newCDPSession(page)
    const x = Math.round(bx.x + bx.width / 2), y0 = Math.round(bx.y + bx.height * 0.78)
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] })
    for (let i = 1; i <= 10; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: Math.round(y0 - i * 25) }] })
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    await expect.poll(() => cadre.evaluate(el => el.scrollTop), { message: "défilement au doigt", timeout: 5_000 }).toBeGreaterThan(50)

    // 2. À la molette — geste de souris, donc mesuré sur le projet desktop.
    if (test.info().project.name === "desktop") {
      await cadre.evaluate(el => { el.scrollTop = 0 })
      await page.mouse.move(x, Math.round(bx.y + bx.height / 2))
      await page.mouse.wheel(0, 300)
      await expect.poll(() => cadre.evaluate(el => el.scrollTop), { message: "défilement à la molette", timeout: 5_000 }).toBeGreaterThan(50)
    }

    // 3. Au clavier : la région porte un nom, prend le focus et défile.
    await cadre.evaluate(el => { el.scrollTop = 0 })
    await cadre.focus()
    expect(await page.evaluate(() => (document.activeElement as HTMLElement)?.classList.contains("preview-scroll")), "la région ne prend pas le focus").toBe(true)
    await page.keyboard.press("PageDown")
    await expect.poll(() => cadre.evaluate(el => el.scrollTop), { message: "défilement au clavier", timeout: 5_000 }).toBeGreaterThan(50)
  })

  test("`inert` est vraiment posé : attribut ET propriété DOM", async ({ page }) => {
    // React 18 comme React 19 traitent `inert` comme un attribut BOOLÉEN : lui
    // passer la chaîne vide vaut `false` et n'écrit rien du tout. Le navigateur
    // est seul juge — on lit donc la propriété, pas le code.
    const surLaCarte = await page.locator("[data-mini-apercu]").first().evaluate(el => ({ attr: el.getAttribute("inert"), prop: (el as any).inert }))
    expect(surLaCarte.prop, "la miniature n'est pas inerte pour le navigateur").toBe(true)
    expect(surLaCarte.attr).not.toBeNull()

    await page.locator("article.tpl-card").first().getByRole("button", { name: /^Aperçu de / }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    const dansLaFenetre = await page.locator('[role="dialog"] [inert]').first().evaluate(el => ({ prop: (el as any).inert, aDesLiens: el.querySelectorAll("a[href],button").length }))
    expect(dansLaFenetre.prop, "la maquette n'est pas inerte pour le navigateur").toBe(true)
    // Et ce qu'elle contient n'est atteignable par aucune tabulation (test voisin).
    expect(dansLaFenetre.aDesLiens).toBeGreaterThanOrEqual(0)
  })

  test("la fenêtre de création rend le focus au bouton « Utiliser »", async ({ page }) => {
    // Cette fenêtre-là a un champ `autoFocus`, et React applique `autoFocus`
    // AVANT les effets : le crochet partagé relevait donc le champ de la fenêtre
    // comme « focus précédent », puis le rendait à un élément détruit — le focus
    // retombait sur <body>, tout en haut de la page. Vérifié identique avant
    // modification (A/B sur la version précédente du crochet).
    const carte = page.locator("article.tpl-card").first()
    await carte.getByRole("button", { name: "Utiliser" }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    // On entre bien dans le champ : c'est ce que demande une fenêtre qui saisit.
    expect(await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName)).toBe("INPUT")
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    expect(await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null
      return { tag: a?.tagName, txt: a?.textContent?.trim().slice(0, 8) }
    })).toEqual({ tag: "BUTTON", txt: "Utiliser" })
  })

  test("ouvrir un second modèle repart du haut (le conteneur est réemployé)", async ({ page }) => {
    const cartes = page.locator("article.tpl-card")
    const nom = await cartes.nth(1).locator('h2[id^="tpl-nom-"]').innerText()
    // Premier passage : on descend volontairement dans la page simulée.
    await cartes.nth(0).getByRole("button", { name: /^Aperçu de / }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.locator(".preview-scroll").first().evaluate(el => { el.scrollTop = 400 })
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    // Second modèle : il doit s'ouvrir en haut, pas là où on avait laissé le premier.
    await cartes.nth(1).getByRole("button", { name: `Aperçu de ${nom}` }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    expect(await page.locator(".preview-scroll").first().evaluate(el => el.scrollTop)).toBe(0)
  })
})

test.describe("galerie de modèles — miniatures", () => {
  test("les premières cartes montrent le VRAI contenu du modèle", async ({ page }, testInfo) => {
    await ouvrirGalerie(page)

    const dessinees = page.locator('[data-mini-dessine="1"]')
    await expect(dessinees.first()).toBeVisible({ timeout: 20_000 })
    expect(await dessinees.count(), "les cartes du premier écran doivent être dessinées").toBeGreaterThan(3)

    // Du texte réel, rendu par le moteur d'affichage — pas une silhouette.
    const texte = await dessinees.first().evaluate(el => (el as HTMLElement).innerText || el.textContent || "")
    expect(texte.replace(/\s+/g, " ").trim().length, "miniature sans contenu").toBeGreaterThan(30)

    // Deux modèles voisins ne présentent pas la même vignette.
    expect(await dessinees.nth(0).innerHTML()).not.toBe(await dessinees.nth(1).innerHTML())

    await testInfo.attach(`galerie-${testInfo.project.name}`, { body: await page.screenshot({ fullPage: false }), contentType: "image/png" })
  })

  test("aucune iframe tierce n'est montée par les miniatures", async ({ page }) => {
    await ouvrirGalerie(page)
    expect(await page.locator("[data-mini-apercu] iframe").count()).toBe(0)
  })

  test("la miniature est inerte : la carte n'expose que ses trois commandes", async ({ page }) => {
    await ouvrirGalerie(page)
    const carte = page.locator("article.tpl-card").first()
    // Aperçu (la vignette), Favori, Aperçu (le bouton), Utiliser.
    expect(await carte.locator("button:visible, a[href]:visible").count()).toBeLessThanOrEqual(4)
    expect(await carte.locator("[data-mini-apercu][inert]").count(), "la miniature n'est pas inerte").toBe(1)
  })
})

test.describe("galerie de modèles — mise en page et propreté", () => {
  test("titre, recherche, filtres et grille partent du même bord", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "alignement mesuré sur la colonne desktop")
    await ouvrirGalerie(page)
    const bord = async (sel: string) => Math.round((await page.locator(sel).first().boundingBox())!.x)
    const titre = await bord("h1")
    const mesures = {
      recherche: await bord(".dat-search"),
      chips: await bord("button.dat-chip"),
      "rail des plans": await bord(".dat-rail"),
      grille: await bord("article.tpl-card"),
    }
    for (const [nom, x] of Object.entries(mesures)) {
      expect(Math.abs(x - titre), `${nom} désaligné du titre (${x} vs ${titre})`).toBeLessThanOrEqual(2)
    }
  })

  test("le titre de la galerie est en police sans empattements", async ({ page }) => {
    await ouvrirGalerie(page)
    const police = await page.locator("h1").first().evaluate(el => getComputedStyle(el).fontFamily)
    expect(police).toMatch(/Inter|system-ui/i)
    expect(police, "le titre lit encore une serif").not.toMatch(/Lora|Georgia|Fraunces|Playfair/i)
  })

  test("un seul bouton doré plein par écran : pas dans la liste des cartes", async ({ page }) => {
    await ouvrirGalerie(page)
    expect(await page.locator("article.tpl-card .da-btn-primary").count(),
      "de l'or plein dans une liste répétée").toBe(0)
    expect(await page.locator("article.tpl-card .da-btn-ghost").count()).toBeGreaterThan(0)
  })

  test("la galerie se charge sans erreur fatale ni 404 de l'application", async ({ page }) => {
    const c = collect(page)
    await ouvrirGalerie(page)
    await toutAfficher(page)
    await expect(page.locator("article.tpl-card").nth(20)).toBeVisible({ timeout: 20_000 })
    expect(c.pageErrors, "erreurs fatales:\n" + c.pageErrors.join("\n")).toEqual([])
    // `/_vercel/insights/script.js` n'est servi QUE par la plateforme Vercel :
    // en local (dev comme `next start`) il manque, et la balise reste sans effet.
    const reseau = c.badResponses.filter(l =>
      // Servi uniquement par la plateforme Vercel : absent en local.
      !l.includes("/_vercel/insights/") &&
      // Préchargement de route annulé par Next quand le lien quitte l'écran : ce
      // n'est pas une ressource en échec, c'est une requête qu'on a cessé de vouloir.
      !(l.includes("_rsc=") && l.includes("ERR_ABORTED")))
    expect(reseau, "réseau même-origine:\n" + reseau.join("\n")).toEqual([])
  })

  test("mobile : la feuille de filtres s'ouvre et filtre vraiment", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "feuille de filtres = projet mobile")
    await ouvrirGalerie(page)
    await page.getByRole("button", { name: "Filtrer" }).click()
    await page.getByRole("button", { name: /^Café/ }).click()
    await page.getByRole("button", { name: /^Voir \d+ template/ }).click()
    await attendreModele(page, "Coffee shop")
  })

  test("mobile : rien ne déborde en largeur", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mesure mobile")
    await ouvrirGalerie(page)
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(debord, "défilement horizontal sur mobile").toBeLessThanOrEqual(1)
  })

  test("mobile : les deux modèles homonymes se distinguent", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mesure mobile")
    await ouvrirGalerie(page)
    await champRecherche(page).fill("coiffure")
    await attendreModele(page, "Salon de coiffure")
    // Deux modèles portent ce nom. Sur mobile la carte n'affiche que le titre :
    // sans la variante d'ambiance, les deux cartes étaient indiscernables.
    const homonymes = page.locator("article.tpl-card", { has: page.locator('h2:text-is("Salon de coiffure")') })
    await expect(homonymes).toHaveCount(2, { timeout: 20_000 })
    const textes = (await homonymes.allInnerTexts()).map(t => t.replace(/\s+/g, " ").trim())
    expect(textes[0], "deux cartes homonymes identiques").not.toBe(textes[1])
    for (const t of textes) expect(t.length, `carte sans variante : ${t}`).toBeGreaterThan("Salon de coiffure".length + 3)
  })
})
