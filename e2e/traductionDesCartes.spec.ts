import { test, expect } from "@playwright/test"

// Vague 2, point 2 (revue du 23 nov.) : toutes les cartes de la page dans la
// langue du client. Une demande pour toute la carte (Ma carte), une seule barre
// de langues sur la page publique.

const REPONSE = [
  "# Cocktails signature ; Signature cocktails",
  "Mojito (démo) ; Mojito (demo)",
  "Spritz (démo) ; Spritz (demo)",
  "Citronnade maison (démo) ; Homemade lemonade (demo)",
].join("\n")

test("Ma carte : copier la demande, coller la réponse, voir ce qui est traduit", async ({ page, context }, info) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {})
  await page.goto("/e2e-harness/ma-carte")
  const bloc = page.getByRole("region", { name: "Traduire ma carte" })
  await expect(bloc.getByRole("status")).toHaveText("Pour les touristes : votre carte dans leur langue, en deux minutes.")
  await bloc.getByRole("button", { name: "Traduire" }).click()
  await expect(bloc.getByRole("button", { name: "Anglais", exact: true })).toHaveAttribute("aria-pressed", "true")
  await bloc.getByRole("button", { name: /^Copier la demande en anglais/ }).click()
  await expect(bloc.getByRole("button", { name: "Demande copiée" })).toBeVisible()

  await bloc.getByLabel("Collez la réponse ici").fill(REPONSE)
  await expect(bloc.getByText(/^4 sur \d+ éléments traduits\./)).toBeVisible()
  await page.screenshot({ path: `test-results/traduction-ma-carte-${info.project.name}.png` })
  await bloc.getByRole("button", { name: "Enregistrer" }).click()
  await expect(bloc.getByRole("status").first()).toHaveText(/^Anglais \(4\/\d+\)$/)
})

test("une réponse sans le français en tête n'est pas enregistrable", async ({ page }) => {
  await page.goto("/e2e-harness/ma-carte")
  const bloc = page.getByRole("region", { name: "Traduire ma carte" })
  await bloc.getByRole("button", { name: "Traduire" }).click()
  await bloc.getByLabel("Collez la réponse ici").fill("Onion soup\nStarters")
  await expect(bloc.getByText("Aucune ligne reconnue : le texte en français doit rester au début de chaque ligne.")).toBeVisible()
  await expect(bloc.getByRole("button", { name: "Enregistrer" })).toBeDisabled()
})

test("page publique : une seule barre, et le menu passe en anglais — allergènes compris", async ({ page }, info) => {
  const trad = "en|# 🥗 Entrées ; Starters\nSoupe à l'oignon ; Onion soup ; Topped with Comté cheese\nFoie gras poêlé ; Pan-seared foie gras ; Fig chutney, toasted brioche"
  await page.goto("/e2e-harness/public-page?t=resto_bistrot&traduction=" + encodeURIComponent(trad)
    + "&allergenes=" + encodeURIComponent("Soupe à l'oignon · Gratinée au comté:gluten,lait"))
  const barres = page.locator("[data-barre-des-langues]")
  await expect(barres).toHaveCount(1)
  await expect(page.getByText("Soupe à l'oignon", { exact: true })).toBeVisible()
  await barres.getByRole("button", { name: "English" }).click()
  const soupe = page.getByText("Onion soup", { exact: true })
  await soupe.scrollIntoViewIfNeeded()
  await expect(soupe).toBeVisible()
  await expect(page.getByText("Topped with Comté cheese", { exact: true })).toBeVisible()
  await expect(page.getByText("Starters", { exact: true })).toBeVisible()
  await expect(page.getByText("Allergens: Gluten, Milk", { exact: true })).toBeVisible()
  // Ce qui n'est pas traduit reste en français.
  await expect(page.getByText("Tartare de saumon", { exact: true })).toBeVisible()
  await page.screenshot({ path: `test-results/traduction-publique-${info.project.name}.png` })
  // Le choix est retenu : au retour, la carte est déjà en anglais.
  await page.reload()
  await expect(page.getByText("Onion soup", { exact: true })).toBeVisible()
})
