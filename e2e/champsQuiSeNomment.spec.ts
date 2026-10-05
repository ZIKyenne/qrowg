import { test, expect, type Page } from "@playwright/test"

// ═══════════════════════════════════════════════════════════════════════════════
// Q09 / Q10 — DES CHAMPS QUI DISENT LEUR NOM, DES IDENTIFIANTS UNIQUES.
//
// Q09 : plusieurs champs n'avaient pour nom que leur exemple de valeur. Un lecteur
// d'écran annonçait « ex : monsite.fr » au lieu de « Lien à encoder ».
// Q10 : sur /outils/taille-qr-code, le <main> et un sélecteur portaient tous deux
// `id="contenu"` — le libellé visait donc le premier, et le sélecteur s'annonçait
// sans nom.
//
// Ce que ce fichier mesure, que les gardes de source ne mesurent pas : l'ARBRE
// D'ACCESSIBILITÉ du navigateur, et le comportement du clic sur l'étiquette.
// ═══════════════════════════════════════════════════════════════════════════════

/** Les identifiants HTML en double sur la page rendue. */
async function identifiantsEnDouble(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vus = new Map<string, number>()
    for (const el of document.querySelectorAll("[id]")) {
      const id = el.getAttribute("id")!
      vus.set(id, (vus.get(id) ?? 0) + 1)
    }
    return [...vus].filter(([, n]) => n > 1).map(([id]) => id)
  })
}

test.describe("Q10 — le calculateur de taille", () => {
  test("aucun identifiant n'est porté deux fois", async ({ page }) => {
    await page.goto("/outils/taille-qr-code", { waitUntil: "domcontentloaded" })
    await expect(page.locator("main")).toBeVisible({ timeout: 30_000 })
    expect(await identifiantsEnDouble(page), "des identifiants sont en double").toEqual([])
  })

  test("le lien d'évitement mène au contenu principal, pas à un sélecteur", async ({ page }) => {
    await page.goto("/outils/taille-qr-code", { waitUntil: "domcontentloaded" })
    const cible = page.locator("#contenu")
    await expect(cible).toHaveCount(1)
    expect(await cible.evaluate(el => el.tagName.toLowerCase())).toBe("main")
  })

  test("et le sélecteur s'annonce avec son intitulé", async ({ page }) => {
    await page.goto("/outils/taille-qr-code", { waitUntil: "domcontentloaded" })
    const select = page.getByLabel("Que contient le code ?")
    await expect(select).toBeVisible({ timeout: 30_000 })
    expect(await select.evaluate(el => el.tagName.toLowerCase())).toBe("select")
    // Cliquer l'intitulé met bien le focus sur CE champ.
    await page.getByText("Que contient le code ?").click()
    await expect(select).toBeFocused()
  })
})

test.describe("Q09 — les champs du QR par lien portent un nom", () => {
  const ATTENDUS = [
    "Lien à encoder",
    "Nom du réseau Wi-Fi", "Mot de passe du réseau",
    "Prénom", "Nom de famille", "Téléphone", "Adresse e-mail", "Entreprise", "Fonction", "Site web",
    "Numéro à appeler", "Destinataire", "Objet du message",
    "Texte à encoder",
  ]

  test("chaque type de QR expose des champs trouvables par leur nom", async ({ page }) => {
    await page.goto("/dashboard/qr-link", { waitUntil: "domcontentloaded" })
    await expect(page.getByLabel("Lien à encoder")).toBeVisible({ timeout: 30_000 })

    // Les champs vivent derrière les onglets de type : on les parcourt tous.
    const trouves: string[] = []
    for (const onglet of ["Lien", "Wi-Fi", "Texte", "Contact", "Appel", "Email", "SMS"]) {
      const bouton = page.getByRole("button", { name: new RegExp(`^${onglet}$`, "i") }).first()
      if (await bouton.count()) { await bouton.click().catch(() => {}) }
      for (const nom of ATTENDUS) {
        if (trouves.includes(nom)) continue
        if (await page.getByLabel(nom, { exact: true }).count()) trouves.push(nom)
      }
    }
    expect(trouves.sort(), `champs introuvables par leur nom : ${ATTENDUS.filter(a => !trouves.includes(a)).join(", ")}`)
      .toEqual([...ATTENDUS].sort())
  })

  test("un champ vide garde son nom : il ne l'emprunte pas à sa valeur", async ({ page }) => {
    await page.goto("/dashboard/qr-link", { waitUntil: "domcontentloaded" })
    const champ = page.getByLabel("Lien à encoder")
    await expect(champ).toHaveValue("")
    await expect(champ).toBeVisible({ timeout: 30_000 })
    await champ.fill("https://qrowg.com")
    // Toujours trouvable après saisie — c'était le reproche fait à la recherche
    // de la galerie, qui empruntait le nom de son bouton d'effacement.
    await expect(page.getByLabel("Lien à encoder")).toHaveValue("https://qrowg.com")
  })

  test("cliquer l'intitulé place le curseur dans le champ", async ({ page }) => {
    await page.goto("/dashboard/qr-link", { waitUntil: "domcontentloaded" })
    const champ = page.getByLabel("Lien à encoder")
    await expect(champ).toBeVisible({ timeout: 30_000 })
    await page.getByText("Lien à encoder").click()
    await expect(champ).toBeFocused()
  })
})
