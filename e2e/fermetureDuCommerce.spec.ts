import { test, expect } from "@playwright/test"

// Vague 1 (revue du 23 nov.) : « fermé ce soir » et les congés, depuis Ma carte,
// sans l'éditeur. Banc /e2e-harness/ma-carte?horaires=1 (le vrai module pur).

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
const jourParis = (decalage = 0) => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + decalage * 86400000))
  const [a, m, j] = p.split("-").map(Number)
  return { iso: p, lisible: `${j === 1 ? "1er" : j} ${MOIS[m - 1]}`, a }
}

test("« Fermé aujourd'hui » d'un toucher, puis « Rouvrir maintenant »", async ({ page }, info) => {
  await page.goto("/e2e-harness/ma-carte?horaires=1")
  const bloc = page.getByRole("region", { name: "Fermetures" })
  await expect(bloc.getByRole("status")).toHaveText("Aucune fermeture annoncée.")
  await bloc.getByRole("button", { name: "Fermé aujourd'hui" }).click()
  await expect(bloc.getByRole("status")).toHaveText(`Fermé en ce moment. Vos clients lisent « Fermé · réouverture le ${jourParis(1).lisible} ».`)
  await page.screenshot({ path: `test-results/ferme-aujourdhui-${info.project.name}.png` })
  await bloc.getByRole("button", { name: "Rouvrir maintenant" }).click()
  await expect(bloc.getByRole("status")).toHaveText("Aucune fermeture annoncée.")
})

test("annoncer des congés au calendrier", async ({ page }, info) => {
  await page.goto("/e2e-harness/ma-carte?horaires=1")
  const bloc = page.getByRole("region", { name: "Fermetures" })
  await bloc.getByRole("button", { name: "Annoncer des congés" }).click()
  const form = page.getByRole("form", { name: "Annoncer des congés" })
  const d = jourParis(10), f = jourParis(16)
  await form.getByLabel("Premier jour fermé").fill(d.iso)
  await form.getByLabel("Dernier jour fermé").fill(f.iso)
  // Les deux calendriers tiennent dans la carte (au téléphone, le second dépassait).
  for (const nom of ["Premier jour fermé", "Dernier jour fermé"]) {
    const champ = (await form.getByLabel(nom).boundingBox())!, cadre = (await bloc.boundingBox())!
    expect(champ.x + champ.width, nom).toBeLessThanOrEqual(cadre.x + cadre.width + 0.5)
  }
  await page.screenshot({ path: `test-results/conges-${info.project.name}.png` })
  await form.getByRole("button", { name: "Annoncer" }).click()
  await expect(bloc.getByRole("status")).toHaveText(`Fermeture annoncée : « Fermé du ${d.lisible} au ${f.lisible} ».`)
  await expect(bloc.getByRole("button", { name: "Retirer l'annonce" })).toBeVisible()
})

test("une période inversée ne part pas (le calendrier l'arrête, le serveur la refuserait)", async ({ page }) => {
  await page.goto("/e2e-harness/ma-carte?horaires=1")
  const bloc = page.getByRole("region", { name: "Fermetures" })
  await bloc.getByRole("button", { name: "Annoncer des congés" }).click()
  const form = page.getByRole("form", { name: "Annoncer des congés" })
  await form.getByLabel("Premier jour fermé").fill(jourParis(10).iso)
  await form.getByLabel("Dernier jour fermé").fill(jourParis(5).iso)
  await form.getByRole("button", { name: "Annoncer" }).click()
  expect(await form.getByLabel("Dernier jour fermé").evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true)
  await expect(form).toBeVisible()
  await expect(bloc.getByRole("status")).toHaveText("Aucune fermeture annoncée.")
  // Le refus du serveur (« La réouverture doit venir après… ») est couvert par fermetureDuCommerce.test.ts.
})

test("sans horaires : on dit où les ajouter", async ({ page }) => {
  await page.goto("/e2e-harness/ma-carte")
  await expect(page.getByText("Fermetures : ajoutez d'abord vos horaires à la page.")).toBeVisible()
  await expect(page.getByRole("link", { name: "Ajouter mes horaires" })).toHaveAttribute("href", /\/dashboard\/builder\//)
})
