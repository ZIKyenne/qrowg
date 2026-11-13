// Doublure de `server-only` pour Vitest.
//
// Le paquet `server-only` n'a qu'un seul rôle : faire ÉCHOUER la compilation
// quand un module serveur entre dans un bundle client. C'est une protection de
// build, et elle reste entière — `npm run build` la vérifie à chaque passage,
// et `ignoreBuildErrors` est à `false`.
//
// Sous Vitest il n'y a pas de bundle client, donc rien à protéger, et le paquet
// n'est pas résolvable : trois modules du moteur de croissance
// (`depotApercus`, `purgeApercus`, `allerChercher`) étaient de ce fait
// impossibles à tester unitairement, alors que deux d'entre eux portent des
// gardes de sécurité.
//
// Cette doublure ne fait rien, et c'est exactement ce qu'on lui demande.
export {}
