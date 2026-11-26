import { test, expect, type Page } from "@playwright/test"
import { ouvrir, depart, retenirLeDelai, titreEnBase } from "./editeurSurBaseSimulee"

// La sauvegarde de l'éditeur, jouée dans Chromium contre une base qui retient
// ce qu'on lui écrit (v390). Jusqu'ici, aucun test navigateur ne pouvait ouvrir
// une page EXISTANTE : la session simulée répondait « vide » à tout, et — trouvé
// en montant ce banc — l'éditeur lui-même abandonnait le chargement en
// développement (drapeau de montage jamais remis à true après le double montage
// du mode strict).
//
// Ce qui est prouvé ici, au navigateur : une modification arrive en base ; et
// quitter l'éditeur par un lien interne ne la perd pas — ni juste après la
// frappe, ni quand elle attend derrière une écriture en cours (les deux
// chemins corrigés en v389, jusqu'ici joués seulement en jsdom).

/** Un lien interne : navigation sans rechargement — `beforeunload` ne se déclenche pas. */
const quitterParLeMenu = (page: Page) => page.getByRole("link", { name: "Tableau de bord" }).first().click()

test.beforeEach(({}, info) => { test.skip(info.project.name === "mobile", "coquille de bureau (le lien de sortie est dans la barre latérale)") })

test("une page existante se charge, et une modification arrive en base — une seule fois", async ({ page }) => {
  const { base, nom } = await ouvrir(page)
  expect(base.ecritures, "ouvrir n'écrit rien").toEqual([])
  await nom.fill("Le Comptoir du marché")
  await expect.poll(titreEnBase(base)).toBe("Le Comptoir du marché")
  // Les blocs sont réécrits sous LEURS identifiants (upsert), jamais en double.
  expect(base.tables().blocks.map(b => b.id)).toEqual(depart().blocks.map(b => b.id))
  await page.waitForTimeout(1500)
  expect(base.ecritures.filter(e => e.table === "pages"), "une rafale = une écriture").toHaveLength(1)
})

test("quitter par un lien interne juste après une frappe ne la perd pas", async ({ page }) => {
  const { base, nom } = await ouvrir(page)
  // Le délai de 0,8 s est retenu : il ne peut PAS écrire. Sans cela, Next garde
  // l'éditeur monté le temps de préparer l'écran suivant (plus de 0,8 s en
  // développement), le minuteur écrirait avant le départ, et le test passerait
  // sans rien prouver. Ici, seul le départ peut écrire.
  await retenirLeDelai(page)
  await nom.fill("Le Comptoir du marché")
  await quitterParLeMenu(page)
  await expect(page).not.toHaveURL(/\/builder\//)
  // Avant v389, l'écriture prévue mourait avec l'éditeur.
  await expect.poll(titreEnBase(base), { message: "écrit au départ, délai toujours retenu" }).toBe("Le Comptoir du marché")
})

test("quitter pendant une écriture : la modification en file part après elle", async ({ page }) => {
  const { base, nom } = await ouvrir(page)
  base.retenir()
  await nom.fill("Le Comptoir A")
  await expect.poll(() => base.enAttente(), { message: "la première écriture est en route" }).toBeGreaterThan(0)
  await nom.fill("Le Comptoir B")
  await page.waitForTimeout(1200)          // B a passé son délai : elle attend derrière A
  await quitterParLeMenu(page)
  await expect(page).not.toHaveURL(/\/builder\//)
  expect(titreEnBase(base)(), "rien n'est encore arrivé").toBe("Le Comptoir")
  await base.relacher()
  // A arrive, puis B part — l'éditeur n'est plus là, la sauvegarde si.
  await expect.poll(titreEnBase(base)).toBe("Le Comptoir B")
})

test("une frappe pendant les dernières lectures du chargement est enregistrée", async ({ page }) => {
  // La page s'affiche dès que ses blocs sont lus ; restent le QR et les clics.
  // Avant v390, la sauvegarde ne s'armait qu'à la fin de ces deux lectures : une
  // frappe dans cette fenêtre (secondes sur un réseau mobile lent) n'était
  // programmée nulle part, et perdue si l'on quittait sans retoucher la page.
  let lacherLeQr!: () => void
  const qrRetenu = new Promise<void>(r => { lacherLeQr = r })
  let qrDemande = false
  const { base, nom } = await ouvrir(page, () => page.route(/supabase\.co\/rest\/v1\/qr_codes\?select=short_code/, async route => { qrDemande = true; await qrRetenu; await route.fallback() }))
  await expect.poll(() => qrDemande, { message: "la lecture du QR est bien suspendue" }).toBe(true)
  await nom.fill("Le Comptoir du marché")
  await expect.poll(titreEnBase(base), { message: "écrit sans attendre la lecture du QR" }).toBe("Le Comptoir du marché")
  lacherLeQr()
})
