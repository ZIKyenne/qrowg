import { test, expect } from "@playwright/test"
import { baseSimulee } from "./baseSimulee"
import { ouvrir, depart, PAGE } from "./editeurSurBaseSimulee"

// La page d'un autre, au navigateur (v405). Toute page publiée est LISIBLE par
// tout compte connecté (policy « Lecture pages publiées »), sans ses blocs :
//  - l'éditeur ouvert sur l'adresse d'une telle page chargeait son titre et son
//    thème, avec un contenu vide — et c'est ce vide que l'autosave aurait tenté
//    d'écrire ;
//  - une sauvegarde que la RLS n'a pas laissé écrire passait pour faite : la
//    mise à jour de la page ne disait pas « zéro ligne ».

test.beforeEach(({}, info) => { test.skip(info.project.name === "mobile", "même chemin que le bureau") })

test("l'éditeur ouvert sur la page en ligne d'un autre compte : « plus accès », rien d'écrit", async ({ page }) => {
  const d = depart()
  d.pages[0] = { ...d.pages[0], user_id: "99999999-9999-4999-8999-999999999999", status: "published" }
  const base = await baseSimulee(page, d)
  await page.goto(`/dashboard/builder/${PAGE}`, { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("alert").filter({ hasText: "Vous n'avez plus accès à cette page" })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByLabel("Nom de la page")).toHaveCount(0)
  await page.waitForTimeout(1500)
  expect(base.ecritures, "aucune écriture vers la page d'un autre").toEqual([])
})

test("une sauvegarde que la base n'a pas laissé écrire n'est jamais « enregistrée »", async ({ page }) => {
  const { base, nom } = await ouvrir(page)
  base.ignorer("pages")
  await nom.fill("Le Comptoir du marché")
  await expect(page.getByText("Vous n'avez plus accès à cette page.").first()).toBeVisible({ timeout: 15_000 })
  expect(base.tables().pages[0].title).toBe("Le Comptoir")
  // Et aucun bloc n'a été écrit derrière une page refusée.
  expect(base.ecritures.filter(e => e.table === "blocks")).toEqual([])
})
