import { test, expect } from "@playwright/test"
import { readdirSync, existsSync } from "node:fs"
import { join } from "node:path"

// bancsQuiDemarrent — M01b.
//
// ── Pourquoi ce fichier existe ─────────────────────────────────────────────
//
// Le 5 octobre, le relevé mobile a trouvé `/e2e-harness/onboarding` en **HTTP
// 500** aux trois largeurs : `useToast doit être utilisé à l'intérieur de
// <ToastProvider>`. Le banc montait `OnboardingClient` sans les deux
// fournisseurs que `DashboardShell` lui donne en production.
//
// Ce n'est pas la panne d'un banc, c'est un angle mort. Les vingt-quatre bancs
// `/e2e-harness/*` sont le SEUL moyen d'atteindre les écrans connectés depuis
// cet environnement — le projet Supabase de `.env.local` ne répond plus. Un banc
// en panne rend un écran invisible, et l'onboarding est l'écran le plus décisif
// du produit : vu une seule fois, il décide de la suite.
//
// Personne ne s'en est aperçu parce que les specs ciblent les bancs qu'elles
// utilisent. Un banc que personne n'ouvre peut pourrir indéfiniment.
//
// ── Ce que cette garde fait, et pourquoi ainsi ─────────────────────────────
//
// Elle LIT LE DOSSIER au lieu de porter une liste. Une liste figée aurait le
// même défaut que le silence : un banc ajouté demain n'y serait pas, et
// retomberait dans l'angle mort. Ici, ajouter un dossier à `e2e-harness/` suffit
// à être couvert.
//
// Elle vérifie un statut HTTP, pas une apparence : c'est le minimum
// indiscutable, et c'est exactement ce qui manquait.

const RACINE = join(__dirname, "..", "apps", "web", "src", "app", "e2e-harness")

/** Les bancs, découverts sur le disque — jamais une liste écrite à la main. */
function bancs(): string[] {
  return readdirSync(RACINE, { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(RACINE, e.name, "page.tsx")))
    .map(e => e.name)
    .sort()
}

test.describe("les bancs d'essai démarrent tous", () => {
  // Première exécution : `/e2e-harness/template-preview` a échoué, puis passé
  // seul en 12,9 s. Ce n'était pas le banc, c'était la garde. En `next dev`,
  // chaque route se **compile à la première requête** ; vingt-six compilations
  // qui se bousculent dépassent le délai par défaut de Playwright.
  //
  // Une garde qui rougit au hasard est pire qu'une garde absente : on prend
  // l'habitude de relancer. Elle est donc sérielle et patiente — elle met plus
  // longtemps, et elle ne ment pas.
  test.describe.configure({ mode: "serial", timeout: 120_000 })

  const liste = bancs()

  test("il y a bien des bancs à vérifier", () => {
    // Sans cette borne, la garde se tairait le jour où le chemin change :
    // `readdirSync` rendrait une liste vide et zéro test échouerait.
    expect(liste.length).toBeGreaterThan(15)
  })

  for (const nom of liste) {
    test(`/e2e-harness/${nom} répond 200`, async ({ page }) => {
      const erreurs: string[] = []
      page.on("pageerror", e => erreurs.push(e.message))

      const rep = await page.goto(`/e2e-harness/${nom}`, { waitUntil: "domcontentloaded" })

      expect(rep?.status(), `/e2e-harness/${nom} doit servir une page, pas une erreur`).toBe(200)

      // Un 200 ne suffit pas : Next sert une page d'erreur en 200 quand le
      // plantage vient du client. On lit donc aussi ce que la console a reçu.
      // On ne retient que les manques de fournisseur, parce que c'est la panne
      // de CETTE garde : un banc qui monte un écran sans ce que la production
      // lui donne. Les autres erreurs d'exécution relèvent des specs métier.
      const fournisseurManquant = erreurs.filter(m => /doit être utilisé à l'intérieur de|must be used within/i.test(m))
      expect(fournisseurManquant, `/e2e-harness/${nom} monte un écran sans son fournisseur`).toEqual([])
    })
  }
})
