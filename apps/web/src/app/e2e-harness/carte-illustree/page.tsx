// Banc de la « Carte illustrée » (lot fast-food, 18 nov.) : le bloc tel qu'un
// client le voit en scannant, sur un snack fictif. ?grille=1, ?theme=clair.
// GATÉ : 404 en production.
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import BancCarte from "./BancCarte"

export const dynamic = "force-dynamic"

export default function E2ECarteIllustree() {
  if (!harnessAutorise()) notFound()
  return <Suspense><BancCarte /></Suspense>
}
