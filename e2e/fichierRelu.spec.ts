import { test, expect } from "@playwright/test"

// Vague 3, point 3 (revue du 23 nov.) : chaque fichier exporté est relu par un
// décodeur (jsQR) avant de partir — en grand, puis réduit comme vu de loin.

test("QR Studio : un PNG lisible est relu, puis téléchargé", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "le menu Télécharger est le même au téléphone ; une fois suffit")
  await page.goto("/e2e-harness/qr-studio?zero=1&plan=pro", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Télécharger" }).click()
  await expect(page.getByText("Chaque fichier est relu par un décodeur avant de partir.")).toBeVisible()
  const dl = page.waitForEvent("download")
  await page.getByRole("button", { name: /^PNG\b/ }).first().click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
  await expect(page.getByText("Dernier fichier relu par un décodeur : il mène bien à votre QR.")).toBeVisible()
})

test("QR Studio : yeux presque couleur du fond — bien noté, mais le décodeur ne le lit pas : on prévient", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "ordinateur")
  await page.goto("/e2e-harness/qr-studio?zero=1&plan=pro&yeux=pales", { waitUntil: "networkidle" })
  // La note signale les yeux pâles (règle testée dans qrScannability) sans bloquer le téléchargement.
  await page.getByRole("button", { name: "Télécharger" }).click()
  let telecharge = false
  page.on("download", () => { telecharge = true })
  await page.getByRole("button", { name: /^PNG\b/ }).first().click()
  const dialogue = page.getByRole("dialog").filter({ hasText: "Ce fichier n'a pas été relu" })
  await expect(dialogue).toBeVisible({ timeout: 15_000 })
  await page.screenshot({ path: `test-results/fichier-non-relu-${info.project.name}.png` })
  await dialogue.getByRole("button", { name: "Revoir le QR" }).click()
  await expect(dialogue).toHaveCount(0)
  expect(telecharge).toBe(false)
  // En connaissance de cause, on peut passer outre.
  const dl = page.waitForEvent("download")
  await page.getByRole("button", { name: /^PNG\b/ }).first().click()
  await page.getByRole("dialog").getByRole("button", { name: "Télécharger quand même" }).click()
  expect((await dl).suggestedFilename()).toMatch(/\.png$/)
})
