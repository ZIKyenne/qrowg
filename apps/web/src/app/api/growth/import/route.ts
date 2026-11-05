// /api/growth/import — Juger une liste d'établissements collée.
//
// ── Ce que cette route NE FAIT PAS, et c'est le point ─────────────────────
//
// Elle n'écrit RIEN. Pas une ligne dans `growth_prospects`, pas une fiche
// gardée « pour plus tard ». Elle reçoit un texte, le juge, rend le verdict, et
// oublie tout.
//
// Ce n'est pas une étape intermédiaire en attendant mieux : constituer un
// fichier d'établissements tiers est précisément la décision qui n'est pas
// prise (base légale, durée de conservation, information des personnes — et
// pour un entrepreneur individuel, la dénomination EST un nom de personne).
// Tant qu'elle ne l'est pas, l'écran sert à REGARDER une liste, pas à la
// stocker. Le jour où la décision tombe, l'écriture s'ajoute ici ; en
// attendant, rien ne s'accumule à notre insu.
//
// Réservée aux administrateurs (`ADMIN_EMAILS`). Vide = personne, et c'est le
// défaut : un écran d'outillage interne n'a aucune raison d'être ouvert aux
// clients.

import { NextResponse, type NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { estAdministrateur } from "@/lib/admin"
import { lireListe, bilanDe, MAX_LIGNES } from "@/lib/growth/importProspects"

export const runtime = "nodejs"

/**
 * Au-delà, on ne lit même pas le corps.
 *
 * `MAX_LIGNES` borne ce qu'on TRAITE ; cette borne-ci protège la mémoire avant
 * d'avoir rien traité du tout. Une ligne large fait quelques centaines
 * d'octets : 400 Ko laissent largement la place aux 500 lignes annoncées.
 */
const MAX_OCTETS = 400_000

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (!estAdministrateur(user.email)) return NextResponse.json({ error: "Réservé" }, { status: 403 })

  let texte = ""
  try {
    const corps = await req.json()
    texte = typeof corps?.texte === "string" ? corps.texte : ""
  } catch {
    return NextResponse.json({ error: "Collage illisible" }, { status: 400 })
  }

  if (texte.length > MAX_OCTETS) {
    return NextResponse.json(
      { error: `Collage trop long. Au-delà de ${MAX_LIGNES} lignes, traitez la liste par lots.` },
      { status: 413 },
    )
  }

  const lecture = lireListe(texte)
  const bilan = bilanDe(lecture)

  return NextResponse.json({
    raison: lecture.raison,
    colonnes: lecture.colonnes,
    tronque: lecture.tronque,
    lues: lecture.lignes.length,
    maxLignes: MAX_LIGNES,
    retenus: bilan.retenus.map(l => ({
      numero: l.numero, nom: l.fiche.nom, commune: l.fiche.commune,
      activite: l.verdict.activite, siren: l.fiche.siren,
    })),
    ecartes: bilan.ecartes.map(l => ({
      numero: l.numero, nom: l.fiche.nom, refus: l.verdict.refus,
    })),
    parRaison: bilan.parRaison,
    doublons: bilan.doublons.map(l => ({ numero: l.numero, nom: l.fiche.nom, siren: l.fiche.siren })),
  })
}
