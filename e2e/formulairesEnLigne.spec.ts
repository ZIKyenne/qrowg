import { test, expect, type Page, type Request } from "@playwright/test"

// Les formulaires de la page publiée, joués dans le vrai navigateur.
//
// Rendu unique, lot 6 (24 nov.) : les six formulaires ont été DÉPLACÉS dans le
// renderer partagé. Ce qu'ils envoient est l'argent du commerçant — un client
// qui demande un devis, une table, une inscription. Ce fichier vérifie, au
// banc d'essai et sans base de données, que le déplacement n'a rien changé à
// ce qui part : `/api/leads` est intercepté, rien n'est réellement enregistré.
// Joué à chaque push (job `filet`).

const banc = (type: string, contenu: Record<string, string> = {}) =>
  `/e2e-harness/bloc?type=${type}&c=${encodeURIComponent(JSON.stringify(contenu))}`

/** Intercepte /api/leads : renvoie `statut`, et garde chaque corps envoyé. */
async function intercepter(page: Page, statut = 200) {
  const envois: Record<string, any>[] = []
  await page.route("**/api/leads", async route => {
    envois.push(JSON.parse(route.request().postData() || "{}"))
    await route.fulfill({ status: statut, contentType: "application/json", body: statut === 200 ? '{"ok":true}' : '{"error":"x"}' })
  })
  return envois
}

test("contact : validation, envoi, et ce qui part réellement", async ({ page }) => {
  const envois = await intercepter(page)
  await page.goto(banc("contact_form", { title: "Écrivez-nous" }), { waitUntil: "networkidle" })
  const envoyer = page.getByRole("button", { name: "Envoyer" })
  await expect(envoyer, "désactivé tant que nom et e-mail manquent").toBeDisabled()

  await page.getByLabel("Nom").fill("Marie Test")
  await page.getByLabel(/e-?mail/i).fill("pas-une-adresse")
  await expect(page.getByText(/adresse email invalide/i)).toBeVisible()
  await expect(envoyer).toBeDisabled()
  await page.getByLabel(/e-?mail/i).fill("marie@example.com")
  await page.getByLabel("Message").fill("Bonjour, êtes-vous ouverts dimanche ?")
  await expect(envoyer).toBeEnabled()
  await envoyer.click()

  await expect(page.getByRole("status")).toBeVisible()
  expect(envois).toHaveLength(1)
  expect(envois[0]).toMatchObject({ type: "contact", blockId: "bloc", name: "Marie Test", email: "marie@example.com", message: "Bonjour, êtes-vous ouverts dimanche ?" })
  expect(envois[0].pageId).toMatch(/^[0-9a-f-]{36}$/)
})

test("contact : le pot de miel rempli ne part pas, et le robot croit avoir réussi", async ({ page }) => {
  const envois = await intercepter(page)
  await page.goto(banc("contact_form"), { waitUntil: "networkidle" })
  await page.getByLabel("Nom").fill("Robot")
  await page.getByLabel(/e-?mail/i).fill("robot@example.com")
  await page.locator('input[name="website"]').evaluate((el: HTMLInputElement) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
    set.call(el, "http://spam.example"); el.dispatchEvent(new Event("input", { bubbles: true }))
  })
  await page.getByRole("button", { name: "Envoyer" }).click()
  await expect(page.getByRole("status")).toBeVisible()
  expect(envois, "rien n'a été envoyé").toHaveLength(0)
})

test("contact : un échec d'enregistrement ne se fait pas passer pour un succès", async ({ page }) => {
  const envois = await intercepter(page, 500)
  await page.goto(banc("contact_form"), { waitUntil: "networkidle" })
  await page.getByLabel("Nom").fill("Marie Test")
  await page.getByLabel(/e-?mail/i).fill("marie@example.com")
  await page.getByRole("button", { name: "Envoyer" }).click()
  const statut = page.getByRole("status")
  await expect(statut).toBeVisible()
  expect(envois).toHaveLength(1)
  // Sans adresse de repli au banc, l'issue est l'échec — dit comme tel (lot v81).
  await expect(statut).not.toContainText(/enregistr/i)
})

test("inscription à un événement : type « register », nom et e-mail", async ({ page }) => {
  const envois = await intercepter(page)
  await page.goto(banc("event_register", { title: "Atelier bougies" }), { waitUntil: "networkidle" })
  const champs = page.locator("input:not([name=website])")
  await champs.nth(0).fill("Luc Test")
  await champs.nth(1).fill("luc@example.com")
  await page.getByRole("button", { name: /inscri/i }).click()
  await expect(page.getByRole("status")).toBeVisible()
  expect(envois[0]).toMatchObject({ type: "register", name: "Luc Test", email: "luc@example.com", message: "Inscription: Atelier bougies" })
})

test("RSVP : la réponse choisie part, et l'écran attend l'enregistrement", async ({ page }) => {
  const envois = await intercepter(page)
  await page.goto(banc("rsvp", { title: "Serez-vous là samedi ?" }), { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /oui/i }).click()
  await expect(page.getByRole("status")).toBeVisible()
  expect(envois[0]).toMatchObject({ type: "rsvp", message: "oui", data: { question: "Serez-vous là samedi ?", reponse: "oui" } })
})

test("devis et réservation : leur type et leurs champs", async ({ page }) => {
  const envois = await intercepter(page)
  for (const [type, attendu] of [["quote_form", "quote"], ["reservation_form", "reservation"], ["booking_request", "booking"]] as const) {
    await page.goto(banc(type), { waitUntil: "networkidle" })
    const champs = page.locator("input:not([name=website]), textarea")
    await champs.nth(0).fill("Client Test")
    await champs.nth(1).fill("client@example.com")
    await page.getByRole("button", { name: /envoyer|réserver/i }).click()
    await expect(page.getByRole("status")).toBeVisible()
    expect(envois.at(-1), type).toMatchObject({ type: attendu, blockId: "bloc" })
  }
})
