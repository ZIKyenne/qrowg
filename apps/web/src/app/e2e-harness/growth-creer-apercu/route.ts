// Fabrique un aperçu pour un prospect FICTIF, puis redirige vers son URL privée.
//
// GATÉE : 404 en production. C'est la seule entrée qui écrit dans
// `growth_previews`, et elle n'accepte que les trois établissements fictifs du
// dépôt — jamais un profil arbitraire envoyé dans la requête. Une route qui
// accepterait un JSON libre deviendrait un moyen d'écrire n'importe quoi dans
// la base sous couvert de démonstration.
//
// Pourquoi une route et non un bouton : le parcours complet — création,
// stockage, URL opaque, lecture, reprise — doit pouvoir se jouer d'un seul
// appel, en test comme à la main.

import { NextResponse, type NextRequest } from "next/server"
import { harnessAutorise } from "../gate"
import { creerApercu } from "@/lib/growth/depotApercus"
import { PROSPECTS_FICTIFS } from "@/lib/growth/prospectsFictifs"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!harnessAutorise()) return new NextResponse("Not found", { status: 404 })

  const demande = req.nextUrl.searchParams.get("prospect") ?? "bistrot"
  const fabrique = PROSPECTS_FICTIFS[demande]
  if (!fabrique) {
    return NextResponse.json(
      { erreur: "prospect inconnu", connus: Object.keys(PROSPECTS_FICTIFS) },
      { status: 400 },
    )
  }

  const resultat = await creerApercu(fabrique())
  if (!resultat) {
    // Le générateur a refusé : profil trop pauvre. On le DIT, au lieu de
    // fabriquer une page vide portant une enseigne.
    return NextResponse.json(
      { erreur: "profil trop pauvre pour une page personnalisée", prospect: demande },
      { status: 422 },
    )
  }

  // `?json=1` rend le jeton plutôt que de rediriger : c'est ce dont un test a
  // besoin pour vérifier l'URL avant de l'ouvrir.
  if (req.nextUrl.searchParams.get("json") === "1") {
    return NextResponse.json({
      jeton: resultat.jeton,
      url: `/apercu/${resultat.jeton}`,
      modele: resultat.page.modeleSource,
      faitsUtilises: resultat.page.faitsUtilises,
      aCompleter: resultat.page.aCompleter,
    })
  }

  return NextResponse.redirect(new URL(`/apercu/${resultat.jeton}`, req.nextUrl.origin))
}
