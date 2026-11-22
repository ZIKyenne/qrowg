# 04 — Tests et mesures de référence (22 novembre 2026)

## Commandes du dépôt (vérifiées dans `package.json`)

| Commande | Résultat au 22/11 |
|---|---|
| `npm run type-check` (`tsc --noEmit`) | PASS, 0 erreur |
| `npm test` (Vitest) | PASS : 492 fichiers, 7 571 tests |
| `npx playwright test e2e/unSeulMenu.spec.ts e2e/barreDuBas.spec.ts --project=mobile` | PASS : 6/6 |
| `npx playwright test e2e/carteALaCreation.spec.ts` | PASS : 10/10 (bureau + mobile) |
| `npm run lint` | NON EXÉCUTÉ dans ce lot |
| `npm run build` | NON EXÉCUTÉ dans ce lot (le build Vercel le fait à chaque poussée) |

## Mesures existantes

Mesures du 20-21 novembre, méthode dans la mémoire « mesure-perf-editeur ».
- **Page publique, côté serveur :**
  - à chaud : 0,3-0,45 s ;
  - premier scan après une pause, sans réveil : 2,3-2,9 s ;
  - avec la sonde `/~reveil` et le réveil de la base : 1,16-1,53 s.
- **Éditeur :** build de production, processeur ralenti ×4, 4G lente. Jugé correct.

## Mesures absentes, à ne pas inventer

- **LCP, INP et CLS au 75e centile en conditions réelles :** aucun suivi des utilisateurs réels n'est en place, donc ces chiffres n'existent pas encore.
- **Temps jusqu'à la première publication chez un vrai novice :** demande une séance avec une personne.
- **Scan d'un QR imprimé :** demande un test physique.

## Limites de l'environnement

- **Plus de base locale** (projet Supabase supprimé). Les écrans connectés sont testés avec `e2e/sessionSimulee.ts`, les écrans isolés avec `/e2e-harness/*`.
- **Le projet Playwright « mobile »** est Chromium en 390×844 : ce n'est ni Safari iOS ni Chrome Android réels.
