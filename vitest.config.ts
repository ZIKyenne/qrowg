import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: {
    // Résout l'alias `@/…` comme Next (→ apps/web/src). Évite d'avoir à réécrire
    // les imports en relatif dans les modules testés (ex. lib/team → @/lib/slug).
    alias: {
      "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
    },
  },
  test: {
    include: ["apps/web/**/*.{test,spec}.ts", "apps/web/**/*.{test,spec}.tsx"],
    environment: "node",
    reporters: "default",
    // 30 s au lieu des 5 s par défaut.
    //
    // Une bonne part de cette suite, ce sont des GARDES D'ARCHITECTURE : elles
    // relisent tout le produit — parfois une fois par règle — pour vérifier
    // qu'aucun écran ne recopie ce qui doit vivre à un seul endroit. Elles
    // coûtent des secondes, et c'est normal.
    //
    // Le 29 septembre, une vingtaine d'entre elles échouaient sous Windows par
    // erreur : elles comparaient des chemins en barres obliques à des chemins
    // rendus par `path.join`, donc elles s'arrêtaient tôt sans rien lire. Une
    // fois réparées, elles lisent vraiment — et deux voisines se sont mises à
    // dépasser les 5 s. Un délai dépassé ne disait alors rien du produit : il
    // disait que la machine était chargée.
    testTimeout: 30_000,
  },
})
