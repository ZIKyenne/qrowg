import { defineConfig } from "@playwright/test"

// QA du site EN LIGNE — aucun serveur local, aucun build local.
//
// `playwright.config.ts` démarre un `next dev` et mesure le code de la machine.
// Celui-ci mesure ce que reçoit vraiment un visiteur, sur l'adresse donnée :
//
//     PROD_URL=https://qrowg.com npx playwright test e2e/galerieDeModeles.spec.ts --config=playwright.prod.config.ts
//
// Sans `PROD_URL`, il vise le domaine de production. Une nouvelle mise en ligne
// se vérifie donc sans rien reconstruire.
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  // Le réseau public a ses hoquets : un échec isolé ne vaut pas un verdict.
  retries: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.PROD_URL || "https://qrowg.com",
    browserName: "chromium",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
})
