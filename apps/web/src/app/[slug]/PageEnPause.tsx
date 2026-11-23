// PageEnPause — ce que voit le client qui scanne un QR dont la page est en pause.
//
// ── Ce que cet écran doit faire, et ne pas faire ──────────────────────────
//
// Il remplace une page publiée dont le compte a dépassé ses trente jours
// d'essai. Trois exigences, et elles se contredisent si on n'y prend garde :
//
// 1. **Le QR doit rester bon.** Il est imprimé, collé sur une vitrine, posé
//    sur des tables. Un 404 apprendrait au client que ce code est cassé, et il
//    ne le rescannerait plus jamais — même une fois la page rouverte. On rend
//    donc un 200, et on dit explicitement que le code reste valable.
//
// 2. **Le visiteur n'a pas à connaître les affaires du commerçant.** Il ne lit
//    ni « essai », ni « abonnement », ni « impayé ». Ce serait l'humilier
//    devant son client. `essaiGratuit.test.ts` vérifie mot à mot que ces
//    termes n'apparaissent pas dans le message destiné au visiteur.
//
// 3. **Rien n'est indexé.** La page porte `noindex` tant qu'elle est en pause :
//    sans cela, un moteur garderait en cache une page d'attente à la place du
//    commerce, et c'est elle qui ressortirait le jour de la réouverture.
//
// L'écran reprend le FOND du thème du commerçant plutôt qu'un fond générique :
// un client qui scanne reconnaît les couleurs de la boutique et comprend qu'il
// est au bon endroit, pas sur une page d'erreur d'un service inconnu.
//
// Le texte suit ce fond (U4, revue du 23 nov.) : il était en ivoire fixe
// (#F5F0E8), donc ivoire sur ivoire, illisible, pour tout thème clair. L'encre
// est désormais calculée (`encreSur`, la même règle que les boutons) et le
// message n'est plus voilé d'opacité.
//
// Aucun JavaScript : c'est un composant serveur, et il n'a rien à animer.

import { MESSAGE_VISITEUR } from "@/lib/essaiGratuit"
import { encreSur } from "@/app/dashboard/builder/couleurLisible"

export function PageEnPause({ fond, titre }: { fond: string; titre?: string | null }) {
  const nom = (titre || "").trim()
  const encre = encreSur(fond)
  return (
    <main
      id="contenu"
      style={{
        minHeight: "100dvh",
        background: fond,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        {/* Le nom du commerce d'abord : le visiteur doit savoir en un coup d'œil
            qu'il n'est pas tombé sur une page d'erreur au hasard. */}
        {nom && (
          <p style={{ margin: "0 0 20px", fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.8, color: encre }}>
            {nom}
          </p>
        )}

        <h1 style={{ margin: "0 0 16px", fontSize: 26, lineHeight: 1.25, color: encre, textWrap: "balance" }}>
          {MESSAGE_VISITEUR.titre}
        </h1>

        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: encre, maxWidth: 380, marginInline: "auto" }}>
          {MESSAGE_VISITEUR.corps}
        </p>
      </div>
    </main>
  )
}
