// Banc de l'« Appel en salle » (lot fast-food 2, 19 nov.) : le bloc tel qu'un
// client le voit à table. `?table=12` préremplit le numéro. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import BancAppel from "./BancAppel"

export const dynamic = "force-dynamic"

export default function E2EAppelServeur() {
  if (!harnessAutorise()) notFound()
  return <BancAppel />
}
